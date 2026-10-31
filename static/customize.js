// iframe page resizing
const divider = document.getElementById("divider");
const container = document.getElementById("split-container")
const leftPanel = document.querySelector(".menu");

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
          // Reload iframe only
          const iframe = document.querySelector(".preview-page");
          iframe.src = iframe.src; // refresh iframe only
      } else {
          console.error("Failed to update colors.");
      }
  });
});





