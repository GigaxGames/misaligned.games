/* Presentation — minimal slide controller.
   Each arrow click opens the next slide as a window and closes the previous one.
   Slides live in ../week 4/index.html which exposes goTo(n) globally. */
(function () {
  const DECK_URL = '../week%204/index.html';
  const SLIDE_COUNT = 13;

  function injectStyles() {
    if (document.getElementById('presentation-styles')) return;
    const s = document.createElement('style');
    s.id = 'presentation-styles';
    s.textContent = `
      .pres-body { display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--surface); height: 100%; padding: 8px; }
      .pres-btn {
        width: 56px; height: 56px;
        font-size: 28px; font-weight: 700;
        background: linear-gradient(to bottom, #ffffff, #d7e3f5);
        border: 1px solid #4a6a96; border-radius: 4px;
        color: #1e3966;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-family: inherit;
      }
      .pres-btn:hover { background: linear-gradient(to bottom, #f6faff, #bcd0ea); }
      .pres-btn:disabled { opacity: 0.4; cursor: default; }
      .pres-counter {
        min-width: 72px; text-align: center;
        font-family: "Consolas", "Courier New", monospace;
        font-size: 16px; font-weight: 700;
        color: #1e3966;
        background: #fff;
        border: 1px inset var(--shadow-dark);
        padding: 6px 10px; border-radius: 2px;
      }
      .slide-view-body { background: #05050d; height: 100%; }
      .slide-view-body iframe { width: 100%; height: 100%; border: 0; display: block; }
    `;
    document.head.appendChild(s);
  }

  /* Slide window — iframe into the week 4 deck, auto-activates one slide */
  WM.registerApp({
    id: 'slide-view',
    title: 'Slide',
    icon: '🎞',
    multi: true,
    hideFromDesktop: true,
    hideFromStart: true,
    window: { width: 960, height: 620 },
    mount(w, opts) {
      injectStyles();
      const idx = opts.slideIdx || 0;
      w.setTitle('Slide ' + (idx + 1) + ' / ' + SLIDE_COUNT);
      w.bodyEl.classList.add('slide-view-body');
      const iframe = document.createElement('iframe');
      iframe.src = DECK_URL;
      iframe.addEventListener('load', () => {
        try {
          const win = iframe.contentWindow;
          if (win && typeof win.goTo === 'function') win.goTo(idx);
        } catch (e) { console.warn('[Presentation] goTo failed:', e); }
      });
      w.bodyEl.appendChild(iframe);
    }
  });

  /* Controller — two arrows + counter */
  WM.registerApp({
    id: 'presentation',
    title: 'Presentation',
    icon: '▶',
    window: { width: 260, height: 96 },
    mount(w) {
      injectStyles();
      w.bodyEl.classList.add('pres-body');
      w.bodyEl.innerHTML = `
        <button class="pres-btn" data-prev>◀</button>
        <div class="pres-counter" data-counter>– / ${SLIDE_COUNT}</div>
        <button class="pres-btn" data-next>▶</button>
      `;

      const prevBtn = w.bodyEl.querySelector('[data-prev]');
      const nextBtn = w.bodyEl.querySelector('[data-next]');
      const counter = w.bodyEl.querySelector('[data-counter]');

      let idx = -1;
      let slideWin = null;

      function updateCounter() {
        counter.textContent = (idx < 0 ? '–' : (idx + 1)) + ' / ' + SLIDE_COUNT;
        prevBtn.disabled = idx <= 0;
        nextBtn.disabled = idx >= SLIDE_COUNT - 1;
      }

      function openSlide(n) {
        if (n < 0 || n >= SLIDE_COUNT) return;
        if (slideWin) { try { slideWin.close(); } catch (e) {} }
        idx = n;
        slideWin = WM.open('slide-view', { slideIdx: n, multi: true });
        updateCounter();
        w.focus();
      }

      prevBtn.addEventListener('click', () => openSlide(idx < 0 ? 0 : idx - 1));
      nextBtn.addEventListener('click', () => openSlide(idx < 0 ? 0 : idx + 1));

      w.bodyEl.tabIndex = 0;
      w.bodyEl.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); openSlide(idx < 0 ? 0 : idx - 1); }
        else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); openSlide(idx < 0 ? 0 : idx + 1); }
      });

      /* If the slide window is closed manually, reset so next click opens fresh */
      const onWinClose = (e) => {
        if (slideWin && e.detail && e.detail.wid === slideWin.wid) {
          slideWin = null;
        }
      };
      WM.on('close', onWinClose);
      w.onClose = () => {
        WM.off('close', onWinClose);
        if (slideWin) { try { slideWin.close(); } catch (e) {} }
      };

      updateCounter();
    }
  });
})();
