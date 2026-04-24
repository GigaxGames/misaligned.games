/* Virtual filesystem — seeded from JSON, mutations in localStorage */
(function () {
  const KEY = 'cmc:windows:fs';
  const emitter = new EventTarget();
  let root = null;
  let seeded = false;

  async function load() {
    if (seeded) return root;
    const saved = tryLoad();
    if (saved) {
      root = saved;
      seeded = true;
      return root;
    }
    try {
      const res = await fetch('./data/filesystem.json', { cache: 'no-store' });
      root = await res.json();
    } catch (e) {
      console.error('fs seed failed', e);
      root = { name: 'C:', type: 'dir', children: [] };
    }
    seeded = true;
    save();
    return root;
  }

  function tryLoad() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(root)); } catch {}
    emitter.dispatchEvent(new CustomEvent('change', { detail: {} }));
  }

  function resolvePath(path) {
    if (!root) return null;
    if (!path || path === '/' || path === 'C:\\' || path === 'C:') return root;
    const parts = normalize(path);
    let node = root;
    for (const p of parts) {
      if (!node.children) return null;
      const next = node.children.find(c => c.name.toLowerCase() === p.toLowerCase());
      if (!next) return null;
      node = next;
    }
    return node;
  }

  function normalize(path) {
    return String(path || '')
      .replace(/^C:\\?/i, '')
      .replace(/^\/+/, '')
      .split(/[\\/]+/)
      .filter(Boolean);
  }

  function parentOf(path) {
    const parts = normalize(path);
    parts.pop();
    return parts.length ? ('C:\\' + parts.join('\\')) : 'C:\\';
  }

  function pathOf(parts) {
    return 'C:\\' + parts.join('\\');
  }

  function list(path) {
    const node = resolvePath(path);
    if (!node || node.type !== 'dir') return [];
    return node.children.slice().sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  function readFile(path) {
    const node = resolvePath(path);
    if (!node || node.type !== 'file') return null;
    return node.content || '';
  }

  function writeFile(path, content) {
    const parts = normalize(path);
    if (!parts.length) return false;
    const name = parts.pop();
    const parent = resolvePath(pathOf(parts));
    if (!parent || parent.type !== 'dir') return false;
    let node = parent.children.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (node) {
      node.content = content;
      node.mtime = Date.now();
    } else {
      parent.children.push({
        name,
        type: 'file',
        icon: iconFor(name),
        content,
        mtime: Date.now()
      });
    }
    save();
    return true;
  }

  function createDir(path) {
    const parts = normalize(path);
    if (!parts.length) return false;
    const name = parts.pop();
    const parent = resolvePath(pathOf(parts));
    if (!parent || parent.type !== 'dir') return false;
    if (parent.children.find(c => c.name.toLowerCase() === name.toLowerCase())) return false;
    parent.children.push({ name, type: 'dir', icon: '📁', children: [] });
    save();
    return true;
  }

  function remove(path) {
    const parts = normalize(path);
    if (!parts.length) return false;
    const name = parts.pop();
    const parent = resolvePath(pathOf(parts));
    if (!parent || parent.type !== 'dir') return false;
    const idx = parent.children.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
    if (idx < 0) return false;
    parent.children.splice(idx, 1);
    save();
    return true;
  }

  function iconFor(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (['txt', 'md', 'log', 'ini'].includes(ext)) return '📄';
    if (['png', 'jpg', 'gif', 'bmp'].includes(ext)) return '🖼';
    if (['mp3', 'wav'].includes(ext)) return '🎵';
    if (['exe', 'bat'].includes(ext)) return '⚙';
    return '📄';
  }

  function openPath(path) {
    const node = resolvePath(path);
    if (!node) return;
    if (node.type === 'dir') {
      WM.open('explorer', { path });
      return;
    }
    const ext = (node.name.split('.').pop() || '').toLowerCase();
    if (['txt', 'md', 'log', 'ini', ''].includes(ext)) {
      WM.open('notepad', { path, multi: true });
    } else {
      WM.open('notepad', { path, multi: true });
    }
  }

  function reset() {
    localStorage.removeItem(KEY);
    seeded = false;
    root = null;
    return load();
  }

  window.FS = {
    load, list, readFile, writeFile, createDir, remove,
    resolvePath, parentOf, pathOf, normalize,
    openPath, iconFor, reset,
    on: (ev, fn) => emitter.addEventListener(ev, fn),
    off: (ev, fn) => emitter.removeEventListener(ev, fn),
    root: () => root
  };
})();
