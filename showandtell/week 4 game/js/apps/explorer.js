/* File Explorer — navigate virtual FS */
WM.registerApp({
  id: 'explorer',
  title: 'My Computer',
  icon: '📁',
  window: { width: 580, height: 400 },
  onReopen(w, opts) { if (opts && opts.path) w.state.navigate(opts.path); },
  mount(w, opts) {
    w.bodyEl.classList.add('exp-app');
    w.bodyEl.innerHTML = `
      <div class="menu-bar">
        <span class="mi" data-m="file">File</span>
        <span class="mi" data-m="edit">Edit</span>
        <span class="mi" data-m="view">View</span>
        <span class="mi" data-m="help">Help</span>
      </div>
      <div class="toolbar">
        <button class="btn" data-back title="Back" style="min-width:auto;padding:0 8px">←</button>
        <button class="btn" data-fwd title="Forward" style="min-width:auto;padding:0 8px">→</button>
        <button class="btn" data-up title="Up" style="min-width:auto;padding:0 8px">↑</button>
        <div class="exp-addr">
          <label>Address</label>
          <input type="text" data-addr />
          <button class="btn" data-go style="min-width:auto">Go</button>
        </div>
      </div>
      <div class="exp-sidebar" data-side></div>
      <div class="exp-main" data-main></div>
      <div class="win-status"><span data-count></span><span class="spacer"></span><span data-free>Free space: plenty</span></div>
    `;
    w.el.querySelector('.win-status').hidden = false;

    const addr = w.bodyEl.querySelector('[data-addr]');
    const main = w.bodyEl.querySelector('[data-main]');
    const side = w.bodyEl.querySelector('[data-side]');
    const status = w.el.querySelector('.win-status');

    const history = [];
    let hi = -1;

    function navigate(path, push = true) {
      const node = FS.resolvePath(path);
      if (!node) { Toast('Not found: ' + path); return; }
      if (node.type !== 'dir') { FS.openPath(path); return; }
      const clean = 'C:\\' + FS.normalize(path).join('\\');
      addr.value = clean.replace(/\\$/, '') || 'C:\\';
      if (push) {
        history.length = hi + 1;
        history.push(clean);
        hi = history.length - 1;
      }
      render(node);
      w.setTitle((FS.normalize(clean).pop() || 'My Computer') + ' — Explorer');
    }

    w.state.navigate = navigate;

    function render(node) {
      main.innerHTML = '';
      const items = node.children.slice().sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      if (!items.length) {
        main.innerHTML = '<div class="muted" style="padding:10px">This folder is empty.</div>';
      }
      items.forEach(child => {
        const el = document.createElement('div');
        el.className = 'exp-item';
        el.innerHTML = `
          <div class="exp-item-img">${child.icon || (child.type === 'dir' ? '📁' : '📄')}</div>
          <div class="exp-item-name">${esc(child.name)}</div>
        `;
        el.addEventListener('click', e => {
          main.querySelectorAll('.exp-item.selected').forEach(i => i.classList.remove('selected'));
          el.classList.add('selected');
          e.stopPropagation();
        });
        el.addEventListener('dblclick', () => {
          const cur = FS.normalize(addr.value);
          const p = 'C:\\' + [...cur, child.name].join('\\');
          if (child.type === 'dir') navigate(p);
          else FS.openPath(p);
        });
        main.appendChild(el);
      });
      status.querySelector('[data-count]').textContent = items.length + ' object(s)';
    }

    function esc(s) { return String(s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); }

    function renderSidebar() {
      const shortcuts = [
        { label: 'Desktop', path: 'C:\\Desktop' },
        { label: 'My Documents', path: 'C:\\My Documents' },
        { label: 'My Pictures', path: 'C:\\My Pictures' },
        { label: 'My Music', path: 'C:\\My Music' },
        { label: 'Recycle Bin', path: 'C:\\Recycle Bin' }
      ];
      side.innerHTML = `<div class="exp-side-group"><div class="exp-side-title">Other Places</div></div>`;
      const g = side.querySelector('.exp-side-group');
      shortcuts.forEach(s => {
        const el = document.createElement('div');
        el.className = 'exp-side-item';
        el.textContent = s.label;
        el.addEventListener('click', () => navigate(s.path));
        g.appendChild(el);
      });
    }

    w.bodyEl.querySelector('[data-back]').addEventListener('click', () => {
      if (hi > 0) { hi--; navigate(history[hi], false); }
    });
    w.bodyEl.querySelector('[data-fwd]').addEventListener('click', () => {
      if (hi < history.length - 1) { hi++; navigate(history[hi], false); }
    });
    w.bodyEl.querySelector('[data-up]').addEventListener('click', () => {
      const parent = FS.parentOf(addr.value);
      navigate(parent);
    });
    w.bodyEl.querySelector('[data-go]').addEventListener('click', () => navigate(addr.value));
    addr.addEventListener('keydown', e => {
      if (e.key === 'Enter') navigate(addr.value);
    });
    main.addEventListener('click', e => {
      if (e.target === main) {
        main.querySelectorAll('.exp-item.selected').forEach(i => i.classList.remove('selected'));
      }
    });

    renderSidebar();
    navigate(opts.path || 'C:\\');
  }
});
