
// sidebar
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggleBtn");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});


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
      try {
        await fetch('/save_last_tab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tab })
        });
      } catch (e) {
        console.warn("Failed to save last tab", e);
      }
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
      const iframe = document.querySelector("#preview-page");
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) return;

      const map = {
        site_name: "#site-name",
        email: "#email",
        tel: "#tel",
        addr: "#addr",
        fb: "#fb",
      };

      const liMap = {
        fb: "fb",
        email: "email",
        tel: "tel",
        addr: "addr",
      };

      const el = iframeDoc.querySelector(map[field]);
      if (el) el.querySelector("p").textContent = value;

      // if no info == no contact item
      const li = liMap[field] ? iframeDoc.getElementById(liMap[field]) : null;
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
      const iframe = document.querySelector("#preview-page");
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) return;

      const mapEl = iframeDoc.querySelector("#map-iframe");
      const formData = new FormData();
      formData.append("addr", addr);
      const res = await fetch("/generate_map_url", { method: "POST", body: formData });
      const { url } = await res.json();

      if (mapEl) mapEl.src = url;
    },
  };
}

//style
function reload_iframe() {
  const iframe = document.querySelector("#preview-page");
  if (iframe) iframe.contentWindow.location.reload();
}

document.body.addEventListener("htmx:afterRequest", (e) => {
  if (e.detail.target.id === "preview-page") {
    reload_iframe();
  }
});



function colorPicker(initialMain, initialSecondary, initialAccent) {
  return {
    main: initialMain,
    secondary: initialSecondary,
    accent: initialAccent,
    selectedPalette: null,

    updateIframe() {
      const iframe = document.querySelector("#preview-page");
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) return;
      let styleEl = iframeDoc.getElementById("theme-vars");
      if (!styleEl) {
        styleEl = iframeDoc.createElement("style");
        styleEl.id = "theme-vars";
        iframeDoc.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        :root {
          --main-clr: ${this.main};
          --secondary-clr: ${this.secondary};
          --acc-clr: ${this.accent};
        }
      `;
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
      this.saveColors();
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



// edit
const contentForm = document.getElementById("content_edit_form");

// EDIT toggle
contentForm.addEventListener("click", (e) => {

  if (e.target.classList.contains("edit_button")) {
    e.preventDefault();

    const container = e.target.closest(".edit_container");
    const editElements = container.querySelectorAll(".edit_hidden");

    editElements.forEach((el) => {
      el.classList.toggle("invisible");
    });
  }

});

const fieldsetContainer = document.getElementById("services_container")
const addBtn = document.getElementById("add_service_section");

addBtn.addEventListener("click", () => {

  const fieldset = document.createElement("fieldset");
  fieldset.className = "edit_container section_block";
  fieldset.dataset.type = "service"

  let inner = "";
  inner = `
      <label>Název:</label>
      <input type="text" class="service_name">

      <label>Popisek:</label>
      <textarea class="service_text"></textarea>

      <label>Obrázek služby</label>
      <input class="button service_img" type="file">
    `;


  fieldset.innerHTML = `
    <legend>Service Section</legend>

    <button type="button" class="edit_button">Edit</button>
    <button type="button" class="edit_remove_button">Remove</button>

    <div class="edit_hidden invisible flex column">
      ${inner}
    </div>
  `;



  fieldsetContainer.appendChild(fieldset)

});


// removing serivces
contentForm.addEventListener("click", (e) => {

  if (e.target.classList.contains("edit_remove_button")) {
    e.preventDefault();
    e.target.closest(".section_block").remove();
  }

});



contentForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  const sections = [];

  document.querySelectorAll(".section_block").forEach(section => {

    const type = section.dataset.type;

    if (type === "hero") {

      sections.push({
        type: "hero",
        text: section.querySelector(".hero_text").value
      });

    }

    if (type === "about") {

      sections.push({
        type: "about",
        text: section.querySelector(".about_text").value
      });

    }

    if (type === "service") {

      sections.push({
        type: "service",
        name: section.querySelector(".service_name").value,
        text: section.querySelector(".service_text").value,
        img: section.querySelector(".service_img").value
      });

    }

  });

  const response = await fetch("/site_content", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sections })
  });

  if (response.ok) {
    iframe.contentWindow.location.reload();
  }

});


contentForm.addEventListener("reset", async (e) => {
  e.preventDefault();


  const response = await fetch("/site_content", {
    method: "POST",
    body: "RESET"
  });


  if (response.ok) {
    iframe.contentWindow.location.reload();
  }
  else {
    console.error("Failed to reset content.");
  }

});