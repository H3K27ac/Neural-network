function createPanel(panelId) {
    const panelDiv = document.createElement('div');
    panelDiv.classList.add('panel');
    panelDiv.id = panelId;
}

panelLayout = [1];

function addPanel(columnIndex) {
    panelLayout[columnIndex]++;
    const columnDiv = document.getElementById(`column-${columnIndex}`);
    const panelId = `panel-${columnIndex}-${panelLayout[columnIndex]}`;
    const panelDiv = createPanel(columnId, panelId);
    columnDiv.appendChild(panelDiv);
}

function addColumn() {
    panelCounts.push(1);
    updateLayout();
}

function updateLayout() {
    const body = document.querySelector('body');

    const existingColumns = document.querySelectorAll('.column');
    existingColumns.forEach(column => column.remove());

    for (let column = 0; column < panelLayout.length; column++) {
        const columnId = `column-${column}`;
        const columnDiv = document.createElement('div');
        columnDiv.classList.add('column');
        columnDiv.id = columnId;

        for (let panel = 0; panel < panelLayout[column]; panel++) {
            const panelId = `panel-${column}-${panel}`;
            const panelDiv = createPanel(panelId);
            columnDiv.appendChild(panelDiv);
        }
        body.appendChild(columnDiv);
    }
}