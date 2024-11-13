const horizontalThreshold = 2000; // in px
const verticalThreshold = 1200;   // in px

function createPanel(id, left, top, width, height, label) {
    const panelDiv = document.createElement('div');
    panelDiv.classList.add('panel');
    panelDiv.style.left = left + 'px';
    panelDiv.style.top = top + 'px';
    panelDiv.style.width = width + 'px';
    panelDiv.style.height = height + 'px';
    panelDiv.innerHTML = label;
    panelDiv.id = id;
    document.body.appendChild(panelDiv);
}

function updateLayout() {
    const width = screen.width;
    const height = screen.height;

    const existingPanels = document.querySelectorAll('.panel');
    existingPanels.forEach(panel => panel.remove());

    let panelColumns = width > horizontalThreshold ? 2 : 1;
    let panelRows = height > verticalThreshold ? 2 : 1;

    let panelWidth = width / panelColumns;
    let panelHeight = height / panelRows;

    for (let row = 0; row < panelRows; row++) {
        for (let column = 0; column < panelColumns; column++) {
            const panelId = `panel-${row}-${column}`;
            const left = column * panelWidth;
            const top = row * panelHeight;
            const label = `Panel ${row * panelColumns + column + 1}`;
            createPanel(panelId, left, top, panelWidth, panelHeight, label);
        }
    }
}

// Initial update
updateLayout();
window.addEventListener("resize", updateLayout);