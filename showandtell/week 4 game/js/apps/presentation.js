/* Presentation — slide deck dissected into component windows using real apps.
   Clicking ▶ closes the current slide's windows and opens the next slide's
   windows with a 70ms stagger. Uses notepad / excel / viewer for content. */
(function () {
  const IMG = '../week%204/img/';
  const GIF = './gifs/';
  const STAGGER_MS = 70;

  function injectStyles() {
    if (document.getElementById('pres-ctrl-styles')) return;
    const s = document.createElement('style');
    s.id = 'pres-ctrl-styles';
    s.textContent = `
      .pres-ctrl-body { display: flex; align-items: stretch; justify-content: center; gap: 3%;
        background: var(--surface); height: 100%; padding: 6%; box-sizing: border-box;
        container-type: size; }
      .pres-ctrl-btn { flex: 0 0 auto; aspect-ratio: 1; height: 100%;
        min-width: 32px; min-height: 32px;
        font-size: clamp(14px, 45cqh, 64px); font-weight: 700;
        background: linear-gradient(to bottom, #ffffff, #d7e3f5);
        border: 1px solid #4a6a96; border-radius: 4px; color: #1e3966;
        cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: inherit; padding: 0; }
      .pres-ctrl-btn:hover { background: linear-gradient(to bottom, #f6faff, #bcd0ea); }
      .pres-ctrl-btn:disabled { opacity: 0.4; cursor: default; }
      .pres-ctrl-counter { flex: 1; min-width: 60px; text-align: center;
        display: flex; align-items: center; justify-content: center;
        font-family: "Consolas", "Courier New", monospace;
        font-size: clamp(10px, 22cqh, 28px); font-weight: 700;
        color: #1e3966; background: #fff; border: 1px inset var(--shadow-dark); border-radius: 2px; padding: 0 4%; }
    `;
    document.head.appendChild(s);
  }

  /* Shortcuts */
  const text = (title, content) => ({ app: 'notepad', opts: { title, content } });
  const image = (title, name, file) => ({ app: 'viewer', opts: { title, images: [{ name, src: IMG + file }] } });
  const gallery = (title, imgs, extra) => ({ app: 'viewer', opts: Object.assign({ title, images: imgs }, extra || {}) });
  const table = (title, cells) => ({ app: 'excel', opts: { title, cells } });
  const gif = (title, file) => ({ app: 'viewer', opts: { title, images: [{ name: file, src: GIF + file }] } });

  /* Position helper: returns a part with x/y/w/h attached */
  const at = (x, y, w, h, part) => Object.assign({ x, y, w, h }, part);

  /* --- Slide definitions ----------------------------------------------- */

  const SLIDES = [
    // 0 · TITLE
    [
      at(4, 8, 42, 32, text('Show & Tell',
        'SHOW & TELL\n\n' +
        'April 20–23, 2026')),
      at(48, 14, 48, 72, image('Play the Alpha', 'play the alpha.jpg', 'play the alpha.jpg')),
      at(4, 44, 42, 48, gif('Growth', 'growth.gif'))
    ],

    // 1 · HYPOTHESIS
    [
      at(4, 8, 56, 26, text('Hypothesis',
        'HYPOTHESIS\n\n' +
        "Reddit is good for organic growth —\n" +
        "but it's not enough.")),
      at(4, 38, 56, 32, text('Detail',
        'Push harder. Fix the funnel.')),
      at(62, 10, 34, 64, gif('Growth', 'growth2.gif'))
    ],

    // 2 · REDDIT POSTS + STATS (each screenshot cascades as its own viewer)
    [
      at(4, 6, 54, 18, text('Reddit · Organic',
        'POSTED ACROSS MULTIPLE ANGLES\n\n' +
        '~22K views · 82 upvotes')),
      at(60, 6, 36, 56, table('By Subreddit', {
        'A1': 'Subreddit', 'B1': 'Upvotes', 'C1': 'Comments', 'D1': 'Views',
        'A2': 'r/godot',      'B2': '4',  'C2': '0',  'D2': '607',
        'A3': 'r/indiegames', 'B3': '1',  'C3': '1',  'D3': '110',
        'A4': 'r/IndieDev',   'B4': '2',  'C4': '2',  'D4': '503',
        'A5': 'r/aigamedev',  'B5': '5',  'C5': '0',  'D5': '679',
        'A6': 'r/accelerate', 'B6': '5',  'C6': '2',  'D6': '2100',
        'A7': 'r/LocalLLaMA', 'B7': '65', 'C7': '13', 'D7': '18000',
        'A9': 'SUM',          'B9': '82', 'C9': '18', 'D9': '~22K'
      })),
      // Reddit screenshots — cascaded viewer windows, one per image (screenshots are ~1:1)
      at(2,  28, 24, 52, image('Post 1', 'reddit post 1', 'reddit posts/Screenshot 2026-04-24 at 02.02.12.png')),
      at(8,  32, 24, 52, image('Post 2', 'reddit post 2', 'reddit posts/Screenshot 2026-04-24 at 02.02.22.png')),
      at(14, 36, 24, 52, image('Post 3', 'reddit post 3', 'reddit posts/Screenshot 2026-04-24 at 02.02.30.png')),
      at(20, 40, 24, 52, image('Post 4', 'reddit post 4', 'reddit posts/Screenshot 2026-04-24 at 02.02.43.png')),
      at(26, 44, 24, 52, image('Post 5', 'reddit post 5', 'reddit posts/Screenshot 2026-04-24 at 02.02.53.png')),
      at(32, 48, 24, 52, image('Post 6', 'reddit post 6', 'reddit posts/Screenshot 2026-04-24 at 02.03.09.png')),
      at(60, 64, 36, 30, gif('Clip 3', '3.gif'))
    ],

    // 3 · ORGANIC CEILING (s2b)
    [
      at(4, 6, 60, 14, text('Organic Ceiling',
        'ORGANIC HIT A CEILING')),
      at(4, 24, 42, 22, text('Big subs = noise',
        'BIG SUBS = NOISE')),
      at(4, 48, 42, 22, text('Smaller / technical subs',
        'SMALLER SUBS\n\n' +
        'Engage more · convert less')),
      at(4, 72, 42, 22, text('Account blocked 3×',
        'ACCOUNT BLOCKED 3×')),
      at(50, 24, 46, 42, image('Reddit account blocked', 'account blocked', 'reddit account blocked.png')),
      at(50, 68, 46, 26, gif('Clip 4', '4.gif'))
    ],

    // 4 · PAID ADS (s3)
    [
      at(4, 6, 54, 18, text('Paid Ads',
        'FIRST PAID ADS EXPERIMENT')),
      at(4, 28, 14, 16, text('Budget', '$50 / day')),
      at(20, 28, 14, 16, text('Days',   '4 days')),
      at(36, 28, 14, 16, text('Spend',  '$200 total')),
      at(4, 48, 46, 26, text('Takeaway',
        'TAKEAWAY\n\n' +
        "Reddit alone isn't the channel\n" +
        'that unlocks scale.')),
      at(54, 28, 42, 42, image('Reddit ad', 'reddit ad', 'reddit ad.png')),
      at(54, 72, 42, 22, gif('Clip 5', '5.gif'))
    ],

    // 5 · SCOUTING CHANNELS (s4)
    [
      at(4, 6, 60, 14, text('Scouting Channels',
        'SCOUTING OTHER CHANNELS')),
      at(4, 24, 29, 50, text('Facebook / Instagram',
        '[HEAVY]\n\n' +
        'FACEBOOK / INSTAGRAM')),
      at(35, 24, 29, 50, text('Google / YouTube / Mobile',
        '[PROMISING]\n\n' +
        'GOOGLE / YOUTUBE')),
      at(66, 24, 29, 50, text('Keep Reddit',
        '[NEXT]\n\n' +
        'KEEP REDDIT\nAS BASELINE')),
      at(4, 76, 91, 18, gif('Clip 6', '6.gif'))
    ],

    // 6 · DAU RESPONSE (s4b)
    [
      at(4, 6, 70, 20, text('DAU Response',
        'DAU RESPONSE TO REDDIT PUSH')),
      at(4, 28, 56, 66, image('PostHog DAU', 'posthog DAU', 'posthog DAU.png')),
      at(62, 28, 34, 66, gif('Clip 7', '7.gif'))
    ],

    // 7 · LONG SESSIONS (s5)
    [
      at(4, 6, 70, 20, text('Long Sessions',
        'THE ONES WHO STAYED —\n' +
        'WENT DEEP')),
      at(4, 30, 46, 20, text('Long sessions from survivors',
        'LONG SESSIONS\n\n' +
        '30+ minutes')),
      at(4, 52, 46, 20, text('Return visits too',
        'RETURN VISITS TOO')),
      at(4, 74, 46, 20, text('Implication',
        'IMPLICATION\n\n' +
        'Depth is there. Fix entry friction.')),
      at(54, 30, 42, 42, image('Player detail', 'posthog player detail', 'posthog player detail.png')),
      at(54, 74, 42, 20, gif('Hit Counter', '8.svg'))
    ],

    // 8 · FUNNEL FIXES (s5b)
    [
      at(4, 6, 60, 14, text('Funnel Fixes',
        'REDUCED FRICTION AT THE ENTRY')),
      at(4, 24, 29, 42, text('📦 Smaller build',
        '📦  SMALLER BUILD')),
      at(35, 24, 29, 42, text('🪄 Landing page loader',
        '🪄  LANDING PAGE LOADER')),
      at(66, 24, 29, 42, text('📱 Mobile UX + PWA',
        '📱  MOBILE UX + PWA')),
      at(4, 70, 91, 24, gif('Under Construction', '9.svg'))
    ],

    // 9 · PAIN POINTS (s6)
    [
      at(4, 6, 60, 14, text('Pain Points',
        'FIXED FOR THE PLAYERS WHO STAYED')),
      at(4, 24, 44, 46, text('CPU too hard',
        '[FIXED]\n\n' +
        'CPU TOO HARD\n\n' +
        'Nerfed.')),
      at(52, 24, 44, 46, text('Crafting quests broken',
        '[FIXED]\n\n' +
        'CRAFTING QUESTS BROKEN')),
      at(4, 74, 92, 20, gif('Warning', '10.svg'))
    ],

    // 10 · GAME MODES (s7) — notepad + viewer for each mode
    [
      at(4, 6, 60, 14, text('New Game Modes',
        'NEW SEMANTIC GAME MODES')),
      at(66, 4, 30, 18, gif('NEW!', '11.svg')),
      // Raid: notepad + image
      at(4, 24, 29, 32, text('Raid',
        '[NEW]\n\n' +
        'RAID\n\n' +
        'Cooperative PvE.')),
      at(4, 58, 29, 34, image('Raid', 'raid', 'new gamemodes/RAID.png')),
      // Incremental Semantic
      at(35, 24, 29, 32, text('Incremental Semantic',
        '[NEW]\n\n' +
        'INCREMENTAL\nSEMANTIC\n\n' +
        'Rarity ramp.')),
      at(35, 58, 29, 34, image('Escalation', 'escalation mode', 'new gamemodes/escalation mode.png')),
      // Daily Challenge
      at(66, 24, 29, 32, text('Daily Challenge',
        '[NEW]\n\n' +
        'DAILY CHALLENGE\n\n' +
        'Refreshes every 24h.')),
      at(66, 58, 29, 34, image('Daily Challenge', 'daily challenge', 'new gamemodes/daily challenge.png'))
    ],

    // 11 · SOCIAL REWARDS (s8)
    [
      at(4, 6, 58, 22, text('Social Rewards',
        'REWARDS THAT MAKE\n' +
        'PLAYERS SHOW OFF')),
      at(64, 6, 32, 22, gif('Smileys', '12.svg')),
      at(4, 32, 29, 20, text('😀 Emotes',
        '😀  EMOTES')),
      at(4, 54, 29, 40, image('Emoji example', 'emoji example', 'emoji example.mov')),
      at(35, 32, 29, 20, text('🎴 Card backsides',
        '🎴  CARD BACKSIDES')),
      at(35, 54, 29, 40, gallery('Card backsides',
        [1,2,3,4,5,6,7,8].map(n => ({ name: 'Card ' + n, src: IMG + 'card%20backside/card_0' + n + '.svg' })),
        { stageBackground: '#fff' })),
      at(66, 32, 29, 20, text('🏆 Player titles',
        '🏆  PLAYER TITLES')),
      at(66, 54, 29, 40, image('Player titles', 'title example', 'title example.png'))
    ],

    // 12 · GRID + RARITY (s9)
    [
      at(4, 6, 60, 14, text('Grid + Rarity',
        'GRID + RARITY TUNING')),
      at(66, 4, 30, 18, gif('Legendary', '13.svg')),
      at(4, 24, 46, 32, text('Grid — Internal Playtest',
        '[INTERNAL PLAYTEST]\n\n' +
        'GRID\n\n' +
        'Needs another design pass.')),
      at(4, 58, 46, 34, text('Rarity matters more',
        '[SHIPPED]\n\n' +
        'RARITY MATTERS MORE')),
      at(52, 24, 44, 68, image('Grid mode', 'gridmode', 'gridmode.png'))
    ]
  ];

  /* --- Controller ------------------------------------------------------ */
  WM.registerApp({
    id: 'presentation',
    title: 'Presentation',
    icon: '▶',
    window: { width: 340, height: 140 },
    mount(w) {
      injectStyles();
      /* Size the controller relative to viewport on first open */
      const vh = window.innerHeight / 100;
      w.el.style.width = Math.max(280, Math.round(32 * vh)) + 'px';
      w.el.style.height = Math.max(130, Math.round(13 * vh)) + 'px';
      w.bodyEl.classList.add('pres-ctrl-body');
      w.bodyEl.innerHTML = `
        <button class="pres-ctrl-btn" data-prev>◀</button>
        <div class="pres-ctrl-counter" data-counter>– / ${SLIDES.length}</div>
        <button class="pres-ctrl-btn" data-next>▶</button>
      `;
      const prevBtn = w.bodyEl.querySelector('[data-prev]');
      const nextBtn = w.bodyEl.querySelector('[data-next]');
      const counter = w.bodyEl.querySelector('[data-counter]');

      let idx = -1;
      let partWins = [];
      let openTimers = [];

      function updateCounter() {
        counter.textContent = (idx < 0 ? '–' : (idx + 1)) + ' / ' + SLIDES.length;
        prevBtn.disabled = idx <= 0;
        nextBtn.disabled = idx >= SLIDES.length - 1;
      }

      function closeAll() {
        openTimers.forEach(t => clearTimeout(t));
        openTimers = [];
        partWins.forEach(win => { try { win.close(); } catch (e) {} });
        partWins = [];
      }

      function openSlide(n) {
        if (n < 0 || n >= SLIDES.length) return;
        closeAll();
        idx = n;
        updateCounter();
        const parts = SLIDES[n];
        const desk = document.getElementById('desktop');
        const dw = desk.clientWidth, dh = desk.clientHeight;

        parts.forEach((part, i) => {
          const t = setTimeout(() => {
            const width = Math.max(180, Math.floor(dw * part.w / 100));
            const height = Math.max(120, Math.floor(dh * part.h / 100));
            const win = WM.open(part.app, Object.assign({ multi: true, width, height }, part.opts || {}));
            if (win) {
              win.el.style.left = Math.floor(dw * part.x / 100) + 'px';
              win.el.style.top = Math.floor(dh * part.y / 100) + 'px';
              win.el.style.width = width + 'px';
              win.el.style.height = height + 'px';
              partWins.push(win);
            }
          }, i * STAGGER_MS);
          openTimers.push(t);
        });
        const refocus = setTimeout(() => w.focus(), parts.length * STAGGER_MS + 20);
        openTimers.push(refocus);
      }

      prevBtn.addEventListener('click', () => openSlide(idx < 0 ? 0 : idx - 1));
      nextBtn.addEventListener('click', () => openSlide(idx < 0 ? 0 : idx + 1));

      w.bodyEl.tabIndex = 0;
      w.bodyEl.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); openSlide(idx < 0 ? 0 : idx - 1); }
        else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); openSlide(idx < 0 ? 0 : idx + 1); }
      });

      const onWinClose = (e) => {
        if (!e.detail) return;
        partWins = partWins.filter(pw => pw.wid !== e.detail.wid);
      };
      WM.on('close', onWinClose);
      w.onClose = () => { WM.off('close', onWinClose); closeAll(); };

      updateCounter();
    }
  });
})();
