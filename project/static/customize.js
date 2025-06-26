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
});

// color stuff

function reset_iframe() {
  const iframe = document.querySelector(".preview-page");
  iframe.contentWindow.location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("colorForm");


  form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);

      const response = await fetch("/user_defined_colors", {
          method: "POST",
          body: formData
      });

      if (response.ok) {
          reset_iframe();
      } else {
          console.error("Failed to update colors.");
      }
  });
});


const reset_btn = document.getElementById("color_reset");

reset_btn.addEventListener("click", async () => {

  const response = await fetch("/user_defined_colors", {
      method: "POST",
      body: "RESET"
  });

  if (response.ok) {
    reset_iframe();
    document.querySelector(`input[name="--clr-acc"]`).value = "#f598b4";
    document.querySelector(`input[name="--bg-acc-clr"]`).value = "#ffeffb";
    document.querySelector(`input[name="--bg-clr"]`).value = "#fffafa";
  } else {
    console.error("Failed to reset colors.");
  }
  
});






