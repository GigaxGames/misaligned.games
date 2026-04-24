/* Global zoom — mouse-wheel over any window scales text in all notepad + excel windows */
(function () {
  const BASE_NOTEPAD = 16;   // px
  const BASE_EXCEL_FONT = 15;
  const BASE_EXCEL_H = 26;
  const BASE_EXCEL_W = 108;

  const AppZoom = {
    factor: 1,
    set(f) {
      this.factor = Math.max(0.5, Math.min(4, f));
      this.apply();
    },
    bump(delta) { this.set(this.factor + delta); },
    apply() {
      const f = this.factor;
      document.querySelectorAll('.notepad-area').forEach(a => {
        a.style.fontSize = (BASE_NOTEPAD * f) + 'px';
      });
      document.querySelectorAll('.excel-grid').forEach(g => {
        g.style.fontSize = (BASE_EXCEL_FONT * f) + 'px';
        g.querySelectorAll('td, th').forEach(c => {
          c.style.height = (BASE_EXCEL_H * f) + 'px';
          if (!c.classList.contains('row-head') && !c.classList.contains('corner')) {
            c.style.minWidth = (BASE_EXCEL_W * f) + 'px';
          }
        });
      });
    }
  };

  document.addEventListener('wheel', e => {
    const overWin = e.target.closest('.win');
    if (!overWin) return;
    if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    AppZoom.bump(e.deltaY < 0 ? 0.1 : -0.1);
  }, { passive: false, capture: true });

  window.AppZoom = AppZoom;
})();
