/* Desktop — icons, taskbar clock, start menu, boot */
(function () {
  const startBtn = document.getElementById('start-btn');
  const startMenu = document.getElementById('start-menu');
  const startList = document.getElementById('start-list');
  const startUser = document.getElementById('start-user');
  const iconsEl = document.getElementById('icons');
  const trayClock = document.getElementById('tray-clock');
  const contextMenu = document.getElementById('context-menu');

  const desktopIconIds = ['presentation', 'email', 'meeting', 'clock', 'notepad', 'excel', 'viewer', 'explorer', 'controlpanel', 'minesweeper'];

  const ICON_POS_KEY = 'cmc:windows:iconPositions';
  const GRID_ORIGIN_X = 8;
  const GRID_ORIGIN_Y = 8;
  const GRID_COL_W = 84;
  const GRID_ROW_H = 88;

  function loadIconPositions() {
    try { return JSON.parse(localStorage.getItem(ICON_POS_KEY)) || {}; } catch { return {}; }
  }
  function saveIconPositions(p) {
    try { localStorage.setItem(ICON_POS_KEY, JSON.stringify(p)); } catch {}
  }
  let iconPositions = loadIconPositions();

  function defaultIconPos(index) {
    const deskH = document.getElementById('desktop').clientHeight || 600;
    const rowsPerCol = Math.max(1, Math.floor((deskH - GRID_ORIGIN_Y * 2) / GRID_ROW_H));
    const col = Math.floor(index / rowsPerCol);
    const row = index % rowsPerCol;
    return { x: GRID_ORIGIN_X + col * GRID_COL_W, y: GRID_ORIGIN_Y + row * GRID_ROW_H };
  }

  function clampIconPos(el, x, y) {
    const desk = document.getElementById('desktop');
    const maxX = Math.max(0, desk.clientWidth - el.offsetWidth);
    const maxY = Math.max(0, desk.clientHeight - el.offsetHeight);
    return { x: Math.max(0, Math.min(maxX, x)), y: Math.max(0, Math.min(maxY, y)) };
  }

  function attachIconDrag(el) {
    let startX = 0, startY = 0, origX = 0, origY = 0, dragging = false, moved = false, pid = null;
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      origX = parseFloat(el.style.left) || 0;
      origY = parseFloat(el.style.top) || 0;
      dragging = true;
      moved = false;
      pid = e.pointerId;
      el.setPointerCapture(pid);
    });
    el.addEventListener('pointermove', e => {
      if (!dragging || e.pointerId !== pid) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      if (!moved) {
        moved = true;
        el.classList.add('dragging');
      }
      const { x, y } = clampIconPos(el, origX + dx, origY + dy);
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    });
    const end = e => {
      if (!dragging || e.pointerId !== pid) return;
      dragging = false;
      try { el.releasePointerCapture(pid); } catch {}
      if (moved) {
        el.classList.remove('dragging');
        iconPositions[el.dataset.appId] = {
          x: parseFloat(el.style.left) || 0,
          y: parseFloat(el.style.top) || 0
        };
        saveIconPositions(iconPositions);
        el._justDragged = true;
        setTimeout(() => { el._justDragged = false; }, 0);
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  function renderIcons() {
    iconsEl.innerHTML = '';
    const apps = WM.listApps().filter(a => !a.hideFromDesktop);
    const order = [...desktopIconIds, ...apps.map(a => a.id).filter(id => !desktopIconIds.includes(id))];
    const seen = new Set();
    let index = 0;
    order.forEach(id => {
      if (seen.has(id)) return;
      const app = WM.getApp(id);
      if (!app || app.hideFromDesktop) return;
      seen.add(id);
      const el = document.createElement('div');
      el.className = 'icon';
      el.dataset.appId = id;
      el.innerHTML = `<div class="icon-img">${app.icon || '■'}</div><div class="icon-label">${app.title}</div>`;
      const saved = iconPositions[id];
      const pos = saved || defaultIconPos(index);
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      el.addEventListener('click', e => {
        if (el._justDragged) { e.stopPropagation(); return; }
        document.querySelectorAll('.icon.selected').forEach(i => i.classList.remove('selected'));
        el.classList.add('selected');
        e.stopPropagation();
      });
      el.addEventListener('dblclick', () => {
        if (el._justDragged) return;
        WM.open(id);
      });
      attachIconDrag(el);
      iconsEl.appendChild(el);
      index++;
    });
  }

  function renderStartMenu() {
    startList.innerHTML = '';
    const apps = WM.listApps().filter(a => !a.hideFromStart);
    apps.forEach(app => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="icn" style="font-size:18px">${app.icon}</span><span>${app.title}</span>`;
      li.addEventListener('click', () => {
        WM.open(app.id);
        toggleStart(false);
      });
      startList.appendChild(li);
    });
    startUser.textContent = Settings.get('username');
  }

  function toggleStart(force) {
    const open = typeof force === 'boolean' ? force : startMenu.hasAttribute('hidden');
    if (open) {
      startMenu.removeAttribute('hidden');
      startBtn.classList.add('open');
    } else {
      startMenu.setAttribute('hidden', '');
      startBtn.classList.remove('open');
    }
  }

  function wireStart() {
    startBtn.addEventListener('click', e => {
      e.stopPropagation();
      window.Sounds && Sounds.play('click');
      toggleStart();
    });
    document.addEventListener('click', e => {
      if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) toggleStart(false);
      if (!contextMenu.contains(e.target)) hideContext();
    });
    startMenu.addEventListener('click', e => {
      const action = e.target.closest('[data-action]');
      if (!action) return;
      if (action.dataset.action === 'shutdown') shutdown();
      if (action.dataset.action === 'about') WM.open('about');
      toggleStart(false);
    });
  }

  function shutdown() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:#000;color:#aac;display:flex;align-items:center;justify-content:center;font-family:"Courier New",monospace;z-index:9999;font-size:14px;text-align:center;padding:20px';
    overlay.innerHTML = 'It is now safe to turn off your computer.<br><br><span style="font-size:11px;opacity:0.6">Click to restart.</span>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => location.reload());
  }

  function tickClock() {
    const now = new Date();
    const s = Settings.get();
    const opts = { hour: '2-digit', minute: '2-digit' };
    if (s.showSeconds) opts.second = '2-digit';
    if (!s.clock24h) opts.hour12 = true;
    else opts.hour12 = false;
    trayClock.textContent = now.toLocaleTimeString(undefined, opts);
    trayClock.title = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  setInterval(tickClock, 1000);

  function wireTrayClock() {
    trayClock.addEventListener('dblclick', () => WM.open('clock'));
  }

  function showContext(x, y, items) {
    contextMenu.innerHTML = '';
    const ul = document.createElement('ul');
    items.forEach(it => {
      const li = document.createElement('li');
      if (it.sep) { li.className = 'sep'; }
      else {
        li.textContent = it.label;
        li.addEventListener('click', () => { hideContext(); if (it.action) it.action(); });
      }
      ul.appendChild(li);
    });
    contextMenu.appendChild(ul);
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    contextMenu.removeAttribute('hidden');
  }
  function hideContext() { contextMenu.setAttribute('hidden', ''); }

  function wireDesktopContext() {
    const desk = document.getElementById('desktop');
    desk.addEventListener('contextmenu', e => {
      e.preventDefault();
      const iconEl = e.target.closest('.icon');
      if (iconEl) {
        showContext(e.clientX, e.clientY, [
          { label: 'Open', action: () => WM.open(iconEl.dataset.appId) },
          { sep: true },
          { label: 'Properties', action: () => WM.open('about') }
        ]);
      } else {
        showContext(e.clientX, e.clientY, [
          { label: 'Refresh', action: () => renderIcons() },
          { sep: true },
          { label: 'Display Properties', action: () => WM.open('controlpanel', { page: 'display' }) }
        ]);
      }
    });
    desk.addEventListener('click', e => {
      if (!e.target.closest('.icon')) {
        document.querySelectorAll('.icon.selected').forEach(i => i.classList.remove('selected'));
      }
    });
  }

  // Toast helper
  window.Toast = function (msg, ms = 2500) {
    const layer = document.getElementById('toast-layer');
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    layer.appendChild(t);
    setTimeout(() => t.remove(), ms);
  };

  function awaitBootDismiss(onDismiss, minMs = 1400) {
    const boot = document.getElementById('boot-screen');
    if (!boot) { onDismiss(); return; }
    const start = boot.dataset.started ? Number(boot.dataset.started) : performance.now();
    const elapsed = performance.now() - start;
    const wait = Math.max(0, minMs - elapsed);
    setTimeout(() => {
      boot.classList.add('ready');
      const dismiss = () => {
        boot.removeEventListener('click', dismiss);
        document.removeEventListener('keydown', onKey);
        boot.classList.add('hidden');
        setTimeout(() => { boot.remove(); onDismiss(); }, 700);
      };
      const onKey = () => dismiss();
      boot.addEventListener('click', dismiss);
      document.addEventListener('keydown', onKey);
    }, wait);
  }

  function setBootStatus(text, isError) {
    const el = document.getElementById('boot-status');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('error', !!isError);
  }

  function showLoginUI(show) {
    const el = document.getElementById('boot-login');
    if (el) el.hidden = !show;
  }

  async function promptLogin() {
    return new Promise((resolve) => {
      setBootStatus('');
      showLoginUI(true);
      const enterBtn = document.getElementById('boot-login-enter');
      const onEnter = () => {
        enterBtn.removeEventListener('click', onEnter);
        showLoginUI(false);
        resolve();
      };
      enterBtn.addEventListener('click', onEnter);
    });
  }

  async function runLoginFlow() {
    const bootEl = document.getElementById('boot-screen');
    bootEl && bootEl.classList.add('pre-login');
    await promptLogin();
    bootEl && bootEl.classList.remove('pre-login');
    if (bootEl) bootEl.dataset.started = String(performance.now());
    setBootStatus('Loading…');
  }

  // Boot
  async function boot() {
    const bootEl = document.getElementById('boot-screen');
    if (bootEl) bootEl.dataset.started = String(performance.now());
    Settings.on('change', () => { renderStartMenu(); tickClock(); });
    await FS.load();
    renderIcons();
    renderStartMenu();
    wireStart();
    wireTrayClock();
    wireDesktopContext();
    tickClock();

    await runLoginFlow();

    awaitBootDismiss(() => {
      setTimeout(() => Toast('Welcome, ' + Settings.get('username') + '.'), 400);
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
