/* Email — Outlook Express vibe */
WM.registerApp({
  id: 'email',
  title: 'Inbox',
  icon: '✉',
  window: { width: 640, height: 440 },
  mount(w) {
    w.bodyEl.classList.add('mail-app');
    w.bodyEl.innerHTML = `
      <div class="menu-bar">
        <span class="mi" data-new>New Message</span>
        <span class="mi" data-reply>Reply</span>
        <span class="mi" data-del>Delete</span>
        <span class="mi" data-mark>Mark read</span>
      </div>
      <div class="mail-folders" data-folders></div>
      <div class="mail-main">
        <div class="mail-list" data-list></div>
        <div class="mail-split" data-split></div>
        <div class="mail-preview" data-preview>
          <div class="muted" style="padding:20px">Select a message to read.</div>
        </div>
      </div>
    `;

    const foldersEl = w.bodyEl.querySelector('[data-folders]');
    const listEl = w.bodyEl.querySelector('[data-list]');
    const prevEl = w.bodyEl.querySelector('[data-preview]');

    let messages = [];
    let folder = 'Inbox';
    let selected = null;

    fetch('./data/emails.json').then(r => r.json()).then(data => {
      messages = data.map((m, i) => ({ ...m, id: i, folder: m.folder || 'Inbox', read: !!m.read }));
      renderFolders();
      renderList();
    }).catch(e => { console.error(e); listEl.innerHTML = '<div style="padding:10px;color:#b1331b">Failed to load messages.</div>'; });

    function folderCounts() {
      const c = { Inbox: 0, Sent: 0, Drafts: 0, Trash: 0 };
      messages.forEach(m => { c[m.folder] = (c[m.folder] || 0) + (m.folder === 'Inbox' && !m.read ? 1 : 0); });
      // Overrides: Inbox shows unread, others show total
      const total = {};
      messages.forEach(m => { total[m.folder] = (total[m.folder] || 0) + 1; });
      return { c, total };
    }

    function renderFolders() {
      const names = ['Inbox', 'Sent', 'Drafts', 'Trash'];
      const { c, total } = folderCounts();
      foldersEl.innerHTML = '';
      names.forEach(n => {
        const el = document.createElement('div');
        el.className = 'mail-folder' + (n === folder ? ' active' : '');
        el.innerHTML = `<span>${icon(n)} ${n}</span><span class="count">${n === 'Inbox' ? (c.Inbox || 0) : ''}</span>`;
        el.addEventListener('click', () => { folder = n; selected = null; renderFolders(); renderList(); renderPreview(null); });
        foldersEl.appendChild(el);
      });
    }

    function icon(n) {
      return { Inbox: '📥', Sent: '📤', Drafts: '📝', Trash: '🗑' }[n] || '📁';
    }

    function renderList() {
      const rows = messages.filter(m => m.folder === folder).sort((a, b) => b.id - a.id);
      listEl.innerHTML = `<div class="mail-list-head"><div>!</div><div>From / Subject</div><div>Date</div><div>Size</div></div>`;
      if (!rows.length) {
        listEl.innerHTML += '<div class="muted" style="padding:10px">No messages.</div>';
        return;
      }
      rows.forEach(m => {
        const el = document.createElement('div');
        el.className = 'mail-list-row' + (m.read ? '' : ' unread') + (selected === m.id ? ' active' : '');
        el.innerHTML = `
          <div class="col">${m.read ? '' : '●'}</div>
          <div class="col"><b>${esc(m.from || m.to || '')}</b> — ${esc(m.subject)}</div>
          <div class="col">${esc(m.date || '')}</div>
          <div class="col">${Math.ceil((m.body || '').length / 100)} KB</div>
        `;
        el.addEventListener('click', () => { selected = m.id; m.read = true; renderList(); renderFolders(); renderPreview(m); });
        listEl.appendChild(el);
      });
    }

    function renderPreview(m) {
      if (!m) { prevEl.innerHTML = '<div class="muted" style="padding:20px">Select a message to read.</div>'; return; }
      prevEl.innerHTML = `
        <h3>${esc(m.subject)}</h3>
        <div class="meta">
          <div>From: <b>${esc(m.from || '')}</b></div>
          <div>To: <b>${esc(m.to || 'me@colleague.local')}</b></div>
          <div>Date: ${esc(m.date || '')}</div>
        </div>
        <div class="body">${esc(m.body)}</div>
      `;
    }

    function esc(s) { return String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); }

    w.bodyEl.querySelector('[data-new]').addEventListener('click', () => openCompose());
    w.bodyEl.querySelector('[data-reply]').addEventListener('click', () => {
      const m = messages.find(x => x.id === selected);
      if (!m) return;
      openCompose({ to: m.from, subject: 'Re: ' + m.subject, body: '\n\n— original —\n' + m.body });
    });
    w.bodyEl.querySelector('[data-del]').addEventListener('click', () => {
      const m = messages.find(x => x.id === selected);
      if (!m) return;
      if (m.folder === 'Trash') { messages = messages.filter(x => x.id !== m.id); }
      else { m.folder = 'Trash'; }
      selected = null;
      renderList(); renderFolders(); renderPreview(null);
      Toast('Moved to Trash.');
    });
    w.bodyEl.querySelector('[data-mark]').addEventListener('click', () => {
      const m = messages.find(x => x.id === selected);
      if (!m) return;
      m.read = !m.read;
      renderList(); renderFolders();
    });

    function openCompose(pre = {}) {
      const cw = WM.open('compose', { multi: true });
      // If compose app unregistered, fall back by opening a child inline
      if (!cw) return;
      cw.state.prefill(pre, onSend);
    }

    function onSend(data) {
      messages.push({
        id: messages.length,
        from: 'me@colleague.local',
        to: data.to,
        subject: data.subject,
        body: data.body,
        date: new Date().toLocaleString(),
        folder: 'Sent',
        read: true
      });
      renderFolders();
      if (folder === 'Sent') renderList();
      Sounds && Sounds.play('confirm');
      Toast('Message sent.');
    }

    // vertical drag split
    const split = w.bodyEl.querySelector('[data-split]');
    split.addEventListener('pointerdown', e => {
      e.preventDefault();
      const mainEl = split.parentElement;
      const startY = e.clientY;
      const rows = getComputedStyle(mainEl).gridTemplateRows.split(' ');
      const startListH = parseFloat(rows[0]);
      const totalH = mainEl.getBoundingClientRect().height;
      split.setPointerCapture(e.pointerId);
      const move = ev => {
        const dy = ev.clientY - startY;
        const nh = Math.max(80, Math.min(totalH - 80, startListH + dy));
        mainEl.style.gridTemplateRows = `${nh}px 6px 1fr`;
      };
      const up = () => {
        split.releasePointerCapture(e.pointerId);
        split.removeEventListener('pointermove', move);
        split.removeEventListener('pointerup', up);
      };
      split.addEventListener('pointermove', move);
      split.addEventListener('pointerup', up);
    });
  }
});

/* Compose — separate app registration so it opens as its own window */
WM.registerApp({
  id: 'compose',
  title: 'New Message',
  icon: '✏',
  multi: true,
  hideFromDesktop: true,
  hideFromStart: true,
  window: { width: 500, height: 380 },
  mount(w) {
    w.bodyEl.innerHTML = `
      <form class="compose-form">
        <div class="row"><label>To:</label><input type="text" name="to" /></div>
        <div class="row"><label>Subject:</label><input type="text" name="subject" /></div>
        <textarea name="body" placeholder="Type your message..."></textarea>
        <div style="padding:6px;display:flex;gap:6px;border-top:1px solid var(--shadow-dark);background:var(--surface)">
          <button type="submit" class="btn">Send</button>
          <button type="button" class="btn" data-cancel>Cancel</button>
        </div>
      </form>
    `;
    let onSend = null;
    const f = w.bodyEl.querySelector('form');
    w.state.prefill = (pre, cb) => {
      onSend = cb;
      f.to.value = pre.to || '';
      f.subject.value = pre.subject || '';
      f.body.value = pre.body || '';
      if (pre.subject) w.setTitle(pre.subject + ' — New Message');
    };
    f.addEventListener('submit', e => {
      e.preventDefault();
      const data = { to: f.to.value, subject: f.subject.value || '(no subject)', body: f.body.value };
      if (!data.to) { Toast('Add a recipient.'); return; }
      if (onSend) onSend(data);
      w.close();
    });
    w.bodyEl.querySelector('[data-cancel]').addEventListener('click', () => w.close());
  }
});
