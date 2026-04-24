/* Window Manager — pure vanilla, no deps */
(function () {
  const layer = () => document.getElementById('windows');
  const tpl = () => document.getElementById('tpl-window');

  const apps = new Map();     // id -> app descriptor
  const windows = new Map();  // wid -> handle
  let zCounter = 10;
  let widCounter = 0;
  let activeWid = null;
  let cascadeIdx = 0;

  const emitter = new EventTarget();

  function registerApp(app) {
    if (!app || !app.id) throw new Error('app needs id');
    apps.set(app.id, app);
  }

  function getApp(id) { return apps.get(id); }
  function listApps() { return [...apps.values()]; }

  function open(appId, opts = {}) {
    const app = apps.get(appId);
    if (!app) { console.warn('unknown app', appId); return null; }

    if (!app.multi && !opts.multi) {
      for (const w of windows.values()) {
        if (w.appId === appId) {
          if (w.minimized) restore(w.wid);
          focus(w.wid);
          if (app.onReopen) app.onReopen(w, opts);
          return w;
        }
      }
    }

    const wid = ++widCounter;
    const el = tpl().content.firstElementChild.cloneNode(true);
    el.dataset.wid = wid;

    const defaults = app.window || {};
    const w = opts.width || defaults.width || 480;
    const h = opts.height || defaults.height || 320;

    const desk = document.getElementById('desktop');
    const maxX = Math.max(20, desk.clientWidth - w - 20);
    const maxY = Math.max(20, desk.clientHeight - h - 20);
    const x = Math.min(maxX, 40 + (cascadeIdx * 28) % 240);
    const y = Math.min(maxY, 40 + (cascadeIdx * 28) % 160);
    cascadeIdx++;

    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.zIndex = ++zCounter;

    const labelEl = el.querySelector('.win-label');
    const iconEl = el.querySelector('.win-icon');
    labelEl.textContent = opts.title || app.title || 'Window';
    iconEl.textContent = app.icon || '■';

    const bodyEl = el.querySelector('.win-body');

    const handle = {
      wid,
      appId,
      el,
      bodyEl,
      titleEl: labelEl,
      iconEl,
      minimized: false,
      maximized: false,
      state: {},
      opts,
      setTitle(t) { labelEl.textContent = t; updateTaskbar(); },
      setIcon(i) { iconEl.textContent = i; updateTaskbar(); },
      close() { close(wid); },
      focus() { focus(wid); },
      shake() { shake(wid); },
      onClose: null
    };
    windows.set(wid, handle);

    wireControls(handle);
    wireTitleDrag(handle);
    wireResize(handle);
    wireFocus(handle);

    layer().appendChild(el);

    if (app.mount) {
      try { app.mount(handle, opts); }
      catch (e) { console.error('app mount failed', appId, e); bodyEl.innerHTML = '<div style="padding:20px;color:#b1331b">App crashed.</div>'; }
    }

    focus(wid);
    updateTaskbar();
    emitter.dispatchEvent(new CustomEvent('open', { detail: handle }));
    return handle;
  }

  function close(wid) {
    const w = windows.get(wid);
    if (!w) return;
    if (w.onClose) { try { w.onClose(); } catch (e) { console.error(e); } }
    const app = apps.get(w.appId);
    if (app && app.unmount) { try { app.unmount(w); } catch (e) { console.error(e); } }
    w.el.remove();
    windows.delete(wid);
    if (activeWid === wid) activeWid = null;
    updateTaskbar();
    emitter.dispatchEvent(new CustomEvent('close', { detail: { wid, appId: w.appId } }));
  }

  function focus(wid) {
    const w = windows.get(wid);
    if (!w) return;
    if (w.minimized) restore(wid);
    for (const other of windows.values()) other.el.classList.remove('active');
    w.el.classList.add('active');
    w.el.style.zIndex = ++zCounter;
    activeWid = wid;
    updateTaskbar();
  }

  function minimize(wid) {
    const w = windows.get(wid);
    if (!w) return;
    w.minimized = true;
    w.el.classList.add('minimized');
    if (activeWid === wid) activeWid = null;
    updateTaskbar();
    emitter.dispatchEvent(new CustomEvent('minimize', { detail: w }));
  }

  function restore(wid) {
    const w = windows.get(wid);
    if (!w) return;
    w.minimized = false;
    w.el.classList.remove('minimized');
  }

  function toggleMaximize(wid) {
    const w = windows.get(wid);
    if (!w) return;
    if (w.maximized) {
      w.maximized = false;
      w.el.classList.remove('maximized');
      Object.assign(w.el.style, w._prev || {});
    } else {
      w._prev = {
        left: w.el.style.left, top: w.el.style.top,
        width: w.el.style.width, height: w.el.style.height
      };
      w.maximized = true;
      w.el.classList.add('maximized');
      const desk = document.getElementById('desktop');
      w.el.style.left = '0px';
      w.el.style.top = '0px';
      w.el.style.width = desk.clientWidth + 'px';
      w.el.style.height = desk.clientHeight + 'px';
    }
    emitter.dispatchEvent(new CustomEvent('maximize', { detail: w }));
  }

  function shake(wid) {
    const w = windows.get(wid);
    if (!w) return;
    w.el.classList.remove('shake');
    void w.el.offsetWidth;
    w.el.classList.add('shake');
    setTimeout(() => w.el.classList.remove('shake'), 500);
  }

  function wireControls(w) {
    const min = w.el.querySelector('.wb-min');
    const max = w.el.querySelector('.wb-max');
    const cls = w.el.querySelector('.wb-close');
    min.addEventListener('click', e => { e.stopPropagation(); minimize(w.wid); });
    max.addEventListener('click', e => { e.stopPropagation(); toggleMaximize(w.wid); });
    cls.addEventListener('click', e => { e.stopPropagation(); close(w.wid); });

    const title = w.el.querySelector('.win-title');
    title.addEventListener('dblclick', e => {
      if (e.target.closest('.wb')) return;
      toggleMaximize(w.wid);
    });
  }

  function wireTitleDrag(w) {
    const title = w.el.querySelector('.win-title');
    title.addEventListener('pointerdown', e => {
      if (e.target.closest('.wb')) return;
      if (w.maximized) return;
      e.preventDefault();
      focus(w.wid);
      const sx = e.clientX, sy = e.clientY;
      const r = w.el.getBoundingClientRect();
      const ox = sx - r.left, oy = sy - r.top;
      title.setPointerCapture(e.pointerId);

      const desk = document.getElementById('desktop');
      const dw = desk.clientWidth, dh = desk.clientHeight;

      const move = ev => {
        const nx = Math.max(-r.width + 60, Math.min(dw - 60, ev.clientX - ox));
        const ny = Math.max(0, Math.min(dh - 24, ev.clientY - oy));
        w.el.style.left = nx + 'px';
        w.el.style.top = ny + 'px';
      };
      const up = ev => {
        title.releasePointerCapture(e.pointerId);
        title.removeEventListener('pointermove', move);
        title.removeEventListener('pointerup', up);
        title.removeEventListener('pointercancel', up);
      };
      title.addEventListener('pointermove', move);
      title.addEventListener('pointerup', up);
      title.addEventListener('pointercancel', up);
    });
  }

  function wireResize(w) {
    const app = apps.get(w.appId);
    const aspect = app && app.window && app.window.aspectRatio; // body width / body height
    w.el.querySelectorAll('.resize').forEach(h => {
      const dirs = h.className.match(/rz-(\w+)/)[1].split('');
      h.addEventListener('pointerdown', e => {
        if (w.maximized) return;
        e.preventDefault();
        e.stopPropagation();
        focus(w.wid);
        const r = w.el.getBoundingClientRect();
        const bodyR = w.bodyEl.getBoundingClientRect();
        const chromeH = r.height - bodyR.height;
        const chromeW = r.width - bodyR.width;
        const sx = e.clientX, sy = e.clientY;
        const startW = r.width, startH = r.height, startL = r.left, startT = r.top;
        const minW = 220, minH = 120;
        h.setPointerCapture(e.pointerId);

        const move = ev => {
          let dx = ev.clientX - sx, dy = ev.clientY - sy;
          let nl = startL, nt = startT, nw = startW, nh = startH;
          if (dirs.includes('e')) nw = Math.max(minW, startW + dx);
          if (dirs.includes('s')) nh = Math.max(minH, startH + dy);
          if (dirs.includes('w')) {
            const w2 = Math.max(minW, startW - dx);
            nl = startL + (startW - w2);
            nw = w2;
          }
          if (dirs.includes('n')) {
            const h2 = Math.max(minH, startH - dy);
            nt = startT + (startH - h2);
            nh = h2;
          }
          if (aspect) {
            const horiz = dirs.includes('e') || dirs.includes('w');
            const vert = dirs.includes('n') || dirs.includes('s');
            if (horiz) {
              const newH = Math.max(minH, (nw - chromeW) / aspect + chromeH);
              if (dirs.includes('n')) nt = startT + (startH - newH);
              nh = newH;
            } else if (vert) {
              const newW = Math.max(minW, (nh - chromeH) * aspect + chromeW);
              if (dirs.includes('w')) nl = startL + (startW - newW);
              nw = newW;
            }
          }
          w.el.style.left = nl + 'px';
          w.el.style.top = nt + 'px';
          w.el.style.width = nw + 'px';
          w.el.style.height = nh + 'px';
        };
        const up = () => {
          h.releasePointerCapture(e.pointerId);
          h.removeEventListener('pointermove', move);
          h.removeEventListener('pointerup', up);
          h.removeEventListener('pointercancel', up);
        };
        h.addEventListener('pointermove', move);
        h.addEventListener('pointerup', up);
        h.addEventListener('pointercancel', up);
      });
    });
  }

  function wireFocus(w) {
    w.el.addEventListener('pointerdown', () => focus(w.wid));
  }

  function updateTaskbar() {
    const tb = document.getElementById('taskbar-apps');
    if (!tb) return;
    tb.innerHTML = '';
    for (const w of windows.values()) {
      const app = apps.get(w.appId);
      const b = document.createElement('button');
      b.className = 'tb-app' + (activeWid === w.wid && !w.minimized ? ' active' : '');
      b.innerHTML = `<span class="tb-icon">${app ? app.icon : '■'}</span><span class="tb-label"></span>`;
      b.querySelector('.tb-label').textContent = w.titleEl.textContent;
      b.addEventListener('click', () => {
        if (activeWid === w.wid && !w.minimized) minimize(w.wid);
        else focus(w.wid);
      });
      tb.appendChild(b);
    }
  }

  function listWindows() { return [...windows.values()]; }
  function activeWindow() { return activeWid ? windows.get(activeWid) : null; }

  window.WM = {
    registerApp, getApp, listApps,
    open, close, focus, minimize, restore, toggleMaximize, shake,
    listWindows, activeWindow,
    on: (ev, fn) => emitter.addEventListener(ev, fn),
    off: (ev, fn) => emitter.removeEventListener(ev, fn)
  };
})();
