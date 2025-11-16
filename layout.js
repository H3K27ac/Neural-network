const container = document.querySelector('.container');
const windows = document.querySelectorAll('.dockable-window');
const dockAreas = document.querySelectorAll('.dock-area');
const displayDockAreas = document.querySelectorAll('.display-dock-area');

let draggedWindow = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let snapTarget = null;
let zIndexCounter = 10;

// --- docking data ---
const dockMap = new Map();   // window → area
const originalSize = new Map();
const dockTabsCache = new WeakMap(); // areaElement → DockTabs instance

class DockTabs {
    constructor(areaEl) {
        this.area = areaEl;

        // Ensure structure exists
        this.tabBar = areaEl.querySelector('.dock-tabs');
        this.contentBox = areaEl.querySelector('.dock-content');

        // Create if missing
        if (!this.tabBar) {
            this.tabBar = document.createElement('div');
            this.tabBar.className = 'dock-tabs';
            areaEl.appendChild(this.tabBar);
        }

        if (!this.contentBox) {
            this.contentBox = document.createElement('div');
            this.contentBox.className = 'dock-content';
            areaEl.appendChild(this.contentBox);
        }

        this.tabBar.style.display = 'flex';
    }

    addTab(win) {
        const id = win.dataset.id;

        // --- Create tab button ---
        const tab = document.createElement('div');
        tab.className = 'dock-tab';
        tab.textContent = win.querySelector('header').innerText;
        tab.dataset.win = id;

        // --- Create content panel ---
        const panel = document.createElement('div');
        panel.className = 'dock-panel';
        panel.dataset.win = id;
        panel.appendChild(win.querySelector('.body').cloneNode(true));

        // Add to DOM
        this.tabBar.appendChild(tab);
        this.contentBox.appendChild(panel);

        // Activate on click
        tab.onclick = () => this.activate(id);

        // Auto-activate if it's the only one
        this.activate(id);
    }

    removeTab(win) {
        const id = win.dataset.id;

        const tab = this.tabBar.querySelector(`[data-win="${id}"]`);
        const panel = this.contentBox.querySelector(`[data-win="${id}"]`);

        if (tab) tab.remove();
        if (panel) panel.remove();

        // Activate first remaining tab
        const first = this.tabBar.querySelector('.dock-tab');
        if (first) this.activate(first.dataset.win);
        else this.clearActive();
    }

    activate(winId) {
        this.tabBar.querySelectorAll('.dock-tab')
            .forEach(t => t.classList.toggle('active', t.dataset.win === winId));

        this.contentBox.querySelectorAll('.dock-panel')
            .forEach(p => p.classList.toggle('active', p.dataset.win === winId));
    }

    clearActive() {
        this.tabBar.querySelectorAll('.dock-tab').forEach(t => t.classList.remove('active'));
        this.contentBox.querySelectorAll('.dock-panel').forEach(p => p.classList.remove('active'));
    }
}






// Helper Functions

function getTabs(area) {
    if (!dockTabsCache.has(area)) {
        dockTabsCache.set(area, new DockTabs(area));
    }
    return dockTabsCache.get(area);
}

function showDockAreas() {
    displayDockAreas.forEach(a => a.style.display = 'block');
}

function hideDockAreas() {
    displayDockAreas.forEach(a => a.style.display = 'none');
}

function getNearestDockArea() {
    const win = draggedWindow.getBoundingClientRect();
    let nearest = null;
    let distMin = 99999;

    displayDockAreas.forEach(area => {
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

    const tabs = dockTabsCache.get(area);
    if (tabs) {
        tabs.removeTab(win);
    }

    dockMap.delete(win);

    // restore floating window size and display
    const size = originalSize.get(win);
    win.style.width = size.w + "px";
    win.style.height = size.h + "px";
    win.style.display = "block";
}

function dockToArea(win, displayArea) {
    undock(win);

    const areaType = [...displayArea.classList].find(c =>
        ['top','bottom','left','right','center'].includes(c)
    );

    const area = document.querySelector(`.dock-area.${areaType}`);

    dockMap.set(win, area);  

    win.style.display = 'none';

    // CENTER: only one window, no tabs
    if (areaType === 'center') {
        let content = area.querySelector('.dock-content');

        if (!content) {
            content = document.createElement('div');
            content.className = 'dock-content';
            area.appendChild(content);
        }

        content.innerHTML = '';

        const panel = document.createElement('div');
        panel.className = 'dock-panel active';
        panel.appendChild(win.querySelector('.body').cloneNode(true));
        content.appendChild(panel);

        return;
    }

    // ----- Other regions: create or use tab system -----
    const tabs = getTabs(area);
    tabs.addTab(win);

    tabs.activate(win.dataset.id);
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
    displayDockAreas.forEach(a => a.classList.remove('hovered'));

    draggedWindow = null;
    snapTarget = null;

    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
}
