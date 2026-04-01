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

function logoUploader() {
    return {
        upload(event) {
            const file = event.target.files[0];

            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('logo_preview').innerHTML = `<img src="${e.target.result}" class="img-preview">`;
                const img = iframe.getElementById('logo');
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);

            const form = new FormData();
            form.append('logo', file);
            fetch('/logo_uploader', { method: 'POST', body: form });
        },

        reset() {
            document.getElementById('logo_preview').innerHTML = '';
            document.getElementById('logo_input').value = '';
            const img = iframe.getElementById('logo');
            img.src = "/themes_shared_static/logo-placeholder.svg";

            const form = new FormData();
            form.append('reset', 'true');
            fetch('/logo_uploader', { method: 'POST', body: form });
        }
    }
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
            this.debouncedSave();
        },

        remove(id) {
            document.getElementById(id).remove();
            iframe.getElementById(id).remove();
            this.fixReverse();
            this.debouncedSave();
        },

        fixReverse() {
            const servicesList = iframe.getElementById('services-list');
            const lst = servicesList.querySelectorAll('.services')

            for (let index = 0; index < lst.length; index++) {
                const service = lst[index];
                const inner = service.querySelector('.article-services');
                inner.classList.remove('reverse');
                if ((index + 1) % 2 === 0) {
                    inner.classList.add('reverse');
                }
            }

        },

        reset() {
            document.getElementById('about_text').textContent = "Toto je text o mě"
            document.getElementById('services_container').replaceChildren();
            this.addServiceToSidebar('service_1');
            this.addServiceToSidebar('service_2');
            document.querySelectorAll('input[id$="_visibility"]').forEach(checkbox => {
                checkbox.checked = true;
            });
        },

        addService() {
            const id = `service_${crypto.randomUUID()}`
            this.addServiceToSidebar(id)
            this.addServiceToIframe(id)
            this.debouncedSave();
        },


        addServiceToSidebar(id) {
            const container = document.getElementById('services_container');
            const fs = document.createElement('fieldset');
            fs.className = 'edit_container service';
            fs.id = id;
            fs.setAttribute('x-data', "{invisible : true}");
            fs.dataset.img = '';
            fs.innerHTML = `
                <legend class="fieldset_name">Služba</legend>
                <button type="button" class="edit_button" @click="invisible = !invisible">Edit</button>
                <button type="button" class="edit_remove_button" @click="remove('${fs.id}')">Remove</button>
                <div class="edit_hidden flex column" :class="invisible ? 'invisible' : ''">
                    <label>Název:</label>
                    <input type="text" class="service_name" value="Služba" @input="updateSection('${fs.id}', 'name', $event.target.value)">
                    <label>Popisek:</label>
                    <textarea class="service_text" @input="updateSection('${fs.id}', 'text', $event.target.value)">Popisek služby...</textarea>
                    <label>Obrázek služby</label>
                    <input class="button service_img" type="file" accept="image/*" @change="updateSection('${id}', 'img', $event.target.files[0])">
                    <div class="service_img_preview"></div>
                    <label>Cena:</label>
                    <input type="number" min="0" step="50" value="0" class="service_price">
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

            const idx = wrapper.querySelectorAll('.services').length + 1;
            const inner = newService.querySelector('.article-services');
            if (idx % 2 === 0) {
                inner.classList.add('reverse');
            }

            wrapper.appendChild(newService);
        },

        updateImg(file, id) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const sidebarEl = document.getElementById(id);
                this.showPreview(sidebarEl?.querySelector('.service_img_preview'), e.target.result);
                this.setIframeImg(id, e.target.result);
            };
            reader.readAsDataURL(file);

            const form = new FormData();
            form.append('img', file);
            fetch('/upload_service_img', { method: 'POST', body: form })
                .then(res => res.json())
                .then(data => {
                    const path = `/themes_shared_static/uploads/services/${data.filename}`;
                    document.getElementById(id).dataset.img = path;
                    this.debouncedSave();
                });
        },

        setIframeImg(id, src) {
            const section = iframe.getElementById(id);
            const img = section.querySelector('.service-img');
            img.src = src;
        },

        showPreview(container, imageUrl) {
            if (container?.classList.contains('service_img_preview')) {
                container.innerHTML = `<img src="${imageUrl}" class="img-preview">`;
            }
        },

        updateSection(id, type, value) {
            const section = iframe.getElementById(id);
            const siderbarSection = document.getElementById(id);


            if (type === 'name') {
                section.querySelector('.section_name').textContent = value;
                siderbarSection.querySelector('.fieldset_name').textContent = value;
            }

            if (type === 'text') {
                section.querySelector('.section_text').textContent = value;
            }

            if (type === 'img') {
                this.updateImg(value, id);
                return;
            }

            if (type === 'price') { }
            this.debouncedSave();
        },

        saveTimeout: null,

        debouncedSave() {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => this.save(), 500);
        },

        async save() {
            const content = [];

            const aboutSection = document.getElementById('about');
            content.push({
                id: "about",
                name: aboutSection?.querySelector('#about_name')?.value || "",
                text: aboutSection?.querySelector('#about_text')?.value || "",
                visible: aboutSection?.querySelector('#about_visibility')?.checked || false,
            });

            const services = Array.from(document.querySelectorAll('.service')).map(service => ({
                name: service.querySelector(".service_name")?.value || "",
                text: service.querySelector(".service_text")?.value || "",
                img: service.dataset.img || "",
                price: service.querySelector(".service_price")?.value || 0,
            }));

            content.push({
                id: "services",
                name: "Služby",
                service_list: services
            });

            document.querySelectorAll('.edit_container:not(.service)').forEach(section => {
                if (['about', 'services'].includes(section.id)) return;

                content.push({
                    id: section.id,
                    name: section.querySelector('legend')?.textContent || "",
                    visible: section.querySelector(`#${section.id}_visibility`)?.checked || false
                });
            });

            await fetch("/site_content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content })
            });
        }

    }
}


function initEditFormMonitoring() {
    const iframeEl = iframe.el;
    const editPanel = document.querySelector('#edit');
    const editForm = document.querySelector('#content_edit_form');

    // Create warning message once
    let messageEl = document.querySelector('.edit-disabled-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.className = 'edit-disabled-message';
        messageEl.innerHTML = `<span>⚠️</span><p>Vraťte se zpět na <strong>Úvod</strong> pro úpravu obsahu</p>`;
        messageEl.style.cssText = `
            transform: translateY(-50%);
            background-color: var(--main-clr);
            color: var(--text-primary);
            padding: 20px 30px;
            border-radius: var(--radius-md);
            border: var(--border-strong);
            text-align: center;
            font-weight: 500;
            display: none;
            box-shadow: var(--shadow-soft);
            width: 60%;
            margin: 0 auto;
`;
        const anchor = document.createElement('div');
        anchor.style.cssText = 'position: sticky; top: 50%; height: 0; overflow: visible; z-index: 1000;';
        anchor.appendChild(messageEl);
        editPanel.prepend(anchor);
    }

    function updateFormState() {

        const currentUrl = iframeEl.contentWindow.location.href;
        const isMainPage = currentUrl.includes('index.html') ||
            currentUrl.endsWith('/') ||
            !currentUrl.includes('.html') ||
            currentUrl.includes('index.html#');

        if (isMainPage) {
            editForm.style.pointerEvents = 'auto';
            editForm.style.opacity = '1';
            messageEl.style.display = 'none';
        } else {
            editForm.style.pointerEvents = 'none';
            editForm.style.opacity = '0.5';
            messageEl.style.display = 'block';
        }
    }

    iframeEl.addEventListener('load', updateFormState);
    updateFormState();
}

document.addEventListener('DOMContentLoaded', () => {
    initEditFormMonitoring();
});

