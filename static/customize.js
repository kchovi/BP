// // iframe page resizing
// const divider = document.getElementById("divider");
// const container = document.getElementById("split-container")
// const leftPanel = document.querySelector(".menu");
// let isResizing = Boolean

// divider.addEventListener("mousedown", (e) => {
//   e.preventDefault();
//   isResizing = true;
//   divider.setPointerCapture(e.pointerId);
// });

// divider.addEventListener("pointermove", (e) => {
//   if (!isResizing) return;

//   const containerRect = container.getBoundingClientRect();
//   const newLeftWidth = e.clientX - containerRect.left;

//   if (newLeftWidth < containerRect.width - 220) {
//     leftPanel.style.flex = `0 0 ${newLeftWidth}px`;
//   }
// });

// divider.addEventListener("pointerup", (e) => {
//   if (isResizing) {
//     isResizing = false;
//     divider.releasePointerCapture(e.pointerId);
//   }
// });



// sidebar
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggleBtn");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
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
        iframe.src = `/preview/index.html`;
      }
    });
  });
});



// color stuff
var main_clr;
var secondary_clr;
var acc_clr;

function update_colors() {
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  if (!iframeDoc) return;

  const styleEl = iframeDoc.getElementById("theme-vars");

  styleEl.textContent = `
        :root {
            --main-clr: ${main_clr};
            --secondary-clr: ${secondary_clr};
            --acc-clr: ${acc_clr};
        }`;
}

//custom color picker

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("custom_color_form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    main_clr = formData.get('--main-clr');
    secondary_clr = formData.get('--secondary-clr');
    acc_clr = formData.get('--acc-clr');

    update_colors();

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

      main_clr = formData.get('--main-clr');
      secondary_clr = formData.get('--secondary-clr');
      acc_clr = formData.get('--acc-clr');

      update_colors();

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

//reset button for both

const color_reset_btn = document.getElementById("color_reset");

color_reset_btn.addEventListener("click", async () => {

  main_clr = "#f7f7ff";
  secondary_clr = "#eeeeee";
  acc_clr = "#FFA348";
  update_colors();

  const response = await fetch("/user_defined_colors", {
    method: "POST",
    body: "RESET"
  });

  if (!response.ok) {
    console.error("Failed to reset colors.");
  }

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
      // iframe.contentWindow.document.querySelector(".map").contentWindow.document.reload()
    }
    else {
      console.error("Failed to update info.");
    }
  });
});


const info_reset_btn = document.getElementById("info_reset");

info_reset_btn.addEventListener("click", async (e) => {
  e.preventDefault();

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

logo_reset_btn.addEventListener("click", async (e) => {
  e.preventDefault();


  const response = await fetch("/logo_uploader", {
    method: "POST",
    body: "RESET"
  });


  if (response.ok) {
    iframe.contentWindow.location.reload();
    document.querySelector(`input[name="logo"]`).value = null;

  }
  else {
    console.error("Failed to reset logo.");
  }

});

// edit

// edit system (works for static + dynamically added services)

const contentForm = document.getElementById("content_edit_form");
let serviceIndex = document.querySelectorAll('[id^="service_"]').length;


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


// REMOVE service
contentForm.addEventListener("click", async (e) => {

  if (e.target.classList.contains("edit_remove_button")) {

    e.preventDefault();

    const container = e.target.closest(".edit_container");
    const containerId = container.id;

    const response = await fetch("/site_content/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: containerId })
    });

    if (response.ok) {
      container.remove();
    }
  }

});


// ADD SERVICE
const addServiceBtn = document.getElementById("add_service");

if (addServiceBtn) {

  addServiceBtn.addEventListener("click", () => {

    serviceIndex++;

    const fieldset = document.createElement("fieldset");
    fieldset.className = "edit_container";
    fieldset.id = `service_${serviceIndex}`;

    fieldset.innerHTML = `
      <legend>Service ${serviceIndex}</legend>

      <button type="button" class="edit_button">Edit</button>
      <button type="button" class="edit_remove_button">Remove</button>

      <div class="edit_hidden invisible flex column">

        <label>Název:</label>
        <input type="text" name="service_${serviceIndex}_name">

        <label>Popisek:</label>
        <textarea name="service_${serviceIndex}_text"></textarea>

      </div>
    `;

    const submitBtn = contentForm.querySelector('input[type="submit"]');

    contentForm.insertBefore(fieldset, submitBtn);

  });

}