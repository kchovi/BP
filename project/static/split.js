const divider = document.getElementById("divider");
const container = document.getElementById("main")
const leftPanel = document.querySelector(".menu");

let isResizing = false;

divider.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isResizing = true;
    divider.setPointerCapture(e.pointerId);
});

divider.addEventListener("pointermove", (e) => {
    if (!isResizing) return;

    const containerRect = container.getBoundingClientRect();
    const newLeftWidth = e.clientX - containerRect.left;

    if (newLeftWidth > 100 && newLeftWidth < containerRect.width - 100) {
        leftPanel.style.flex = `0 0 ${newLeftWidth}px`;
    }
});

divider.addEventListener("pointerup", (e) => {
    if (isResizing) {
        isResizing = false;
        divider.releasePointerCapture(e.pointerId);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
    }
});

