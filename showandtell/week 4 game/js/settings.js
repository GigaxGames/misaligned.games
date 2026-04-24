/* Settings store — localStorage backed, event-emitting */
(function () {
  const KEY = 'cmc:windows:settings';
  const defaults = {
    username: 'Guest',
    avatar: '🙂',
    wallpaper: '#3a6ea5',
    theme: 'blue',       // blue | olive | silver | hotdog
    sound: true,
    volume: 60,
    clock24h: false,
    showSeconds: true
  };

  const emitter = new EventTarget();
  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...defaults };
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return { ...defaults };
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }

  function get(k) { return k ? state[k] : { ...state }; }

  function set(patch) {
    state = { ...state, ...patch };
    save();
    apply();
    emitter.dispatchEvent(new CustomEvent('change', { detail: { ...state, changed: Object.keys(patch) } }));
  }

  function reset() {
    state = { ...defaults };
    save();
    apply();
    emitter.dispatchEvent(new CustomEvent('change', { detail: { ...state, changed: Object.keys(defaults) } }));
  }

  function apply() {
    const b = document.body;
    if (!b) return;
    b.style.setProperty('--wp', cssColorFor(state.wallpaper));
    applyTheme(state.theme);
  }

  function cssColorFor(wp) {
    // If looks like URL, set bg image; else treat as color
    if (wp && wp.startsWith('url(')) return wp;
    return wp || '#3a6ea5';
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    const themes = {
      blue: {
        titleA: 'linear-gradient(to bottom, #0a246a 0%, #1e4fd8 8%, #2a5ee0 55%, #1746c4 100%)',
        titleI: 'linear-gradient(to bottom, #7a96df 0%, #97b3ea 60%, #8aa6de 100%)',
        accent: '#316ac5'
      },
      olive: {
        titleA: 'linear-gradient(to bottom, #4a5a2a 0%, #6c7c3a 50%, #586828 100%)',
        titleI: 'linear-gradient(to bottom, #a5b38a 0%, #b8c49f 60%, #98a57a 100%)',
        accent: '#6c7c3a'
      },
      silver: {
        titleA: 'linear-gradient(to bottom, #5a6a82 0%, #7a8ba8 50%, #5e6e88 100%)',
        titleI: 'linear-gradient(to bottom, #c0c6d0 0%, #d4dae4 60%, #b5bcc8 100%)',
        accent: '#6a7a98'
      },
      hotdog: {
        titleA: 'linear-gradient(to bottom, #e03020 0%, #ff5020 50%, #d02010 100%)',
        titleI: 'linear-gradient(to bottom, #ffd020 0%, #ffe040 60%, #eec010 100%)',
        accent: '#e04020'
      }
    };
    const t = themes[theme] || themes.blue;
    root.style.setProperty('--title-a', t.titleA);
    root.style.setProperty('--title-i', t.titleI);
    root.style.setProperty('--accent', t.accent);
  }

  window.Settings = {
    get, set, reset, defaults,
    on: (ev, fn) => emitter.addEventListener(ev, fn),
    off: (ev, fn) => emitter.removeEventListener(ev, fn)
  };

  document.addEventListener('DOMContentLoaded', apply);
})();
