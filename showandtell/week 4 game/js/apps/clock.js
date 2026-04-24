/* Clock — analog, digital, stopwatch, timer */
WM.registerApp({
  id: 'clock',
  title: 'Clock',
  icon: '⏰',
  window: { width: 300, height: 360 },
  mount(w) {
    w.bodyEl.innerHTML = `
      <div class="clock-tabs">
        <button class="clock-tab active" data-tab="analog">Analog</button>
        <button class="clock-tab" data-tab="digital">Digital</button>
        <button class="clock-tab" data-tab="stopwatch">Stopwatch</button>
        <button class="clock-tab" data-tab="timer">Timer</button>
      </div>
      <div class="clock-pane" data-pane></div>
    `;
    const pane = w.bodyEl.querySelector('[data-pane]');
    const tabs = w.bodyEl.querySelectorAll('.clock-tab');
    let active = 'analog';
    let tickId = null;

    function activateTab(name) {
      active = name;
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
      stopTick();
      if (name === 'analog') renderAnalog();
      if (name === 'digital') renderDigital();
      if (name === 'stopwatch') renderStopwatch();
      if (name === 'timer') renderTimer();
    }

    tabs.forEach(t => t.addEventListener('click', () => activateTab(t.dataset.tab)));

    function renderAnalog() {
      pane.innerHTML = `
        <svg class="clock-analog" viewBox="0 0 200 200">
          <defs>
            <radialGradient id="face">
              <stop offset="0%" stop-color="#fff"/>
              <stop offset="100%" stop-color="#eee"/>
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="92" fill="url(#face)" stroke="#333" stroke-width="3"/>
          <g id="ticks"></g>
          <line id="hh" x1="100" y1="100" x2="100" y2="55" stroke="#000" stroke-width="5" stroke-linecap="round"/>
          <line id="mm" x1="100" y1="100" x2="100" y2="40" stroke="#000" stroke-width="3" stroke-linecap="round"/>
          <line id="ss" x1="100" y1="100" x2="100" y2="30" stroke="#c00" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="100" cy="100" r="4" fill="#333"/>
        </svg>
        <div class="clock-date" data-dt></div>
      `;
      const ticks = pane.querySelector('#ticks');
      for (let i = 0; i < 12; i++) {
        const a = (i * 30 - 90) * Math.PI / 180;
        const x1 = 100 + Math.cos(a) * 82;
        const y1 = 100 + Math.sin(a) * 82;
        const x2 = 100 + Math.cos(a) * 90;
        const y2 = 100 + Math.sin(a) * 90;
        ticks.innerHTML += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#333" stroke-width="2"/>`;
      }
      const hh = pane.querySelector('#hh');
      const mm = pane.querySelector('#mm');
      const ss = pane.querySelector('#ss');
      const dt = pane.querySelector('[data-dt]');
      function tick() {
        const d = new Date();
        const h = d.getHours() % 12, m = d.getMinutes(), s = d.getSeconds();
        hh.setAttribute('transform', `rotate(${(h * 30) + (m * 0.5)} 100 100)`);
        mm.setAttribute('transform', `rotate(${m * 6} 100 100)`);
        ss.setAttribute('transform', `rotate(${s * 6} 100 100)`);
        dt.textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      }
      tick();
      tickId = setInterval(tick, 1000);
    }

    function renderDigital() {
      pane.innerHTML = `
        <div class="clock-digital" data-time></div>
        <div class="clock-date" data-dt></div>
        <div class="clock-opts">
          <label><input type="checkbox" data-24h /> 24-hour</label>
        </div>
      `;
      const t = pane.querySelector('[data-time]');
      const dt = pane.querySelector('[data-dt]');
      const cb = pane.querySelector('[data-24h]');
      cb.checked = !!Settings.get('clock24h');
      cb.addEventListener('change', () => Settings.set({ clock24h: cb.checked }));
      function tick() {
        const d = new Date();
        const opts = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        opts.hour12 = !Settings.get('clock24h');
        t.textContent = d.toLocaleTimeString(undefined, opts);
        dt.textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      }
      tick();
      tickId = setInterval(tick, 1000);
    }

    function renderStopwatch() {
      pane.innerHTML = `
        <div class="clock-digital" data-sw>00:00.00</div>
        <div class="row">
          <button class="btn" data-start>Start</button>
          <button class="btn" data-lap disabled>Lap</button>
          <button class="btn" data-reset disabled>Reset</button>
        </div>
        <div data-laps style="font-size:11px;max-height:80px;overflow-y:auto;width:200px;"></div>
      `;
      let t0 = 0, acc = 0, running = false;
      const disp = pane.querySelector('[data-sw]');
      const startBtn = pane.querySelector('[data-start]');
      const lapBtn = pane.querySelector('[data-lap]');
      const resetBtn = pane.querySelector('[data-reset]');
      const laps = pane.querySelector('[data-laps]');
      function render(ms) {
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const c = Math.floor((ms % 1000) / 10);
        disp.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + String(c).padStart(2, '0');
      }
      function loop() {
        if (!running) return;
        render(acc + (Date.now() - t0));
        tickId = requestAnimationFrame(loop);
      }
      startBtn.addEventListener('click', () => {
        if (running) {
          running = false;
          acc += Date.now() - t0;
          startBtn.textContent = 'Start';
          lapBtn.disabled = true;
          resetBtn.disabled = false;
          cancelAnimationFrame(tickId);
        } else {
          running = true;
          t0 = Date.now();
          startBtn.textContent = 'Stop';
          lapBtn.disabled = false;
          resetBtn.disabled = true;
          loop();
        }
      });
      lapBtn.addEventListener('click', () => {
        const row = document.createElement('div');
        row.textContent = 'Lap ' + (laps.children.length + 1) + ': ' + disp.textContent;
        laps.prepend(row);
      });
      resetBtn.addEventListener('click', () => {
        acc = 0; render(0); laps.innerHTML = '';
        resetBtn.disabled = true;
      });
      render(0);
    }

    function renderTimer() {
      pane.innerHTML = `
        <div class="row">
          <input type="number" data-min min="0" max="59" value="5" style="width:50px" />
          <span>min</span>
          <input type="number" data-sec min="0" max="59" value="0" style="width:50px" />
          <span>sec</span>
        </div>
        <div class="clock-digital" data-tm>05:00</div>
        <div class="row">
          <button class="btn" data-start>Start</button>
          <button class="btn" data-stop disabled>Stop</button>
        </div>
      `;
      const minI = pane.querySelector('[data-min]');
      const secI = pane.querySelector('[data-sec]');
      const disp = pane.querySelector('[data-tm]');
      const startB = pane.querySelector('[data-start]');
      const stopB = pane.querySelector('[data-stop]');
      let endAt = 0, running = false;

      function render(ms) {
        if (ms < 0) ms = 0;
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        disp.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      }
      function loop() {
        if (!running) return;
        const left = endAt - Date.now();
        render(left);
        if (left <= 0) {
          running = false;
          startB.disabled = false; stopB.disabled = true;
          w.shake();
          Sounds && Sounds.play('startup', { force: true });
          Toast('⏰ Timer done!');
          return;
        }
        tickId = requestAnimationFrame(loop);
      }
      startB.addEventListener('click', () => {
        const ms = (parseInt(minI.value, 10) || 0) * 60000 + (parseInt(secI.value, 10) || 0) * 1000;
        if (ms <= 0) return;
        endAt = Date.now() + ms;
        running = true;
        startB.disabled = true; stopB.disabled = false;
        loop();
      });
      stopB.addEventListener('click', () => {
        running = false;
        startB.disabled = false; stopB.disabled = true;
        cancelAnimationFrame(tickId);
      });
      render((parseInt(minI.value, 10) || 0) * 60000);
    }

    function stopTick() {
      if (tickId) { clearInterval(tickId); cancelAnimationFrame(tickId); tickId = null; }
    }

    w.onClose = stopTick;
    activateTab('analog');
  }
});
