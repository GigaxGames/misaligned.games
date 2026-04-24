/* Excel — static spreadsheet view, tables only */
(function () {
  const COLS = 12;
  const ROWS = 24;

  function injectStyles() {
    if (document.getElementById('excel-styles')) return;
    const s = document.createElement('style');
    s.id = 'excel-styles';
    s.textContent = `
      .excel-body { display: flex; flex-direction: column; background: var(--surface); height: 100%; }
      .excel-fbar { display: flex; align-items: center; gap: 4px; padding: 3px 4px; background: var(--surface); border-bottom: 1px solid var(--shadow-dark); }
      .excel-fbar { font-size: calc(1.5vh * var(--app-zoom, 1)); }
      .excel-fbar .excel-ref { width: calc(6vh * var(--app-zoom, 1)); padding: 2px 4px; font-family: "Tahoma", sans-serif; font-weight: 700; text-align: center; background: #fff; border: 1px inset var(--shadow-dark); }
      .excel-fbar .excel-fx { color: #b1331b; font-weight: 700; font-style: italic; padding: 0 4px; }
      .excel-fbar .excel-finput { flex: 1; padding: 2px 4px; font-family: "Consolas", "Courier New", monospace; background: #fff; border: 1px inset var(--shadow-dark); min-height: 1.6vh; }
      .excel-scroll { flex: 1; overflow: auto; background: #fff; }
      .excel-grid { border-collapse: collapse; table-layout: fixed; font-family: "Tahoma", sans-serif; font-size: calc(1.7vh * var(--app-zoom, 1)); }
      .excel-grid th, .excel-grid td { border: 1px solid #c6c3b6; height: calc(2.8vh * var(--app-zoom, 1)); width: calc(8vh * var(--app-zoom, 1)); vertical-align: middle; padding: 0 0.5vh; }
      .excel-grid th.row-head, .excel-grid th.corner { width: calc(3vh * var(--app-zoom, 1)); }
      .excel-grid th { background: linear-gradient(to bottom, #eceae1, #d4d0c4); color: #333; text-align: center; font-weight: 400; user-select: none; position: sticky; top: 0; z-index: 2; }
      .excel-grid th.row-head { position: sticky; left: 0; top: auto; z-index: 1; width: calc(3.2vh * var(--app-zoom, 1)); }
      .excel-grid th.corner { position: sticky; left: 0; top: 0; z-index: 3; width: calc(3.2vh * var(--app-zoom, 1)); }
      .excel-grid td { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; background: #fff; }
      .excel-grid td.num { text-align: right; font-variant-numeric: tabular-nums; }
      .excel-grid td.active { outline: 2px solid #1746c4; outline-offset: -2px; background: #e8efff; }
      .excel-status { display: flex; align-items: center; gap: 8px; padding: 2px 6px; background: var(--surface); border-top: 1px solid var(--shadow-dark); font-size: calc(1.3vh * var(--app-zoom, 1)); color: #333; }
      .excel-status .spacer { flex: 1; }
    `;
    document.head.appendChild(s);
  }

  function colLetter(i) {
    let s = '', n = i + 1;
    while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
    return s;
  }

  const SEED = {
    'A1': 'Item',   'B1': 'Qty', 'C1': 'Price', 'D1': 'Total',
    'A2': 'Widget', 'B2': '3',   'C2': '4.50',  'D2': '13.50',
    'A3': 'Gizmo',  'B3': '7',   'C3': '2.25',  'D3': '15.75',
    'A4': 'Gadget', 'B4': '2',   'C4': '9.99',  'D4': '19.98',
    'A5': 'Doohickey','B5': '12','C5': '0.75',  'D5': '9.00',
    'A7': 'Total',  'D7': '58.23'
  };

  WM.registerApp({
    id: 'excel',
    title: 'Excel',
    icon: '📊',
    multi: true,
    window: { width: 640, height: 440 },
    mount(w, opts) {
      injectStyles();
      opts = opts || {};
      const DATA = opts.cells || SEED;
      if (opts.title) w.setTitle(opts.title + ' — Excel');
      w.bodyEl.classList.add('excel-body');
      w.bodyEl.innerHTML = `
        <div class="menu-bar">
          <span class="mi">File</span>
          <span class="mi">Edit</span>
          <span class="mi">View</span>
          <span class="mi">Insert</span>
          <span class="mi">Format</span>
          <span class="mi">Tools</span>
          <span class="mi">Data</span>
          <span class="mi">Help</span>
        </div>
        <div class="excel-fbar">
          <div class="excel-ref" data-ref>A1</div>
          <div class="excel-fx">fx</div>
          <div class="excel-finput" data-finput>Item</div>
        </div>
        <div class="excel-scroll">
          <table class="excel-grid" data-grid></table>
        </div>
        <div class="excel-status"><span>Ready</span><span class="spacer"></span><span>Sheet1</span></div>
      `;

      const grid = w.bodyEl.querySelector('[data-grid]');
      const refEl = w.bodyEl.querySelector('[data-ref]');
      const finput = w.bodyEl.querySelector('[data-finput]');

      const thead = document.createElement('thead');
      const hrow = document.createElement('tr');
      const corner = document.createElement('th'); corner.className = 'corner';
      hrow.appendChild(corner);
      for (let c = 0; c < COLS; c++) {
        const th = document.createElement('th');
        th.textContent = colLetter(c);
        hrow.appendChild(th);
      }
      thead.appendChild(hrow);
      grid.appendChild(thead);

      const tbody = document.createElement('tbody');
      for (let r = 0; r < ROWS; r++) {
        const tr = document.createElement('tr');
        const rh = document.createElement('th');
        rh.className = 'row-head';
        rh.textContent = String(r + 1);
        tr.appendChild(rh);
        for (let c = 0; c < COLS; c++) {
          const td = document.createElement('td');
          const key = colLetter(c) + (r + 1);
          const v = DATA[key];
          if (v != null) {
            td.textContent = v;
            if (!isNaN(parseFloat(v)) && /^-?[0-9]*\.?[0-9]+$/.test(String(v).trim())) td.classList.add('num');
          }
          td.dataset.key = key;
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      grid.appendChild(tbody);

      let active = null;
      grid.addEventListener('click', e => {
        const td = e.target.closest('td');
        if (!td) return;
        if (active) active.classList.remove('active');
        td.classList.add('active');
        active = td;
        refEl.textContent = td.dataset.key;
        finput.textContent = td.textContent;
      });

      const first = grid.querySelector('td');
      if (first) { first.classList.add('active'); active = first; }

      /* Pick up the current global zoom level */
      if (window.AppZoom) setTimeout(() => window.AppZoom.apply(), 0);
    }
  });
})();
