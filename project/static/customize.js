// iframe page resizing
const divider = document.getElementById("divider");
const container = document.getElementById("split-container")
const leftPanel = document.querySelector(".menu");
let isResizing = Boolean

divider.addEventListener("mousedown", (e) => {
  e.preventDefault();
  isResizing = true;
  divider.setPointerCapture(e.pointerId);
});

divider.addEventListener("pointermove", (e) => {
  if (!isResizing) return;

  const containerRect = container.getBoundingClientRect();
  const newLeftWidth = e.clientX - containerRect.left;

  if (newLeftWidth < containerRect.width - 220) {
      leftPanel.style.flex = `0 0 ${newLeftWidth}px`;
  }
});

divider.addEventListener("pointerup", (e) => {
  if (isResizing) {
      isResizing = false;
      divider.releasePointerCapture(e.pointerId);
  }
});

// sidebar
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggleBtn");

toggleBtn.addEventListener("click", () => {
  const isActive = sidebar.classList.toggle("active");
});

// side bar tabs
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-tab");

    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    tabPanels.forEach(panel => {
      panel.classList.remove("active");
      if (panel.id === target) {
        panel.classList.add("active");
      }
    });
  });
});;

//style

const iframe = document.querySelector(".preview-page");

document.querySelectorAll('input[name="style"]').forEach((input) => {
    input.addEventListener('change', function () {
        const selectedStyle = this.value;

        fetch("/site_style", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `style=${encodeURIComponent(selectedStyle)}`
        }).then(response => {
            if (response.ok) {
                iframe.src = `/pages/style${selectedStyle}/index.html`;
            }
        });
    });
});


//info



document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("info_form");

  form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);

      const response = await fetch("/site_info", {
          method: "POST",
          body: formData
      });

      if (response.ok) {
        iframe.contentWindow.location.reload();
        iframe.contentWindow.document.querySelector(".map").contentWindow.document.reload()
      }
      else {
        console.error("Failed to update info.");
      } 
  });
});


const info_reset_btn = document.getElementById("info_reset");

info_reset_btn.addEventListener("click", async () => {

  const response = await fetch("/site_info", {
    method: "POST",
    body: "RESET"
  });

  if (response.ok) {
    iframe.contentWindow.location.reload();
  }
  else {
    console.error("Failed to reset info.");
  } 
  
});

//logo upload

const logo_input = document.querySelector(`input[name="logo"]`);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("logo_form");

  form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);

      const response = await fetch("/logo_uploader", {
          method: "POST",
          body: formData
      });

      if (response.ok) {
        iframe.contentWindow.location.reload();
      }
      else {
        console.error("Failed to upload logo.");
      } 
  });
});


const logo_reset_btn = document.getElementById("logo_reset");

logo_reset_btn.addEventListener("click", async () => {

  

  const response = await fetch("/logo_uploader", {
    method: "POST",
    body: "RESET"
  });
  

  if (response.ok) {
    iframe.contentWindow.location.reload();
    document.querySelector(`input[name="logo"]`).value= null;

  }
  else {
    console.error("Failed to reset logo.");
  } 
  
});



// color stuff
const main_clr = document.querySelector(`input[name="--main-clr"]`);
const secondary_clr = document.querySelector(`input[name="--secondary-clr"]`);
const acc_clr = document.querySelector(`input[name="--acc-clr"]`);

function update_colors() {
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  if (!iframeDoc) return;

  iframeDoc.documentElement.style.setProperty('--main-clr', main_clr.value);
  iframeDoc.documentElement.style.setProperty('--secondary-clr', secondary_clr.value);
  iframeDoc.documentElement.style.setProperty('--acc-clr', acc_clr.value);
}

iframe.addEventListener("load", () => {
  update_colors();
});

//custom color picker

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("custom_color_form");

  form.addEventListener("submit", async (e) => {
      e.preventDefault();

      update_colors();

      const formData = new FormData(form);

      const response = await fetch("/user_defined_colors", {
          method: "POST",
          body: formData
      });

      if (!response.ok) {
        console.error("Failed to update colors.");
      } 

  });
});

//predefined color palletes

document.addEventListener("DOMContentLoaded", () => {
  const colorForms = document.querySelectorAll(".color_form");

  colorForms.forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

      iframeDoc.documentElement.style.setProperty('--main-clr', formData.get('--main-clr'));
      iframeDoc.documentElement.style.setProperty('--secondary-clr', formData.get('--secondary-clr'));
      iframeDoc.documentElement.style.setProperty('--acc-clr', formData.get('--acc-clr'));


      const response = await fetch("/user_defined_colors", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        console.error("Failed to update colors.");
      } 
    });
  });
});

//rest button for both

const color_reset_btn = document.getElementById("color_reset");

color_reset_btn.addEventListener("click", async () => {

  main_clr.value = "#f7f7ff";
  secondary_clr.value = "#eeeeee";
  acc_clr.value = "#f598b4";
  update_colors();

  const response = await fetch("/user_defined_colors", {
    method: "POST",
    body: "RESET"
  });

  if (!response.ok) {
    console.error("Failed to reset colors.");
  }
  
});






