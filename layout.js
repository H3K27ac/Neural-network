const container = document.querySelector('.container');
const windows = document.querySelectorAll('.dockable-window');
const dockAreas = document.querySelectorAll('.dock-area');

let draggedWindow = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let snapTarget = null;
let zIndexCounter = 10;

// --- docking data ---
const dockMap = new Map();   // window → area
const originalSize = new Map();


// Helper Functions

function showDockAreas() {
    dockAreas.forEach(a => a.style.display = 'block');
}

function hideDockAreas() {
    dockAreas.forEach(a => a.style.display = 'none');
}

function getNearestDockArea() {
    const win = draggedWindow.getBoundingClientRect();
    let nearest = null;
    let distMin = 99999;

    dockAreas.forEach(area => {
        const r = area.getBoundingClientRect();
        const dx = (win.left + win.width/2) - (r.left + r.width/2);
        const dy = (win.top + win.height/2) - (r.top + r.height/2);
        const d = Math.hypot(dx, dy);

        if (d < distMin && d < 150) {
            distMin = d;
            nearest = area;
        }
    });

    return nearest;
}

function undock(win) {
    const area = dockMap.get(win);
    if (!area) return;

    // Remove tab
    const tabBar = area.querySelector('.tabs');
    const content = area.querySelector('.tab-content');

    const tab = tabBar.querySelector(`[data-win="${win.dataset.id}"]`);
    if (tab) tab.remove();

    const iframe = content.querySelector(`[data-win="${win.dataset.id}"]`);
    if (iframe) iframe.remove();

    dockMap.delete(win);

    // Restore floating window
    const size = originalSize.get(win);
    win.style.width = size.w + 'px';
    win.style.height = size.h + 'px';
    win.style.display = 'block';
}

function dockToArea(win, area) {
    undock(win);

    dockMap.set(win, area);   // ✔ store actual element, no more strings

    win.style.display = 'none';

    const tabBar = area.querySelector('.tabs');
    const content = area.querySelector('.tab-content');
    const areaType = [...area.classList].find(c =>
        ['top','bottom','left','right','center'].includes(c)
    );

    // CENTER: only one window, no tabs
    if (areaType === 'center') {
        if (tabBar) tabBar.style.display = 'none'; 
        if (content) {
            content.innerHTML = '';
            const holder = document.createElement('div');
            holder.dataset.win = win.dataset.id;
            holder.appendChild(win.querySelector('.body').cloneNode(true));
            content.appendChild(holder);
        }
        return;
    }

    // Create tab
    if (tabBar) tabBar.style.display = 'flex';
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.textContent = win.querySelector('header').innerText;
    tab.dataset.win = win.dataset.id;

    tab.onclick = () => activateTab(area, tab.dataset.win);

    tabBar.appendChild(tab);

    // Create content frame
    const panel = document.createElement('div');
    panel.dataset.win = win.dataset.id;
    panel.style.width = '100%';
    panel.style.height = '100%';
    panel.style.display = 'none';
    panel.appendChild(win.querySelector('.body').cloneNode(true));

    content.appendChild(panel);

    activateTab(area, win.dataset.id);
}

function activateTab(area, winId) {
    const tabs = area.querySelectorAll('.tab');
    const panels = area.querySelectorAll('.tab-content > div');

    tabs.forEach(t => t.classList.toggle('active', t.dataset.win === winId));
    panels.forEach(p => p.style.display = (p.dataset.win === winId ? 'block' : 'none'));
}

// Drag Logic


windows.forEach((win, i) => {
    win.dataset.id = i; // unique ID

    const header = win.querySelector('header');
    const rect = win.getBoundingClientRect();
    originalSize.set(win, { w: rect.width, h: rect.height });

    header.addEventListener('pointerdown', e => {
        draggedWindow = win;

        undock(win);

        const r = win.getBoundingClientRect();
        dragOffsetX = e.clientX - r.left;
        dragOffsetY = e.clientY - r.top;

        win.style.zIndex = ++zIndexCounter;

        showDockAreas();

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    });
});

function onMove(e) {
    if (!draggedWindow) return;

    const containerRect = container.getBoundingClientRect();

    const x = e.clientX - containerRect.left - dragOffsetX;
    const y = e.clientY - containerRect.top - dragOffsetY;

    draggedWindow.style.left = x + 'px';
    draggedWindow.style.top = y + 'px';

    dockAreas.forEach(a => a.classList.remove('hovered'));

    const near = getNearestDockArea();
    if (near) {
        snapTarget = near;
        near.classList.add('hovered');
    } else {
        snapTarget = null;
    }
}

function onUp(e) {
    if (!draggedWindow) return;

    if (snapTarget) dockToArea(draggedWindow, snapTarget);
    else undock(draggedWindow);

    hideDockAreas();
    dockAreas.forEach(a => a.classList.remove('hovered'));

    draggedWindow = null;
    snapTarget = null;

    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
}
