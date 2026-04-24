/* Notepad — open/save text files in the FS */
WM.registerApp({
  id: 'notepad',
  title: 'Notepad',
  icon: '📝',
  multi: true,
  window: { width: 480, height: 360 },
  mount(w, opts) {
    w.bodyEl.classList.add('notepad-body');
    w.bodyEl.innerHTML = `
      <div class="menu-bar">
        <span class="mi" data-m="file">File</span>
        <span class="mi" data-m="edit">Edit</span>
        <span class="mi" data-m="format">Format</span>
        <span class="mi" data-m="help">Help</span>
      </div>
      <textarea class="notepad-area" spellcheck="false"></textarea>
    `;
    const area = w.bodyEl.querySelector('textarea');
    const status = w.el.querySelector('.win-status');
    status.hidden = false;
    status.innerHTML = '<span data-pos>Ln 1, Col 1</span><span class="spacer"></span><span data-size>0 chars</span>';

    let currentPath = opts.path || null;
    let dirty = false;

    function setTitle() {
      const name = currentPath ? currentPath.split(/[\\/]/).pop() : 'Untitled';
      w.setTitle((dirty ? '*' : '') + name + ' — Notepad');
    }

    async function loadPath(p) {
      const content = FS.readFile(p);
      if (content == null) { Toast('Cannot open: ' + p); return; }
      area.value = content;
      currentPath = p;
      dirty = false;
      setTitle();
      updateStatus();
    }

    if (opts.path) loadPath(opts.path);
    else setTitle();

    area.addEventListener('input', () => { dirty = true; setTitle(); updateStatus(); });
    area.addEventListener('keyup', updateStatus);
    area.addEventListener('click', updateStatus);

    function updateStatus() {
      const val = area.value;
      const caret = area.selectionStart;
      const pre = val.slice(0, caret);
      const line = (pre.match(/\n/g) || []).length + 1;
      const col = caret - (pre.lastIndexOf('\n') + 1) + 1;
      status.querySelector('[data-pos]').textContent = `Ln ${line}, Col ${col}`;
      status.querySelector('[data-size]').textContent = `${val.length} chars`;
    }

    const menuActions = {
      file: [
        { label: 'New', action: () => { if (!confirmLose()) return; area.value = ''; currentPath = null; dirty = false; setTitle(); updateStatus(); } },
        { label: 'Open…', action: openDialog },
        { label: 'Save', action: save },
        { label: 'Save As…', action: saveAs },
        { sep: true },
        { label: 'Close', action: () => w.close() }
      ],
      edit: [
        { label: 'Select All', action: () => area.select() },
        { label: 'Cut', action: () => document.execCommand('cut') },
        { label: 'Copy', action: () => document.execCommand('copy') },
        { label: 'Paste', action: () => navigator.clipboard.readText().then(t => { insert(t); }).catch(() => {}) }
      ],
      format: [
        { label: 'Word Wrap', action: () => area.classList.toggle('wrap') }
      ],
      help: [
        { label: 'About Notepad', action: () => WM.open('about') }
      ]
    };

    function insert(text) {
      const s = area.selectionStart, e = area.selectionEnd;
      area.value = area.value.slice(0, s) + text + area.value.slice(e);
      area.selectionStart = area.selectionEnd = s + text.length;
      dirty = true; setTitle(); updateStatus();
    }

    function confirmLose() {
      if (!dirty) return true;
      return confirm('You have unsaved changes. Discard?');
    }

    function save() {
      if (!currentPath) return saveAs();
      FS.writeFile(currentPath, area.value);
      dirty = false; setTitle();
      Toast('Saved ' + currentPath.split(/[\\/]/).pop());
    }

    function saveAs() {
      const dir = currentPath ? FS.parentOf(currentPath) : 'C:\\My Documents';
      const name = prompt('Save as (filename):', currentPath ? currentPath.split(/[\\/]/).pop() : 'Untitled.txt');
      if (!name) return;
      const path = dir.replace(/[\\/]$/, '') + '\\' + name;
      FS.writeFile(path, area.value);
      currentPath = path;
      dirty = false; setTitle();
      Toast('Saved ' + name);
    }

    function openDialog() {
      const path = prompt('Open (path):', 'C:\\My Documents\\readme.txt');
      if (!path) return;
      if (!confirmLose()) return;
      loadPath(path);
    }

    w.bodyEl.querySelectorAll('.menu-bar .mi').forEach(mi => {
      mi.addEventListener('click', e => {
        e.stopPropagation();
        const r = mi.getBoundingClientRect();
        showMenu(r.left, r.bottom, menuActions[mi.dataset.m]);
      });
    });

    function showMenu(x, y, items) {
      const cm = document.getElementById('context-menu');
      cm.innerHTML = '';
      const ul = document.createElement('ul');
      items.forEach(it => {
        const li = document.createElement('li');
        if (it.sep) li.className = 'sep';
        else {
          li.textContent = it.label;
          li.addEventListener('click', () => { cm.hidden = true; it.action && it.action(); });
        }
        ul.appendChild(li);
      });
      cm.appendChild(ul);
      cm.style.left = x + 'px';
      cm.style.top = y + 'px';
      cm.hidden = false;
    }

    // Ctrl+S
    area.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
    });
  }
});
