/* Image Viewer — static gallery */
(function () {
  function injectStyles() {
    if (document.getElementById('viewer-styles')) return;
    const s = document.createElement('style');
    s.id = 'viewer-styles';
    s.textContent = `
      .viewer-body { display: flex; flex-direction: column; background: var(--surface); height: 100%; }
      .viewer-toolbar { display: flex; align-items: center; gap: 4px; padding: 4px 6px; background: var(--surface); border-bottom: 1px solid var(--shadow-dark); }
      .viewer-toolbar .btn { padding: 3px 10px; font-size: 11px; }
      .viewer-toolbar .spacer { flex: 1; }
      .viewer-toolbar .viewer-title { font-weight: 700; font-size: 11px; padding: 0 6px; }
      .viewer-stage {
        flex: 1; min-height: 0;
        display: flex; align-items: center; justify-content: center;
        background: #1a1a1a;
        overflow: hidden;
        position: relative;
      }
      .viewer-stage img {
        max-width: 100%; max-height: 100%;
        image-rendering: pixelated;
        box-shadow: 0 6px 24px rgba(0,0,0,0.5);
      }
      .viewer-nav {
        position: absolute; top: 50%; transform: translateY(-50%);
        width: 36px; height: 36px; border: 0; border-radius: 50%;
        background: rgba(0,0,0,0.55); color: #fff; font-size: 20px; font-weight: 700;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
      }
      .viewer-nav:hover { background: rgba(0,0,0,0.8); }
      .viewer-nav.prev { left: 10px; }
      .viewer-nav.next { right: 10px; }
      .viewer-strip {
        display: flex; gap: 4px; padding: 6px; overflow-x: auto;
        background: var(--surface-2); border-top: 1px solid var(--shadow-dark);
        scrollbar-width: thin;
      }
      .viewer-thumb {
        flex: 0 0 auto; width: 72px; height: 56px;
        background: #222 center/cover no-repeat;
        border: 2px solid transparent;
        cursor: pointer;
        image-rendering: pixelated;
      }
      .viewer-thumb.active { border-color: #1746c4; }
      .viewer-status { display: flex; align-items: center; gap: 8px; padding: 2px 6px; background: var(--surface); border-top: 1px solid var(--shadow-dark); font-size: 10px; color: #333; }
      .viewer-status .spacer { flex: 1; }
    `;
    document.head.appendChild(s);
  }

  /* Sample images — inline SVG data URIs so the app is self-contained */
  function svg(content, w = 480, h = 320) {
    const inner = content.replace(/"/g, "'");
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' width='${w}' height='${h}'>${inner.replace(/'/g, "'")}</svg>`
    );
  }

  const SAMPLES = [
    {
      name: 'Sunset Ridge.png',
      src: svg(`
        <defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stop-color='#ff9a5a'/><stop offset='0.5' stop-color='#ff5e8a'/><stop offset='1' stop-color='#3a2158'/>
        </linearGradient></defs>
        <rect width='480' height='320' fill='url(#g)'/>
        <circle cx='360' cy='120' r='48' fill='#ffeac4' opacity='0.9'/>
        <polygon points='0,260 80,180 140,220 220,150 300,200 400,170 480,230 480,320 0,320' fill='#1a0f33'/>
        <polygon points='0,280 60,230 130,260 200,210 300,250 400,230 480,270 480,320 0,320' fill='#0a0619' opacity='0.8'/>
      `)
    },
    {
      name: 'Forest Path.png',
      src: svg(`
        <rect width='480' height='320' fill='#2a6b3a'/>
        <rect y='180' width='480' height='140' fill='#3a8a4a'/>
        <polygon points='180,180 240,120 300,180' fill='#1a4a26'/>
        <polygon points='60,200 120,110 180,200' fill='#1a4a26'/>
        <polygon points='320,200 380,130 440,200' fill='#1a4a26'/>
        <polygon points='230,320 250,180 260,320' fill='#b8a06a'/>
        <path d='M 200 320 Q 240 260 240 220 Q 240 260 280 320 Z' fill='#6a5a3a' opacity='0.6'/>
      `)
    },
    {
      name: 'Ocean Blue.png',
      src: svg(`
        <defs><linearGradient id='o' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stop-color='#74c0ff'/><stop offset='0.5' stop-color='#2a74e0'/><stop offset='1' stop-color='#0a2858'/>
        </linearGradient></defs>
        <rect width='480' height='320' fill='url(#o)'/>
        <circle cx='120' cy='70' r='26' fill='#fff' opacity='0.85'/>
        <circle cx='170' cy='60' r='18' fill='#fff' opacity='0.8'/>
        <path d='M 0 220 Q 120 200 240 220 T 480 220 L 480 320 L 0 320 Z' fill='#0a2858' opacity='0.8'/>
        <path d='M 0 240 Q 80 230 160 245 T 320 240 T 480 245 L 480 320 L 0 320 Z' fill='#0a1a44'/>
      `)
    },
    {
      name: 'City Neon.png',
      src: svg(`
        <rect width='480' height='320' fill='#0d0720'/>
        <rect x='40' y='80' width='60' height='220' fill='#1a1030'/>
        <rect x='120' y='40' width='80' height='260' fill='#1e1238'/>
        <rect x='220' y='100' width='50' height='200' fill='#1a1030'/>
        <rect x='290' y='60' width='70' height='240' fill='#1e1238'/>
        <rect x='380' y='90' width='60' height='210' fill='#1a1030'/>
        ${Array.from({length: 60}).map(() => {
          const x = Math.floor(Math.random()*480);
          const y = Math.floor(Math.random()*240)+40;
          const c = ['#ff5ea8','#5afffb','#ffe14a','#b07aff'][Math.floor(Math.random()*4)];
          return `<rect x='${x}' y='${y}' width='3' height='3' fill='${c}'/>`;
        }).join('')}
        <line x1='0' y1='300' x2='480' y2='300' stroke='#5afffb' stroke-width='2'/>
      `)
    },
    {
      name: 'Mountain Dawn.png',
      src: svg(`
        <defs><linearGradient id='m' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stop-color='#ffc870'/><stop offset='0.6' stop-color='#ff7e94'/><stop offset='1' stop-color='#4a3658'/>
        </linearGradient></defs>
        <rect width='480' height='320' fill='url(#m)'/>
        <polygon points='0,240 100,120 180,190 260,80 360,180 480,140 480,320 0,320' fill='#2a1a3a'/>
        <polygon points='60,240 140,170 180,190 140,240' fill='#fff' opacity='0.4'/>
        <polygon points='240,200 260,80 290,180' fill='#fff' opacity='0.4'/>
        <polygon points='0,260 80,210 160,250 260,200 360,240 480,210 480,320 0,320' fill='#0f0a1e'/>
      `)
    },
    {
      name: 'Desert Dune.png',
      src: svg(`
        <defs><linearGradient id='d' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stop-color='#ffd17a'/><stop offset='1' stop-color='#e87a3a'/>
        </linearGradient></defs>
        <rect width='480' height='320' fill='url(#d)'/>
        <circle cx='380' cy='100' r='36' fill='#fff2a8'/>
        <path d='M 0 240 Q 160 180 320 230 T 480 220 L 480 320 L 0 320 Z' fill='#c0622a'/>
        <path d='M 0 280 Q 120 240 240 275 T 480 270 L 480 320 L 0 320 Z' fill='#8a3e1a'/>
      `)
    },
    {
      name: 'Pixel Office.png',
      src: svg(`
        <rect width='480' height='320' fill='#3a6ea5'/>
        <rect x='40' y='60' width='400' height='220' fill='#ece9d8' stroke='#716f64' stroke-width='2'/>
        <rect x='40' y='60' width='400' height='22' fill='#0a246a'/>
        <rect x='60' y='100' width='120' height='80' fill='#d4d0c8' stroke='#716f64'/>
        <rect x='200' y='100' width='120' height='80' fill='#d4d0c8' stroke='#716f64'/>
        <rect x='340' y='100' width='80' height='80' fill='#d4d0c8' stroke='#716f64'/>
        <rect x='60' y='200' width='360' height='60' fill='#fff' stroke='#716f64'/>
        <text x='80' y='232' font-family='monospace' font-size='14' fill='#000'>C:\\&gt; hello world_</text>
      `)
    },
    {
      name: 'Gradient Grid.png',
      src: svg(`
        <rect width='480' height='320' fill='#0a0a12'/>
        ${Array.from({length: 8}).map((_, r) =>
          Array.from({length: 12}).map((_, c) => {
            const hue = (r * 30 + c * 20) % 360;
            return `<rect x='${c*40}' y='${r*40}' width='38' height='38' fill='hsl(${hue},70%,55%)'/>`;
          }).join('')
        ).join('')}
      `)
    }
  ];

  WM.registerApp({
    id: 'viewer',
    title: 'Image Viewer',
    icon: '🖼',
    multi: true,
    window: { width: 560, height: 440 },
    mount(w) {
      injectStyles();
      w.bodyEl.classList.add('viewer-body');
      w.bodyEl.innerHTML = `
        <div class="viewer-toolbar">
          <button class="btn" data-prev>◀ Previous</button>
          <button class="btn" data-next>Next ▶</button>
          <span class="spacer"></span>
          <span class="viewer-title" data-name></span>
        </div>
        <div class="viewer-stage">
          <button class="viewer-nav prev" data-prev>‹</button>
          <img data-img alt="">
          <button class="viewer-nav next" data-next>›</button>
        </div>
        <div class="viewer-strip" data-strip></div>
        <div class="viewer-status"><span data-status>Loading…</span><span class="spacer"></span><span data-index></span></div>
      `;

      const imgEl = w.bodyEl.querySelector('[data-img]');
      const nameEl = w.bodyEl.querySelector('[data-name]');
      const strip = w.bodyEl.querySelector('[data-strip]');
      const statusEl = w.bodyEl.querySelector('[data-status]');
      const indexEl = w.bodyEl.querySelector('[data-index]');

      let idx = 0;

      function show(i) {
        idx = (i + SAMPLES.length) % SAMPLES.length;
        const img = SAMPLES[idx];
        imgEl.src = img.src;
        imgEl.alt = img.name;
        nameEl.textContent = img.name;
        statusEl.textContent = img.name;
        indexEl.textContent = `${idx + 1} / ${SAMPLES.length}`;
        strip.querySelectorAll('.viewer-thumb').forEach((t, n) => {
          t.classList.toggle('active', n === idx);
        });
        const active = strip.querySelector('.viewer-thumb.active');
        if (active) active.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }

      SAMPLES.forEach((img, i) => {
        const t = document.createElement('div');
        t.className = 'viewer-thumb';
        t.style.backgroundImage = `url("${img.src}")`;
        t.title = img.name;
        t.addEventListener('click', () => show(i));
        strip.appendChild(t);
      });

      w.bodyEl.querySelectorAll('[data-prev]').forEach(b => b.addEventListener('click', () => show(idx - 1)));
      w.bodyEl.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => show(idx + 1)));

      w.bodyEl.tabIndex = 0;
      w.bodyEl.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
      });

      show(0);
    }
  });
})();
