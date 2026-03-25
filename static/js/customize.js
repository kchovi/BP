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
                <legend>Service Section</legend>
                <button type="button" class="edit_button" @click="invisible = !invisible">Edit</button>
                <button type="button" class="edit_remove_button" @click="remove('${fs.id}')">Remove</button>
                <div class="edit_hidden flex column" :class="invisible ? 'invisible' : ''">
                    <label>Název:</label>
                    <input type="text" class="service_name" value="Služba" @input="updateSection('${fs.id}', 'name', $event.target.value)">
                    <label>Popisek:</label>
                    <textarea class="service_text" @input="updateSection('${fs.id}', 'text', $event.target.value)">Popisek služby...</textarea>
                    <label>Obrázek služby</label>
                    <input class="button service_img" type="file" @change="updateImg">
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

        updateImg(event) {
            const file = event.target.files[0];
            if (!file) return;

           
            const serviceId = event.target.closest('.edit_container.service').id;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.updateSection(serviceId, 'img', e.target.result);
            };
            reader.readAsDataURL(file);

            const form = new FormData();
            form.append("img", file);
            fetch("/upload_service_img", { method: "POST", body: form })
                .then(res => res.json())
                .then(data => {
                    if (data.url) {
                        this.updateSection(serviceId, "img", data.url);
                        this.debouncedSave();
                    }
                });
        },

        updateSection(id, type, value) {
            const section = iframe.getElementById(id);

            if (type === 'name') {
                section.querySelector('.section_name').textContent = value;
            }

            if (type === 'text') {
                section.querySelector('.section_text').textContent = value;
            }

            if (type === 'img') {
                const img = section.querySelector('img');
                img.src = value;
                document.getElementById(id).dataset.img = value;
            }
            this.debouncedSave();
        },

        saveTimeout: null,

        debouncedSave() {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => this.save(), 500);
        },

        async save() {
            const aboutSection = document.getElementById('about');
            const aboutText = aboutSection?.querySelector('#about_text')?.value || "";
            const aboutVisibility = aboutSection?.querySelector('#about_visibility').checked;

            const services = [];
            document.querySelectorAll('.service').forEach(service => {
                services.push({
                    name: service.querySelector(".service_name")?.value || "",
                    text: service.querySelector(".service_text")?.value || "",
                    img: service.dataset.img || ""
                });
            });

            const formData = {
                about: {
                    text: aboutText,
                    visible: aboutVisibility
                },
                services: services
            };

            await fetch("/site_content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
        }

    }
}



