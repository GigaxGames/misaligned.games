/* Sounds — Kenney Interface Sounds (CC0). See sounds/LICENSE.txt
 *
 * Per-event sound mapping. Defaults picked to be subtle.
 * User can change mappings in Control Panel → Sounds.
 */
(function () {
  // All available WAVs, grouped for the Control Panel picker
  const catalog = {
    Open:     ['open_001','open_002','open_003','open_004'],
    Close:    ['close_001','close_002','close_003','close_004'],
    Minimize: ['minimize_001','minimize_002','minimize_003','minimize_004','minimize_005','minimize_006','minimize_007','minimize_008','minimize_009'],
    Maximize: ['maximize_001','maximize_002','maximize_003','maximize_004','maximize_005','maximize_006','maximize_007','maximize_008','maximize_009'],
    Error:    ['error_001','error_002','error_003','error_004','error_005','error_006','error_007','error_008'],
    Confirm:  ['confirmation_001','confirmation_002','confirmation_003','confirmation_004'],
    Click:    ['click_001','click_002','click_003','click_004','click_005'],
    Select:   ['select_001','select_002','select_003','select_004','select_005','select_006','select_007','select_008'],
    Switch:   ['switch_001','switch_002','switch_003','switch_004','switch_005','switch_006','switch_007'],
    Toggle:   ['toggle_001','toggle_002','toggle_003','toggle_004'],
    Back:     ['back_001','back_002','back_003','back_004'],
    Drop:     ['drop_001','drop_002','drop_003','drop_004'],
    Glass:    ['glass_001','glass_002','glass_003','glass_004','glass_005','glass_006'],
    Glitch:   ['glitch_001','glitch_002','glitch_003','glitch_004'],
    Scroll:   ['scroll_001','scroll_002','scroll_003','scroll_004','scroll_005'],
    Scratch:  ['scratch_001','scratch_002','scratch_003','scratch_004','scratch_005'],
    Pluck:    ['pluck_001','pluck_002'],
    Bong:     ['bong_001'],
    Tick:     ['tick_001','tick_002','tick_004'],
    Question: ['question_001','question_002','question_003','question_004']
  };

  // Events the app plays, with default sound (use `none` to silence an event)
  const events = [
    { id: 'startup',  label: 'Startup chime',             def: 'none' },
    { id: 'open',     label: 'Open window',               def: 'click_001' },
    { id: 'close',    label: 'Close window',              def: 'click_002' },
    { id: 'minimize', label: 'Minimize window',           def: 'click_003' },
    { id: 'maximize', label: 'Maximize window',           def: 'click_004' },
    { id: 'error',    label: 'Error / failure',           def: 'click_005' },
    { id: 'confirm',  label: 'Confirmation / success',    def: 'click_001' },
    { id: 'click',    label: 'Button click',              def: 'click_002' },
    { id: 'nudge',    label: 'MSN nudge',                 def: 'click_003' },
    { id: 'ping',     label: 'Incoming chat message',     def: 'click_004' },
    { id: 'notify',   label: 'Notification / toast',      def: 'click_005' },
    { id: 'toggle',   label: 'Toggle',                    def: 'click_001' }
  ];

  const MAP_KEY = 'cmc:windows:sound-map:v2';

  function defaultMap() {
    const m = {};
    events.forEach(e => m[e.id] = e.def);
    return m;
  }

  function loadMap() {
    try {
      const raw = localStorage.getItem(MAP_KEY);
      if (!raw) return defaultMap();
      return { ...defaultMap(), ...JSON.parse(raw) };
    } catch {
      return defaultMap();
    }
  }

  let map = loadMap();

  function saveMap() {
    try { localStorage.setItem(MAP_KEY, JSON.stringify(map)); } catch {}
  }

  function getMap() { return { ...map }; }
  function setMap(patch) { map = { ...map, ...patch }; saveMap(); }
  function resetMap() { map = defaultMap(); saveMap(); }

  const cache = {};
  let unlocked = false;
  let lastPlay = {};

  function audioFor(name) {
    if (!name || name === 'none') return null;
    if (cache[name]) return cache[name];
    const a = new Audio('./sounds/' + name + '.wav');
    a.preload = 'auto';
    cache[name] = a;
    return a;
  }

  function playFile(name, opts = {}) {
    const s = Settings.get();
    if (!s.sound && !opts.force) return;
    const vol = Math.max(0, Math.min(1, (s.volume || 0) / 100));
    if (vol <= 0 && !opts.force) return;
    const base = audioFor(name);
    if (!base) return;
    const a = base.cloneNode();
    a.volume = opts.force ? Math.max(0.3, vol) : vol;
    a.play().catch(() => {});
  }

  function play(eventId, opts = {}) {
    if (!unlocked && !opts.force) return;
    const now = performance.now();
    if (lastPlay[eventId] && now - lastPlay[eventId] < (opts.throttle || 40)) return;
    lastPlay[eventId] = now;
    const file = map[eventId];
    if (!file || file === 'none') return;
    playFile(file, opts);
  }

  function preview(file) {
    // Always audible even if master sound is off — this is for the picker
    if (!file || file === 'none') return;
    const a = new Audio('./sounds/' + file + '.wav');
    a.volume = 0.9;
    a.play().catch(() => {});
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
  }

  const unlockOnce = () => {
    unlock();
    window.removeEventListener('pointerdown', unlockOnce, true);
    window.removeEventListener('keydown', unlockOnce, true);
    // Play the startup sound ONLY if user has chosen one
    if (map.startup && map.startup !== 'none') {
      play('startup', { force: true });
    }
  };
  window.addEventListener('pointerdown', unlockOnce, true);
  window.addEventListener('keydown', unlockOnce, true);

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.WM) return;
    WM.on('open',     () => play('open'));
    WM.on('close',    () => play('close'));
    WM.on('minimize', () => play('minimize'));
    WM.on('maximize', () => play('maximize'));
  });

  window.Sounds = {
    play, preview, unlock,
    isUnlocked: () => unlocked,
    catalog,
    events,
    getMap, setMap, resetMap,
    defaultMap
  };
})();
