const iframe = {
    get el() {
        return document.querySelector("#preview-page");
    },
    get doc() {
        return this.el?.contentDocument || this.el?.contentWindow.document;
    },
    reload() {
        this.el?.contentWindow.location.reload();
    },
    getElementById(id) {
        return this.doc?.getElementById(id);
    },
    querySelector(el) {
        return this.doc?.querySelector(el);
    },
    querySelectorAll(el) {
        return this.doc.querySelectorAll(el);
    }
};


// sidebar

function sidebarTabs(initialTab) {
    return {
        activeTab: initialTab,
        collapsed: false,

        // submits the info tab form 
        setTab(tab) {
            if (this.activeTab === 'info') {
                document.dispatchEvent(new CustomEvent('info-tab-leave'));
            }
            this.activeTab = tab;
            this.saveLastTab(tab);
        },

        async saveLastTab(tab) {
            await fetch('/save_last_tab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tab })
            });
        }
    }
}

// info
function liveInfoUpdate() {
    return {
        saveTimeout: null,

        init() {
            document.addEventListener('info-tab-leave', () => {
                this.saveInfo(document.getElementById('info_form'));
            });
        },

        updateIframe(field, value) {
            const liMap = {
                fb: "fb",
                email: "email",
                tel: "tel",
                addr: "addr",
            };

            if (field == "site_name") {
                const site_name = iframe.getElementById("site-name");
                if (site_name) site_name.textContent = value;
            }

            const el = iframe.getElementById(liMap[field]);
            if (el) el.querySelector("p").textContent = value;

            // if no info == no contact item
            const li = liMap[field] ? iframe.getElementById(liMap[field]) : null;
            if (li) li.classList.toggle("invisible", value.trim() === "");

            // debounced autosave
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                this.saveInfo(document.getElementById("info_form"));
            }, 600);
        },

        async saveInfo(formEl) {
            const data = new FormData(formEl);
            await fetch("/site_info", { method: "POST", body: data });
        },

        addrTimeout: null,

        handleAddr(value) {
            this.updateIframe("addr", value);

            clearTimeout(this.addrTimeout);
            this.addrTimeout = setTimeout(() => this.updateMap(value), 800);
        },

        async updateMap(addr) {
            const mapEl = iframe.querySelector("#map-iframe");
            const formData = new FormData();
            formData.append("addr", addr);
            const res = await fetch("/generate_map_url", { method: "POST", body: formData });
            const { url } = await res.json();

            if (mapEl) mapEl.src = url;
        },
    };
}

//style
document.body.addEventListener("htmx:afterRequest", (e) => {
    if (e.detail.target.id === "preview-page") {
        iframe.reload();
    }
});


function colorPicker(initialMain, initialSecondary, initialAccent) {
    return {
        main: initialMain,
        secondary: initialSecondary,
        accent: initialAccent,
        selectedPalette: null,

        updateIframe() {
            let styleEl = iframe.getElementById("theme-vars");
            if (!styleEl) {
                styleEl = iframe.doc.createElement("style");
                styleEl.id = "theme-vars";
                iframe.doc.head.appendChild(styleEl);
            }
            styleEl.textContent = `
        :root {
          --main-clr: ${this.main};
          --secondary-clr: ${this.secondary};
          --acc-clr: ${this.accent};
        }
      `;
            this.saveColors();
        },

        async saveColors() {
            const formData = new FormData();
            formData.append("--main-clr", this.main);
            formData.append("--secondary-clr", this.secondary);
            formData.append("--acc-clr", this.accent);
            await fetch("/user_defined_colors", { method: "POST", body: formData });
        },

        applyPalette(main, secondary, accent, index) {
            this.main = main;
            this.secondary = secondary;
            this.accent = accent;
            this.selectedPalette = index;
            this.updateIframe();
        },

        async resetColors() {
            this.main = "#f7f7ff";
            this.secondary = "#eeeeee";
            this.accent = "#FFA348";
            this.selectedPalette = null;
            this.updateIframe();
            await fetch("/user_defined_colors", { method: "POST", body: "RESET" });
        },

        init() {
            // Initialize iframe with the last saved colors
            this.updateIframe();
        }
    }
}


function editor() {
    return {
        toggleRemove(id) {
            iframe.getElementById(id).classList.toggle("invisible");
        },

        remove(id) {

            document.getElementById(id).remove();
            iframe.getElementById(id).remove();
        },

        reset() {
            document.getElementById('services_container').replaceChildren();
            this.addServiceToSidebar('service_1');
            this.addServiceToSidebar('service_2');
        },

        addService() {
            const id = `service_${crypto.randomUUID()}`
            this.addServiceToSidebar(id)
            this.addServiceToIframe(id)
        },
        

        addServiceToSidebar(id) {
            const container = document.getElementById('services_container');
            const fs = document.createElement('fieldset');
            fs.className = 'edit_container section_block';
            fs.id = id;
            fs.setAttribute('x-data', "{invisible : true}");
            fs.dataset.type = 'service';
            fs.dataset.img = ''; 'service_{$}'
            fs.innerHTML = `
                <legend>Service Section</legend>
                <button type="button" class="edit_button" @click="invisible = !invisible">Edit</button>
                <button type="button" class="edit_remove_button" @click="remove('${fs.id}')">Remove</button>
                <div class="edit_hidden flex column" :class="invisible ? 'invisible' : ''">
                    <label>Název:</label>
                    <input type="text" class="service_name" value="" @input="updateSection('${fs.id}', 'name', $event.target.value)">
                    <label>Popisek:</label>
                    <textarea class="service_text" @input="updateSection('${fs.id}', 'text', $event.target.value)"></textarea>
                    <label>Obrázek služby</label>
                    <input class="button service_img" type="file">
                </div>
            `;

            container.appendChild(fs);
        },

        addServiceToIframe(id) {

            const wrapper = iframe.getElementById('services-list');

            const serviceTemplate = iframe.getElementById('service-template').cloneNode(true);
            const newService = iframe.doc.createElement('div');
            newService.innerHTML = serviceTemplate.innerHTML;
            newService.className = 'flex services';
            newService.id = `${id}`;

            const idx = wrapper.querySelectorAll('.services').length;
            const inner = newService.querySelector('.article-services');
            if (idx % 2 === 0) {
                inner.classList.add('reverse');
            }

            wrapper.appendChild(newService);
        },

        updateSection(id, type, value) {
            const section = iframe.getElementById(id);
            
            if (type === 'name') {
                section.querySelector('.section_name').textContent = value;
            }

            if (type === 'text') {
                section.querySelector('.section_text').textContent = value;
            }
        },
        
    }
}



function liveEditUpdate() {
    return {
        saveTimeout: null,

        init() {
            // wire up existing (server-rendered) service fieldsets
            document.querySelectorAll('#services_container .section_block').forEach(fs => {
                this.bindFieldset(fs);
            });

            // non-service section textareas
            document.querySelectorAll('#content_edit_form > fieldset.section_block').forEach(block => {
                const type = block.dataset.type;

                block.querySelector('textarea')?.addEventListener('input', e => {
                    this.updateSectionText(type, e.target.value);
                });
                block.querySelector('input[type="checkbox"]')?.addEventListener('change', e => {
                    this.toggleSection(type, e.target.checked);
                });
                block.querySelector('.edit_button')?.addEventListener('click', () => {
                    block.querySelector('.edit_hidden').classList.toggle('invisible');
                });
            });

            // event delegation for dynamic service fieldsets (edit / remove buttons)
            document.getElementById('services_container').addEventListener('click', e => {
                const fs = e.target.closest('.section_block');
                if (!fs) return;
                if (e.target.classList.contains('edit_button'))
                    fs.querySelector('.edit_hidden').classList.toggle('invisible');
                if (e.target.classList.contains('edit_remove_button'))
                    this.removeService(fs);
            });

            // add service button
            // document.getElementById('add_service_section').addEventListener('click', () => {
            //     this.addService();
            // });
        },

        // ─── helpers ──────────────────────────────────────────

        // 1-based position of a service fieldset in the editor
        serviceIndex(fieldset) {
            return [...document.querySelectorAll('#services_container .section_block')]
                .indexOf(fieldset);
        },

        // ─── non-service sections ─────────────────────────────

        updateSectionText(type, value) {
            const selectors = { about: '#about p.text', hero: '#hero p.text' };
            const el = iframe.querySelector(selectors[type]);
            if (el) el.textContent = value;
            this.debouncedSave();
        },

        toggleSection(type, visible) {
            iframe.querySelector(`#${type}`)?.classList.toggle('invisible', !visible);
            this.debouncedSave();
        },

        // ─── service sections ─────────────────────────────────

        // bind inputs on a fieldset (works for both existing and newly created ones)
        bindFieldset(fs) {
            fs.querySelector('.service_name')?.addEventListener('input', e => {
                const el = iframe.querySelector(`#service_${this.serviceIndex(fs)} h3.heading`);
                if (el) el.textContent = e.target.value;
                this.debouncedSave();
            });
            fs.querySelector('.service_text')?.addEventListener('input', e => {
                const el = iframe.querySelector(`#service_${this.serviceIndex(fs)} p.text`);
                if (el) el.textContent = e.target.value;
                this.debouncedSave();
            });
            fs.querySelector('.service_img')?.addEventListener('change', async e => {
                const file = e.target.files[0];
                if (!file) return;
                const fd = new FormData();
                fd.append('img', file);
                const res = await fetch('/upload_service_img', { method: 'POST', body: fd });
                const { url } = await res.json();
                const img = iframe.querySelector(`#service_${this.serviceIndex(fs)} img`);
                if (img) img.src = url;
                fs.dataset.img = url;
                this.debouncedSave();
            });
        },

        addService() {
            const container = document.getElementById('services_container');
            const idx = container.querySelectorAll('.section_block').length + 1;

            // 1. add fieldset to editor
            const fs = document.createElement('fieldset');
            fs.className = 'edit_container section_block';
            fs.dataset.type = 'service';
            fs.dataset.img = '';
            fs.innerHTML = `
                <legend>Service Section</legend>
                <button type="button" class="edit_button">Edit</button>
                <button type="button" class="edit_remove_button">Remove</button>
                <div class="edit_hidden flex column">
                    <label>Název:</label>
                    <input type="text" class="service_name" placeholder="Název služby">
                    <label>Popisek:</label>
                    <textarea class="service_text" placeholder="Popis služby..."></textarea>
                    <label>Obrázek služby</label>
                    <input class="button service_img" type="file">
                </div>`;
            container.appendChild(fs);
            this.bindFieldset(fs);

            // 2. mirror into iframe
            this.insertIframeService(idx, '', '', '/themes_shared_static/555.png');
            this.debouncedSave();
        },

        removeService(fs) {
            const idx = this.serviceIndex(fs);

            // remove from iframe and re-number
            iframe.getElementById(`service_${idx}`)?.remove();
            iframe.querySelectorAll('[id^="service_"]').forEach((el, i) => {
                el.id = `service_${i + 1}`;
                // keep reverse class in sync with odd/even
                const inner = el.querySelector('.article-services');
                if (inner) {
                    inner.classList.toggle('reverse', (i + 1) % 2 === 0);
                }
            });

            fs.remove();
            this.debouncedSave();
        },

        // builds and appends a service block into the iframe
        insertIframeService(idx, name, text, imgSrc) {
            const wrapper = iframe.getElementById('services-list');
            if (!wrapper) return;

            const reverse = idx % 2 === 0 ? 'reverse' : '';
            const div = iframe.doc.createElement('div');
            div.className = 'flex services';
            div.id = `service_${idx}`;
            div.innerHTML = `
                <div class="flex article-services ${reverse} corner-2 box-shadow">
                    <div class="article bg-color-secondary">
                        <article class="box-margin">
                            <h3 class="heading">${name}</h3>
                            <p class="text">${text}</p>
                        </article>
                    </div>
                    <img src="${imgSrc}" alt="img">
                </div>
                <div class="flex center">
                    <a class="button box-margin box-shadow" href="gallery.html">Více Fotek</a>
                </div>`;
            wrapper.appendChild(div);
        },

        // ─── persistence ──────────────────────────────────────

        debouncedSave() {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => this.saveContent(), 600);
        },

        saveContent() {
            const sections = [];

            // non-service (preserves order from the DOM)
            document.querySelectorAll('#content_edit_form > fieldset.section_block').forEach(block => {
                sections.push({
                    type: block.dataset.type,
                    text: block.querySelector('textarea')?.value ?? '',
                });
            });

            // services
            document.querySelectorAll('#services_container .section_block').forEach(block => {
                sections.push({
                    type: 'service',
                    name: block.querySelector('.service_name')?.value ?? '',
                    text: block.querySelector('.service_text')?.value ?? '',
                    img: block.dataset.img ?? '',
                });
            });

            return fetch('/site_content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sections }),
            });
        },
    };
}



