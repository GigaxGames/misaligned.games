/* About — tiny info window */
WM.registerApp({
  id: 'about',
  title: 'About',
  icon: 'ℹ',
  hideFromDesktop: true,
  hideFromStart: true,
  window: { width: 360, height: 220 },
  mount(w) {
    w.bodyEl.innerHTML = `
      <div class="about-box">
        <h2>Show and Tell · Week 4</h2>
        <p>A retro desktop playground.</p>
        <p class="version">Week 4 · Office Edition</p>
        <p class="muted">Built with vanilla HTML, CSS, JS. No frameworks, no build step.</p>
        <p><button class="btn" data-ok>OK</button></p>
      </div>
    `;
    w.bodyEl.querySelector('[data-ok]').addEventListener('click', () => w.close());
  }
});
