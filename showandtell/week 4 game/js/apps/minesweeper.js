/* Minesweeper — classic 9x9 / 10 mines */
WM.registerApp({
  id: 'minesweeper',
  title: 'Minesweeper',
  icon: '💣',
  window: { width: 260, height: 320 },
  mount(w) {
    w.bodyEl.classList.add('mine-app');
    w.bodyEl.innerHTML = `
      <div class="mine-header">
        <div class="mine-counter" data-mines>010</div>
        <button class="mine-face" data-face>🙂</button>
        <div class="mine-counter" data-time>000</div>
      </div>
      <div class="mine-grid" data-grid></div>
    `;
    const gridEl = w.bodyEl.querySelector('[data-grid]');
    const mineCounter = w.bodyEl.querySelector('[data-mines]');
    const timeCounter = w.bodyEl.querySelector('[data-time]');
    const face = w.bodyEl.querySelector('[data-face]');
    const ROWS = 9, COLS = 9, MINES = 10;

    let cells = [];
    let revealed = 0;
    let flags = 0;
    let dead = false, won = false;
    let started = false;
    let t0 = 0, timerId = null;

    gridEl.style.gridTemplateColumns = `repeat(${COLS}, 20px)`;

    function reset() {
      cells = [];
      revealed = 0; flags = 0;
      dead = false; won = false; started = false;
      clearInterval(timerId); timerId = null;
      timeCounter.textContent = '000';
      face.textContent = '🙂';
      updateMines();
      gridEl.innerHTML = '';
      for (let y = 0; y < ROWS; y++) {
        cells[y] = [];
        for (let x = 0; x < COLS; x++) {
          const c = { x, y, mine: false, n: 0, opened: false, flagged: false };
          cells[y][x] = c;
          const btn = document.createElement('button');
          btn.className = 'mine-cell';
          btn.dataset.x = x; btn.dataset.y = y;
          btn.addEventListener('click', () => open(x, y));
          btn.addEventListener('contextmenu', e => { e.preventDefault(); flag(x, y); });
          btn.addEventListener('mousedown', e => { if (e.button === 0 && !dead && !won) face.textContent = '😮'; });
          btn.addEventListener('mouseup', () => { if (!dead && !won) face.textContent = '🙂'; });
          gridEl.appendChild(btn);
        }
      }
    }
    face.addEventListener('click', reset);

    function plantMines(safeX, safeY) {
      let placed = 0;
      while (placed < MINES) {
        const x = Math.floor(Math.random() * COLS);
        const y = Math.floor(Math.random() * ROWS);
        if (cells[y][x].mine) continue;
        if (Math.abs(x - safeX) <= 1 && Math.abs(y - safeY) <= 1) continue;
        cells[y][x].mine = true;
        placed++;
      }
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (cells[y][x].mine) continue;
          let n = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
            if (cells[ny][nx].mine) n++;
          }
          cells[y][x].n = n;
        }
      }
    }

    function startTimer() {
      t0 = Date.now();
      timerId = setInterval(() => {
        const s = Math.min(999, Math.floor((Date.now() - t0) / 1000));
        timeCounter.textContent = String(s).padStart(3, '0');
      }, 200);
    }

    function updateMines() {
      const n = MINES - flags;
      mineCounter.textContent = (n < 0 ? '-' + String(Math.abs(n)).padStart(2, '0') : String(n).padStart(3, '0'));
    }

    function btnAt(x, y) { return gridEl.children[y * COLS + x]; }

    function open(x, y) {
      if (dead || won) return;
      const c = cells[y][x];
      if (c.opened || c.flagged) return;
      if (!started) { plantMines(x, y); started = true; startTimer(); }
      c.opened = true;
      const btn = btnAt(x, y);
      btn.classList.add('opened');
      if (c.mine) {
        btn.classList.add('mine');
        btn.textContent = '💣';
        return lose();
      }
      revealed++;
      if (c.n > 0) {
        btn.textContent = c.n;
        btn.dataset.n = c.n;
      } else {
        btn.textContent = '';
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
          if (!cells[ny][nx].opened) open(nx, ny);
        }
      }
      if (revealed === ROWS * COLS - MINES) win();
    }

    function flag(x, y) {
      if (dead || won) return;
      const c = cells[y][x];
      if (c.opened) return;
      c.flagged = !c.flagged;
      const btn = btnAt(x, y);
      if (c.flagged) { btn.textContent = '🚩'; btn.classList.add('flagged'); flags++; }
      else { btn.textContent = ''; btn.classList.remove('flagged'); flags--; }
      updateMines();
      Sounds && Sounds.play('click');
    }

    function lose() {
      dead = true;
      face.textContent = '😵';
      clearInterval(timerId); timerId = null;
      Sounds && Sounds.play('error');
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const c = cells[y][x];
        const btn = btnAt(x, y);
        if (c.mine && !c.flagged) { btn.classList.add('opened', 'mine'); btn.textContent = '💣'; }
        if (c.flagged && !c.mine) { btn.textContent = '❌'; }
      }
    }

    function win() {
      won = true;
      face.textContent = '😎';
      clearInterval(timerId); timerId = null;
      Sounds && Sounds.play('confirm');
      Toast('You won in ' + timeCounter.textContent + ' seconds!');
    }

    w.onClose = () => clearInterval(timerId);
    reset();
  }
});
