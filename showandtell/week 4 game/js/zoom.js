/* Global zoom — mouse-wheel over any window scales text in all
   notepad + excel windows. All base sizes are in vh/vw so they
   remain readable at any resolution; --app-zoom multiplies on top. */
(function () {
  const AppZoom = {
    factor: 1,
    set(f) {
      this.factor = Math.max(0.5, Math.min(4, f));
      document.documentElement.style.setProperty('--app-zoom', this.factor);
    },
    bump(delta) { this.set(this.factor + delta); },
    apply() { this.set(this.factor); }
  };

  AppZoom.set(1);

  document.addEventListener('wheel', e => {
    const overWin = e.target.closest('.win');
    if (!overWin) return;
    if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    AppZoom.bump(e.deltaY < 0 ? 0.1 : -0.1);
  }, { passive: false, capture: true });

  window.AppZoom = AppZoom;
})();
