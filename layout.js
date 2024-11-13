function createColumn() {
    const columnDiv = document.createElement('div');
    const addPanelButton = document.createElement('button');
    addPanelButton.onclick = function() {
        columnDiv.appendChild(createPanel(true));
    }
    columnDiv.appendChild(addPanelButton);
    columnDiv.appendChild(createPanel(false));
    columnDiv.appendChild(createDeleteButton());
    body.appendChild(columnDiv);
}

function createPanel(removable) {
    const panelDiv = document.createElement('div');
    panelDiv.classList.add('panel');
    if (removable) {
        panelDiv.appendChild(createDeleteButton());
    }
    return panelDiv;
}

function createDeleteButton() {
    const deleteButton = document.createElement('button');
    deleteButton.className = "delete-button";
    deleteButton.onclick = deleteParent(deleteButton);
    return deleteButton;
}


function deleteParent(button) {
    button.parentElement.remove();
}
