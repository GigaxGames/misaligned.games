/* Presentation — slide deck dissected into component windows using real apps.
   Clicking ▶ closes the current slide's windows and opens the next slide's
   windows with a 70ms stagger. Uses notepad / excel / viewer for content. */
(function () {
  const IMG = '../week%204/img/';
  const STAGGER_MS = 70;

  function injectStyles() {
    if (document.getElementById('pres-ctrl-styles')) return;
    const s = document.createElement('style');
    s.id = 'pres-ctrl-styles';
    s.textContent = `
      .pres-ctrl-body { display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--surface); height: 100%; padding: 8px; }
      .pres-ctrl-btn { width: 56px; height: 56px; font-size: 28px; font-weight: 700;
        background: linear-gradient(to bottom, #ffffff, #d7e3f5);
        border: 1px solid #4a6a96; border-radius: 4px; color: #1e3966;
        cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: inherit; }
      .pres-ctrl-btn:hover { background: linear-gradient(to bottom, #f6faff, #bcd0ea); }
      .pres-ctrl-btn:disabled { opacity: 0.4; cursor: default; }
      .pres-ctrl-counter { min-width: 72px; text-align: center;
        font-family: "Consolas", "Courier New", monospace; font-size: 16px; font-weight: 700;
        color: #1e3966; background: #fff; border: 1px inset var(--shadow-dark); padding: 6px 10px; border-radius: 2px; }
    `;
    document.head.appendChild(s);
  }

  /* Shortcuts */
  const text = (title, content) => ({ app: 'notepad', opts: { title, content } });
  const image = (title, name, file) => ({ app: 'viewer', opts: { title, images: [{ name, src: IMG + file }] } });
  const gallery = (title, imgs, extra) => ({ app: 'viewer', opts: Object.assign({ title, images: imgs }, extra || {}) });
  const table = (title, cells) => ({ app: 'excel', opts: { title, cells } });

  /* Position helper: returns a part with x/y/w/h attached */
  const at = (x, y, w, h, part) => Object.assign({ x, y, w, h }, part);

  /* --- Slide definitions ----------------------------------------------- */

  const SLIDES = [
    // 0 · TITLE
    [
      at(4, 8, 42, 32, text('Show & Tell',
        'SHOW & TELL\n' +
        '===========\n\n' +
        'Entropedia · Week 4\n' +
        'April 20–23, 2026\n\n' +
        '— Supercell')),
      at(48, 14, 48, 72, image('Play the Alpha', 'play the alpha.jpg', 'play the alpha.jpg'))
    ],

    // 1 · HYPOTHESIS
    [
      at(4, 8, 56, 26, text('Hypothesis',
        "THIS WEEK'S HYPOTHESIS\n" +
        '=======================\n\n' +
        "Reddit is good for organic growth —\n" +
        "but it's not enough.")),
      at(4, 38, 56, 32, text('Detail',
        'Organic posts brought the first real wave of players.\n\n' +
        'Now we need to see what breaks when we push harder —\n' +
        'and fix the funnel underneath.'))
    ],

    // 2 · REDDIT POSTS + STATS (each screenshot cascades as its own viewer)
    [
      at(4, 6, 54, 18, text('Reddit · Organic',
        'Hypothesis · Reddit · Organic\n' +
        '=============================\n\n' +
        'Posted Across Multiple Angles\n\n' +
        'Tested different hooks and subs.\n' +
        '~22K combined views · 82 upvotes.')),
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
      at(32, 48, 24, 52, image('Post 6', 'reddit post 6', 'reddit posts/Screenshot 2026-04-24 at 02.03.09.png'))
    ],

    // 3 · ORGANIC CEILING (s2b)
    [
      at(4, 6, 60, 14, text('Organic Ceiling',
        'Hypothesis · Reddit · Organic\n' +
        '=============================\n\n' +
        'Organic Hit a Ceiling')),
      at(4, 24, 42, 22, text('Big subs = noise',
        'BIG SUBS = NOISE\n\n' +
        'Too much competing content.\n' +
        'Much more effort per post to differentiate.')),
      at(4, 48, 42, 22, text('Smaller / technical subs',
        'SMALLER / TECHNICAL SUBS\n\n' +
        'Engagement, worse conversion.\n' +
        'Niche audiences interact more,\n' +
        'but fewer actually play.')),
      at(4, 72, 42, 22, text('Account blocked 3×',
        'ACCOUNT BLOCKED 3×\n\n' +
        "Reddit's anti-spam kept suspending the account.\n" +
        'Unblocked each time, but real friction.')),
      at(50, 24, 46, 68, image('Reddit account blocked', 'account blocked', 'reddit account blocked.png'))
    ],

    // 4 · PAID ADS (s3)
    [
      at(4, 6, 54, 18, text('Paid Ads',
        'Hypothesis · Reddit · Paid\n' +
        '==========================\n\n' +
        'First Paid Ads Experiment\n\n' +
        "Tried Reddit's native promoted posts.")),
      at(4, 28, 14, 16, text('Budget', '   $50\n\nDaily Budget')),
      at(20, 28, 14, 16, text('Days',   '   4\n\nDays Running')),
      at(36, 28, 14, 16, text('Spend',  '   $200\n\nTotal Spend')),
      at(4, 48, 46, 26, text('Takeaway',
        'TAKEAWAY\n\n' +
        'Useful baseline — but Reddit alone\n' +
        "probably isn't the channel that unlocks scale.")),
      at(54, 28, 42, 64, image('Reddit ad', 'reddit ad', 'reddit ad.png'))
    ],

    // 5 · SCOUTING CHANNELS (s4)
    [
      at(4, 6, 60, 14, text('Scouting Channels',
        'Hypothesis · Reddit\n' +
        '===================\n\n' +
        'Scouting Other Channels')),
      at(4, 24, 29, 60, text('Facebook / Instagram',
        '[HEAVY]\n\n' +
        'FACEBOOK / INSTAGRAM\n\n' +
        'Account-centric platforms.\n' +
        'Need a whole content/brand presence\n' +
        'to be worth the spend —\n' +
        'big lift for one person.')),
      at(35, 24, 29, 60, text('Google / YouTube / Mobile',
        '[PROMISING]\n\n' +
        'GOOGLE / YOUTUBE / MOBILE\n\n' +
        'Cheaper intent-based targeting.\n' +
        'But need real mobile support first —\n' +
        'otherwise paid mobile traffic\n' +
        'churns instantly.')),
      at(66, 24, 29, 60, text('Keep Reddit',
        '[NEXT]\n\n' +
        'KEEP REDDIT AS BASELINE\n\n' +
        'Posts + small paid spend stay.\n' +
        'Expand once mobile is solid.'))
    ],

    // 6 · DAU RESPONSE (s4b)
    [
      at(4, 6, 70, 20, text('DAU Response',
        'Result · Analytics\n' +
        '==================\n\n' +
        'DAU Response to Reddit Push\n\n' +
        'Organic + promoted posts moved the needle —\n' +
        'but we need more than that.')),
      at(4, 28, 92, 66, image('PostHog DAU', 'posthog DAU', 'posthog DAU.png'))
    ],

    // 7 · LONG SESSIONS (s5)
    [
      at(4, 6, 70, 20, text('Long Sessions',
        'Retention · Signal\n' +
        '==================\n\n' +
        'The Ones Who Stayed — Went Deep\n\n' +
        'Players who powered through the broken quests\n' +
        'and brutal CPU racked up long sessions.')),
      at(4, 30, 46, 20, text('Long sessions from survivors',
        'LONG SESSIONS FROM SURVIVORS\n\n' +
        'Once a player gets past the rough edges,\n' +
        'they stay in for extended play — 30+ minutes.')),
      at(4, 52, 46, 20, text('Return visits too',
        'RETURN VISITS TOO\n\n' +
        'Same users coming back across days —\n' +
        "even with CPU that was beating them\n" +
        "and quests they couldn't finish.")),
      at(4, 74, 46, 20, text('Implication',
        'IMPLICATION\n\n' +
        'The depth is already there.\n' +
        'Fix the entry friction (bounce, CPU, quests)\n' +
        'and a lot more people make it to the fun.')),
      at(54, 30, 42, 64, image('Player detail', 'posthog player detail', 'posthog player detail.png'))
    ],

    // 8 · FUNNEL FIXES (s5b)
    [
      at(4, 6, 60, 14, text('Funnel Fixes',
        'Retention · Fixes\n' +
        '=================\n\n' +
        'Reduced Friction at the Entry')),
      at(4, 24, 29, 56, text('📦 Smaller build',
        '📦  SMALLER GODOT BUILD\n\n' +
        'Trimmed build size to cut\n' +
        'load time on first visit.')),
      at(35, 24, 29, 56, text('🪄 Landing page loader',
        '🪄  LANDING PAGE LOADER\n\n' +
        'Keeps users engaged while\n' +
        'the game loads —\n' +
        'no more blank wait.')),
      at(66, 24, 29, 56, text('📱 Mobile UX + PWA',
        '📱  MOBILE UX + PWA\n\n' +
        'Better touch layout,\n' +
        'installable from the browser.'))
    ],

    // 9 · PAIN POINTS (s6)
    [
      at(4, 6, 60, 14, text('Pain Points',
        'Retention · Pain Points\n' +
        '=======================\n\n' +
        'Fixed for the Players Who Stayed')),
      at(4, 24, 44, 60, text('CPU too hard',
        '[FIXED] CPU TOO HARD\n\n' +
        "New players were bouncing off\n" +
        "fights they couldn't win.\n\n" +
        "Nerfed CPU opponents so they're\n" +
        'actually beatable — ramp feels fair.')),
      at(52, 24, 44, 60, text('Crafting quests broken',
        '[FIXED] CRAFTING QUESTS BROKEN\n\n' +
        'Several crafting quests were unclearable.\n' +
        'Silent churn driver — repaired this week.'))
    ],

    // 10 · GAME MODES (s7) — notepad + viewer for each mode
    [
      at(4, 6, 60, 14, text('New Game Modes',
        'Hypothesis · Depth\n' +
        '==================\n\n' +
        'New Semantic Game Modes')),
      // Raid: notepad + image
      at(4, 24, 29, 32, text('Raid',
        '[NEW]\n\n' +
        'RAID\n\n' +
        'Cooperative PvE.\n' +
        'Chain builder + raid player\n' +
        'team up on a shared boss.')),
      at(4, 58, 29, 34, image('Raid', 'raid', 'new gamemodes/RAID.png')),
      // Incremental Semantic
      at(35, 24, 29, 32, text('Incremental Semantic',
        '[NEW]\n\n' +
        'INCREMENTAL SEMANTIC\n\n' +
        'Rarity escalates round by round.\n' +
        'Common → legendary pressure ramp.')),
      at(35, 58, 29, 34, image('Escalation', 'escalation mode', 'new gamemodes/escalation mode.png')),
      // Daily Challenge
      at(66, 24, 29, 32, text('Daily Challenge',
        '[NEW]\n\n' +
        'DAILY CHALLENGE\n\n' +
        "Craft a mythic card matching\n" +
        "today's target.\n" +
        'Refreshes every 24h.')),
      at(66, 58, 29, 34, image('Daily Challenge', 'daily challenge', 'new gamemodes/daily challenge.png'))
    ],

    // 11 · SOCIAL REWARDS (s8)
    [
      at(4, 6, 70, 22, text('Social Rewards',
        'Depth · Social\n' +
        '==============\n\n' +
        'Rewards That Make Players Show Off\n\n' +
        'Light social layer so returning players\n' +
        'have something to earn and display.')),
      at(4, 32, 29, 20, text('😀 Emotes',
        '😀  EMOTES\n\n' +
        'In-match expression —\n' +
        'cheering, taunting, reacting.')),
      at(4, 54, 29, 40, image('Emoji example', 'emoji example', 'emoji example.mov')),
      at(35, 32, 29, 20, text('🎴 Card backsides',
        '🎴  CARD BACKSIDES\n\n' +
        'Cosmetic card backs\n' +
        'players unlock and equip.')),
      at(35, 54, 29, 40, gallery('Card backsides',
        [1,2,3,4,5,6,7,8].map(n => ({ name: 'Card ' + n, src: IMG + 'card%20backside/card_0' + n + '.svg' })),
        { stageBackground: '#fff' })),
      at(66, 32, 29, 20, text('🏆 Player titles',
        '🏆  PLAYER TITLES\n\n' +
        'Earnable tags shown next to names —\n' +
        'light status signal.')),
      at(66, 54, 29, 40, image('Player titles', 'title example', 'title example.png'))
    ],

    // 12 · GRID + RARITY (s9)
    [
      at(4, 6, 60, 14, text('Grid + Rarity',
        'Status\n' +
        '======\n\n' +
        'Grid + Rarity Tuning')),
      at(4, 24, 46, 32, text('Grid — Internal Playtest',
        '[INTERNAL PLAYTEST]\n\n' +
        'GRID\n\n' +
        'Played between us this week.\n' +
        'Mechanically works — but still\n' +
        'lacking something.\n' +
        'Needs another design pass\n' +
        'before we take it out.')),
      at(4, 58, 46, 34, text('Rarity matters more',
        '[SHIPPED]\n\n' +
        'RARITY MATTERS MORE\n\n' +
        'Updated existing modes to weigh\n' +
        'rarity more heavily — player-requested.\n' +
        'Legendary plays now feel legendary.')),
      at(52, 24, 44, 68, image('Grid mode', 'gridmode', 'gridmode.png'))
    ]
  ];

  /* --- Controller ------------------------------------------------------ */
  WM.registerApp({
    id: 'presentation',
    title: 'Presentation',
    icon: '▶',
    window: { width: 260, height: 96 },
    mount(w) {
      injectStyles();
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
