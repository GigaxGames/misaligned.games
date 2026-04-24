/* Meeting — fake video call */
WM.registerApp({
  id: 'meeting',
  title: 'Meetings',
  icon: '🎥',
  window: { width: 440, height: 360 },
  mount(w) {
    w.bodyEl.classList.add('meet-app');
    w.bodyEl.innerHTML = `
      <div class="menu-bar"><span class="mi" data-refresh>Refresh</span></div>
      <div class="meet-list" data-list>
        <div class="muted" style="padding:10px">Loading meetings...</div>
      </div>
    `;
    const list = w.bodyEl.querySelector('[data-list]');
    let meetings = [];

    function load() {
      fetch('./data/meetings.json').then(r => r.json()).then(m => {
        meetings = m;
        render();
      }).catch(e => { list.innerHTML = '<div style="padding:10px;color:#b1331b">Failed to load.</div>'; console.error(e); });
    }
    load();
    w.bodyEl.querySelector('[data-refresh]').addEventListener('click', load);

    function render() {
      list.innerHTML = '';
      meetings.forEach((m, i) => {
        const el = document.createElement('div');
        el.className = 'meet-item';
        el.innerHTML = `
          <div>
            <h4>${esc(m.title)}</h4>
            <div class="meta">${esc(m.time)} · ${m.attendees.length} attendee(s)</div>
          </div>
          <button class="btn" data-join="${i}">Join</button>
        `;
        list.appendChild(el);
      });
      list.querySelectorAll('[data-join]').forEach(b => {
        b.addEventListener('click', () => {
          const m = meetings[parseInt(b.dataset.join, 10)];
          WM.open('meet-room', { meeting: m, multi: true, title: m.title });
        });
      });
    }
    function esc(s) { return String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); }
  }
});

WM.registerApp({
  id: 'meet-room',
  title: 'Meeting',
  icon: '🎥',
  multi: true,
  hideFromDesktop: true,
  hideFromStart: true,
  window: { width: 620, height: 420 },
  mount(w, opts) {
    const m = opts.meeting || { title: 'Standup', attendees: [{ name: 'Demo', avatar: '🙂' }] };
    w.setTitle(m.title + ' — Meeting');
    w.bodyEl.classList.add('meet-room');
    w.bodyEl.innerHTML = `
      <div class="meet-stage">
        <div class="meet-rec">REC</div>
        <div class="meet-duration" data-dur>00:00</div>
        <div class="meet-speaker" data-speaker>🙂</div>
        <div class="meet-speaker-name" data-speakern>Host</div>
        <div class="meet-tiles" data-tiles></div>
        <div class="meet-controls">
          <button class="btn" data-mute>🎤 Mute</button>
          <button class="btn" data-cam>📷 Stop Video</button>
          <button class="btn" data-leave style="background:#e04040;color:#fff;border-color:#901818">Leave</button>
        </div>
      </div>
      <div class="meet-chat">
        <div style="padding:4px 8px;background:var(--surface);border-bottom:1px solid var(--shadow-dark);font-weight:700;font-size:11px">Meeting chat</div>
        <div class="meet-chat-log" data-log></div>
        <form class="meet-chat-input">
          <input type="text" placeholder="Type a message..." />
          <button class="btn" type="submit">Send</button>
        </form>
      </div>
    `;
    const stage = w.bodyEl.querySelector('.meet-stage');
    const speaker = w.bodyEl.querySelector('[data-speaker]');
    const speakerN = w.bodyEl.querySelector('[data-speakern]');
    const tiles = w.bodyEl.querySelector('[data-tiles]');
    const durEl = w.bodyEl.querySelector('[data-dur]');
    const log = w.bodyEl.querySelector('[data-log]');
    const form = w.bodyEl.querySelector('form');
    const me = { name: Settings.get('username'), avatar: Settings.get('avatar') };

    const attendees = [me, ...(m.attendees || [])];
    let activeIdx = attendees.length > 1 ? 1 : 0;
    let muted = false, camOff = false;

    function renderTiles() {
      tiles.innerHTML = '';
      attendees.forEach((a, i) => {
        const t = document.createElement('div');
        t.className = 'meet-tile' + (i === activeIdx ? ' speaking' : '') + (a._muted ? ' muted' : '');
        t.innerHTML = `<div>${a.avatar || '🙂'}</div><div class="n">${esc((a.name||'').split(' ')[0])}</div>`;
        t.addEventListener('click', () => { activeIdx = i; updateSpeaker(); renderTiles(); });
        tiles.appendChild(t);
      });
    }
    function updateSpeaker() {
      const a = attendees[activeIdx];
      speaker.textContent = a.avatar || '🙂';
      speakerN.textContent = a.name || '';
    }
    renderTiles(); updateSpeaker();

    const t0 = Date.now();
    const durId = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      const mm = String(Math.floor(s / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      durEl.textContent = mm + ':' + ss;
    }, 1000);

    const rotId = setInterval(() => {
      if (attendees.length < 2) return;
      let next = (activeIdx + 1) % attendees.length;
      if (next === 0 && attendees.length > 1) next = 1;
      activeIdx = next;
      updateSpeaker();
      renderTiles();
    }, 7000);

    const scripted = (m.chat || [
      { who: 'Host', text: 'ok let\'s get started' },
      { who: 'Host', text: 'who has updates?' }
    ]);
    let scriptedIdx = 0;
    const chatId = setInterval(() => {
      if (scriptedIdx >= scripted.length) return;
      const c = scripted[scriptedIdx++];
      chatMsg(c.who, c.text);
    }, 3500);

    function chatMsg(who, text) {
      const el = document.createElement('div');
      el.className = 'meet-chat-msg';
      el.innerHTML = `<span class="who">${esc(who)}:</span> ${esc(text)}`;
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = form.querySelector('input').value.trim();
      if (!v) return;
      chatMsg(me.name, v);
      form.querySelector('input').value = '';
    });

    w.bodyEl.querySelector('[data-mute]').addEventListener('click', e => {
      muted = !muted;
      attendees[0]._muted = muted;
      e.target.textContent = muted ? '🔇 Unmute' : '🎤 Mute';
      renderTiles();
    });
    w.bodyEl.querySelector('[data-cam]').addEventListener('click', e => {
      camOff = !camOff;
      e.target.textContent = camOff ? '📷 Start Video' : '📷 Stop Video';
      attendees[0].avatar = camOff ? '📷' : Settings.get('avatar');
      if (activeIdx === 0) updateSpeaker();
      renderTiles();
    });
    w.bodyEl.querySelector('[data-leave]').addEventListener('click', () => w.close());

    w.onClose = () => {
      clearInterval(durId);
      clearInterval(rotId);
      clearInterval(chatId);
    };

    function esc(s) { return String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); }
  }
});
