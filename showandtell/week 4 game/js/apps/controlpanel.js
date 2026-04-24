/* Control Panel — settings applets */
WM.registerApp({
  id: 'controlpanel',
  title: 'Control Panel',
  icon: '⚙',
  window: { width: 520, height: 380 },
  onReopen(w, opts) { if (opts && opts.page) w.state.open(opts.page); },
  mount(w, opts) {
    w.bodyEl.classList.add('cp-app');
    renderHome();

    function renderHome() {
      w.setTitle('Control Panel');
      w.bodyEl.innerHTML = `<div class="cp-grid"></div>`;
      const grid = w.bodyEl.querySelector('.cp-grid');
      const applets = [
        { id: 'display', label: 'Display', icon: '🖥' },
        { id: 'theme', label: 'Themes', icon: '🎨' },
        { id: 'sounds', label: 'Sounds', icon: '🔊' },
        { id: 'datetime', label: 'Date & Time', icon: '🕰' },
        { id: 'user', label: 'User Account', icon: '👤' },
        { id: 'system', label: 'System', icon: '💻' }
      ];
      applets.forEach(a => {
        const el = document.createElement('div');
        el.className = 'cp-applet';
        el.innerHTML = `<div class="cp-applet-img">${a.icon}</div><div>${a.label}</div>`;
        el.addEventListener('dblclick', () => openApplet(a.id));
        grid.appendChild(el);
      });
    }

    function openApplet(id) {
      if (id === 'display') renderDisplay();
      else if (id === 'theme') renderTheme();
      else if (id === 'sounds') renderSounds();
      else if (id === 'datetime') renderDateTime();
      else if (id === 'user') renderUser();
      else if (id === 'system') renderSystem();
    }
    w.state.open = openApplet;

    function panelShell(title, body) {
      w.setTitle(title + ' Properties');
      w.bodyEl.innerHTML = `
        <div class="cp-pane">${body}</div>
        <div style="padding:8px 14px;display:flex;gap:6px;justify-content:flex-end;border-top:1px solid var(--shadow-dark)">
          <button class="btn" data-ok>OK</button>
          <button class="btn" data-back>Back</button>
        </div>
      `;
      w.bodyEl.querySelector('[data-ok]').addEventListener('click', renderHome);
      w.bodyEl.querySelector('[data-back]').addEventListener('click', renderHome);
    }

    function renderDisplay() {
      const colors = ['#3a6ea5', '#4a8a6a', '#8a5a3a', '#6a4a8a', '#c04060', '#333333', '#008080', '#000000'];
      const current = Settings.get('wallpaper');
      panelShell('Display', `
        <div class="cp-row"><label>Wallpaper</label>
          <div class="cp-swatches">${colors.map(c => `<div class="cp-swatch${c === current ? ' selected' : ''}" data-c="${c}" style="background:${c}"></div>`).join('')}</div>
        </div>
        <div class="cp-row"><label>Preview</label>
          <div class="cp-preview" data-prev>Your desktop</div>
        </div>
      `);
      const prev = w.bodyEl.querySelector('[data-prev]');
      prev.style.background = current;
      w.bodyEl.querySelectorAll('.cp-swatch').forEach(s => {
        s.addEventListener('click', () => {
          w.bodyEl.querySelectorAll('.cp-swatch').forEach(x => x.classList.remove('selected'));
          s.classList.add('selected');
          const c = s.dataset.c;
          prev.style.background = c;
          Settings.set({ wallpaper: c });
        });
      });
    }

    function renderTheme() {
      const themes = [
        { id: 'blue', label: 'Windows Blue (Luna)', color: '#1e4fd8' },
        { id: 'olive', label: 'Olive Green', color: '#6c7c3a' },
        { id: 'silver', label: 'Silver', color: '#7a8ba8' },
        { id: 'hotdog', label: 'Hotdog Stand', color: '#e04020' }
      ];
      const cur = Settings.get('theme');
      panelShell('Themes', `
        <div class="cp-row"><label>Theme</label>
          <select data-theme>${themes.map(t => `<option value="${t.id}"${t.id === cur ? ' selected' : ''}>${t.label}</option>`).join('')}</select>
        </div>
        <div class="muted" style="font-size:11px">Changes apply immediately.</div>
      `);
      w.bodyEl.querySelector('[data-theme]').addEventListener('change', e => {
        Settings.set({ theme: e.target.value });
      });
    }

    function renderSounds() {
      const s = Settings.get();
      const map = Sounds.getMap();
      const catalog = Sounds.catalog;
      const events = Sounds.events;

      // Build <optgroup><option> list once
      const options = `<option value="none">(none — silent)</option>` +
        Object.keys(catalog).map(group =>
          `<optgroup label="${group}">` +
            catalog[group].map(f => `<option value="${f}">${f}</option>`).join('') +
          `</optgroup>`
        ).join('');

      const rows = events.map(ev => `
        <tr data-ev="${ev.id}">
          <td style="padding:4px 8px;min-width:180px">${ev.label}</td>
          <td style="padding:4px 6px">
            <select data-sel style="min-width:200px"></select>
          </td>
          <td style="padding:4px 4px"><button class="btn" data-play style="min-width:auto;padding:0 8px">▶</button></td>
        </tr>
      `).join('');

      w.setTitle('Sounds and Audio Properties');
      w.bodyEl.innerHTML = `
        <div style="padding:8px 10px 0 10px">
          <div class="cp-row"><label>Master sound</label>
            <label><input type="checkbox" data-snd ${s.sound ? 'checked' : ''}/> Enabled</label>
          </div>
          <div class="cp-row"><label>Volume</label>
            <input type="range" min="0" max="100" value="${s.volume}" data-vol style="flex:1"/>
            <span data-volv style="width:30px;text-align:right">${s.volume}</span>
          </div>
        </div>
        <div style="padding:6px 10px 2px 10px;font-weight:700;font-size:11px;border-top:1px solid var(--shadow-dark);box-shadow:0 1px 0 #fff;margin-top:8px;padding-top:10px">Sound scheme</div>
        <div style="flex:1;overflow:auto;padding:4px 10px 8px 10px;background:#fff;border:1px solid var(--shadow-dark);margin:4px 10px">
          <table style="border-collapse:collapse;width:100%;font-size:11px">${rows}</table>
        </div>
        <div style="padding:8px 10px;display:flex;gap:6px;justify-content:flex-end;border-top:1px solid var(--shadow-dark)">
          <button class="btn" data-reset>Reset to defaults</button>
          <div class="spacer"></div>
          <button class="btn" data-ok>OK</button>
          <button class="btn" data-back>Back</button>
        </div>
      `;

      // Populate selects + wire
      w.bodyEl.querySelectorAll('tr[data-ev]').forEach(tr => {
        const ev = tr.dataset.ev;
        const sel = tr.querySelector('[data-sel]');
        sel.innerHTML = options;
        sel.value = map[ev] || 'none';
        sel.addEventListener('change', () => {
          Sounds.setMap({ [ev]: sel.value });
          if (sel.value !== 'none') Sounds.preview(sel.value);
        });
        tr.querySelector('[data-play]').addEventListener('click', () => {
          const v = sel.value;
          if (v === 'none') { Toast('Silent.'); return; }
          Sounds.preview(v);
        });
      });

      w.bodyEl.querySelector('[data-snd]').addEventListener('change', e => Settings.set({ sound: e.target.checked }));
      const vol = w.bodyEl.querySelector('[data-vol]');
      vol.addEventListener('input', () => {
        w.bodyEl.querySelector('[data-volv]').textContent = vol.value;
        Settings.set({ volume: parseInt(vol.value, 10) });
      });
      w.bodyEl.querySelector('[data-reset]').addEventListener('click', () => {
        if (!confirm('Reset all sound mappings to defaults?')) return;
        Sounds.resetMap();
        renderSounds();
      });
      w.bodyEl.querySelector('[data-ok]').addEventListener('click', renderHome);
      w.bodyEl.querySelector('[data-back]').addEventListener('click', renderHome);
    }

    function renderDateTime() {
      const s = Settings.get();
      panelShell('Date and Time', `
        <div class="cp-row"><label>Time format</label>
          <label><input type="radio" name="tf" ${!s.clock24h ? 'checked' : ''} data-12 /> 12-hour (AM/PM)</label>
          <label><input type="radio" name="tf" ${s.clock24h ? 'checked' : ''} data-24 /> 24-hour</label>
        </div>
        <div class="cp-row"><label>Taskbar clock</label>
          <label><input type="checkbox" data-sec ${s.showSeconds ? 'checked' : ''}/> Show seconds</label>
        </div>
        <div class="cp-row"><label>System time</label>
          <span data-now></span>
        </div>
      `);
      const now = w.bodyEl.querySelector('[data-now]');
      const tick = () => now.textContent = new Date().toLocaleString();
      tick();
      const t = setInterval(tick, 1000);
      w.onClose = () => clearInterval(t);
      w.bodyEl.querySelector('[data-12]').addEventListener('change', () => Settings.set({ clock24h: false }));
      w.bodyEl.querySelector('[data-24]').addEventListener('change', () => Settings.set({ clock24h: true }));
      w.bodyEl.querySelector('[data-sec]').addEventListener('change', e => Settings.set({ showSeconds: e.target.checked }));
    }

    function renderUser() {
      const s = Settings.get();
      const avatars = ['🙂', '😎', '🤓', '👩', '👨', '🧑‍💼', '🦊', '🐱', '🐸'];
      panelShell('User Account', `
        <div class="cp-row"><label>Username</label>
          <input type="text" data-name value="${s.username}" />
        </div>
        <div class="cp-row"><label>Avatar</label>
          <div class="row" data-avs>${avatars.map(a => `<div class="cp-swatch${a === s.avatar ? ' selected' : ''}" data-a="${a}" style="background:#fff;display:flex;align-items:center;justify-content:center;font-size:20px">${a}</div>`).join('')}</div>
        </div>
      `);
      w.bodyEl.querySelector('[data-name]').addEventListener('input', e => Settings.set({ username: e.target.value || 'Colleague' }));
      w.bodyEl.querySelectorAll('[data-a]').forEach(el => {
        el.addEventListener('click', () => {
          w.bodyEl.querySelectorAll('[data-a]').forEach(x => x.classList.remove('selected'));
          el.classList.add('selected');
          Settings.set({ avatar: el.dataset.a });
        });
      });
    }

    function renderSystem() {
      panelShell('System', `
        <div class="cp-row"><label>System</label><span>Call My Colleague · Windows (Office Edition)</span></div>
        <div class="cp-row"><label>Version</label><span>1.0 build 20260420</span></div>
        <div class="cp-row"><label>Processor</label><span>Colleague-Powered Core</span></div>
        <div class="cp-row"><label>Memory</label><span>As much as your browser allows.</span></div>
        <div class="cp-row"><label>Reset filesystem</label><button class="btn" data-reset-fs>Reset</button></div>
        <div class="cp-row"><label>Reset settings</label><button class="btn" data-reset-s>Reset</button></div>
      `);
      w.bodyEl.querySelector('[data-reset-fs]').addEventListener('click', () => {
        if (confirm('Reset the fake filesystem? This wipes any notes you saved.')) {
          FS.reset().then(() => Toast('Filesystem reset.'));
        }
      });
      w.bodyEl.querySelector('[data-reset-s]').addEventListener('click', () => {
        if (confirm('Reset all settings to defaults?')) {
          Settings.reset();
          Toast('Settings reset.');
        }
      });
    }

    if (opts && opts.page) openApplet(opts.page);
  }
});
