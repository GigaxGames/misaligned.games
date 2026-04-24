/* DataLabel Pro — parody mechanical-turk style labeling gigs */
WM.registerApp({
  id: 'datalabel',
  title: 'DataLabel Pro',
  icon: '🏷',
  window: { width: 560, height: 500 },
  mount(w) {
    w.bodyEl.classList.add('datalabel-app');
    renderLauncher();

    function renderLauncher() {
      w.setTitle('DataLabel Pro');
      w.bodyEl.innerHTML = `
        <div class="dl-launcher">
          <div class="dl-brand">
            <div class="dl-logo">🏷</div>
            <div>
              <div class="dl-brand-name">DataLabel Pro<sup>™</sup></div>
              <div class="dl-brand-sub">Human Intelligence Tasks · Contractor #48291</div>
            </div>
          </div>
          <p class="dl-blurb">Welcome back. Complete tasks to earn credits. Rejected work does not count toward payout.</p>
          <div class="dl-earnings">
            <span>Earnings today:</span><b>$0.00</b>
            <span>Rejection rate:</span><b>—</b>
          </div>
          <div class="dl-tasklist">
            <button class="dl-task-card" data-task="hotdog">
              <div class="dl-task-icon">🌭</div>
              <div class="dl-task-meta">
                <div class="dl-task-title">Hot Dog Classifier</div>
                <div class="dl-task-desc">Binary label. 500 images in queue. $0.02 each.</div>
                <div class="dl-task-tag">NEW · Priority</div>
              </div>
            </button>
            <button class="dl-task-card" data-task="bbox">
              <div class="dl-task-icon">🚗</div>
              <div class="dl-task-meta">
                <div class="dl-task-title">Vehicle Detection (Bounding Box)</div>
                <div class="dl-task-desc">Draw a tight box around each vehicle. Reviewer QA active.</div>
                <div class="dl-task-tag">HIGH REJECT RATE</div>
              </div>
            </button>
            <button class="dl-task-card" data-task="mood">
              <div class="dl-task-icon">🙂</div>
              <div class="dl-task-meta">
                <div class="dl-task-title">Mood Tagger</div>
                <div class="dl-task-desc">Label emotion: Happy / Sad / Neutral. Balanced labels required.</div>
                <div class="dl-task-tag">DIVERSITY QUOTA</div>
              </div>
            </button>
          </div>
          <div class="dl-footer">Terms of Service: by clicking, you certify you are a human. Answers cannot be contested.</div>
        </div>
      `;
      w.bodyEl.querySelectorAll('[data-task]').forEach(btn => {
        btn.addEventListener('click', () => {
          const t = btn.dataset.task;
          Sounds && Sounds.play('click');
          if (t === 'hotdog') renderHotdog();
          else if (t === 'bbox') renderBBox();
          else if (t === 'mood') renderMood();
        });
      });
    }

    function backBar(label) {
      return `
        <div class="dl-topbar">
          <button class="dl-back" data-back>← Task list</button>
          <div class="dl-topbar-title">${label}</div>
        </div>
      `;
    }

    function wireBack() {
      const b = w.bodyEl.querySelector('[data-back]');
      if (b) b.addEventListener('click', renderLauncher);
    }

    /* ============ TASK 1: HOT DOG CLASSIFIER ============ */
    function renderHotdog() {
      w.setTitle('DataLabel Pro — Hot Dog Classifier');
      // Curated dataset of real Wikimedia Commons images.
      // `truth` = what the reviewer's ground-truth says. Parody: some ambiguous items
      // have suspicious "ground truth" so the player gets rejected unfairly.
      const HOTDOGS = [
        // Clear hot dogs
        { src: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Hotdog_-_Evan_Swigart.jpg', truth: 'yes' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Hot_dog.jpg', truth: 'yes' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Hot_dog_01.jpg', truth: 'yes' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Hot_dog_on_counter%2C_close-up.jpg', truth: 'yes' },
        // Ambiguous — parody: reviewer insists these ARE hotdogs
        { src: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Corn_dog_001.jpg', truth: 'yes' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Corn_dog_with_mustard.jpg', truth: 'yes' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/German_Bratw%C3%BCrste.jpg', truth: 'yes' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Polish_kie%C5%82basa.jpg', truth: 'no' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Heaps_of_sausage_rolls.jpg', truth: 'yes' },
        // Clearly NOT
        { src: 'https://upload.wikimedia.org/wikipedia/commons/6/62/NCI_Visuals_Food_Hamburger.jpg', truth: 'no' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/7/73/001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg', truth: 'no' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Hoagie_Hero_Sub_Sandwich.jpg', truth: 'no' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg', truth: 'no' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Margherita_pizza.jpg', truth: 'no' }
      ];
      // Shuffle dataset each batch
      for (let k = HOTDOGS.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [HOTDOGS[k], HOTDOGS[j]] = [HOTDOGS[j], HOTDOGS[k]];
      }
      let remaining = 500;
      let correct = 0;
      let wrong = 0;
      let i = 0;

      w.bodyEl.innerHTML = `
        ${backBar('Hot Dog Classifier')}
        <div class="dl-hd">
          <div class="dl-hd-status">
            <span>Remaining: <b data-rem>500</b></span>
            <span>Correct: <b data-correct>0</b></span>
            <span>Rejected: <b data-wrong>0</b></span>
          </div>
          <div class="dl-hd-stage">
            <div class="dl-hd-image" data-img>
              <div class="dl-loading">Loading…</div>
            </div>
            <div class="dl-hd-question">Is this a hot dog?</div>
            <div class="dl-hd-hint">No "unsure" option. Please decide.</div>
            <div class="dl-hd-actions">
              <button class="dl-btn dl-btn-red" data-ans="no">✗ NOT HOT DOG</button>
              <button class="dl-btn dl-btn-green" data-ans="yes">✓ HOT DOG</button>
            </div>
            <div class="dl-hd-feedback" data-feedback></div>
          </div>
        </div>
      `;
      wireBack();

      const imgBox = w.bodyEl.querySelector('[data-img]');
      const remEl = w.bodyEl.querySelector('[data-rem]');
      const correctEl = w.bodyEl.querySelector('[data-correct]');
      const wrongEl = w.bodyEl.querySelector('[data-wrong]');
      const feedback = w.bodyEl.querySelector('[data-feedback]');

      function nextImage() {
        const item = HOTDOGS[i % HOTDOGS.length];
        imgBox.innerHTML = `<div class="dl-loading">Loading…</div>`;
        const img = new Image();
        img.className = 'dl-photo';
        img.alt = 'labeling image';
        img.referrerPolicy = 'no-referrer';
        img.src = item.src;
        img.onload = () => { imgBox.innerHTML = ''; imgBox.appendChild(img); };
        img.onerror = () => {
          imgBox.innerHTML = `<div class="dl-photo dl-fallback">📷<br><small>image #${i}<br>(connection error · label anyway)</small></div>`;
        };
        imgBox._truth = item.truth;
      }

      w.bodyEl.querySelectorAll('[data-ans]').forEach(b => {
        b.addEventListener('click', () => {
          const ans = b.dataset.ans;
          Sounds && Sounds.play('click');
          const truth = imgBox._truth;
          if (ans === truth) { correct++; correctEl.textContent = correct; feedback.textContent = '✓ Submitted.'; feedback.className = 'dl-hd-feedback ok'; }
          else { wrong++; wrongEl.textContent = wrong; feedback.textContent = '⚠ Reviewer disagreed. No payout for this label.'; feedback.className = 'dl-hd-feedback bad'; Sounds && Sounds.play('error'); }
          remaining = Math.max(0, remaining - 1);
          remEl.textContent = remaining;
          i++;
          if (remaining === 0) {
            w.bodyEl.innerHTML = `
              ${backBar('Hot Dog Classifier')}
              <div class="dl-done">
                <div class="dl-done-title">Batch complete.</div>
                <p>You labeled 500 images. ${correct} accepted, ${wrong} rejected.</p>
                <p>A new batch of <b>500</b> is now available.</p>
                <button class="dl-btn" data-again>Start next batch</button>
              </div>
            `;
            wireBack();
            w.bodyEl.querySelector('[data-again]').addEventListener('click', renderHotdog);
            return;
          }
          setTimeout(() => { feedback.textContent = ''; feedback.className = 'dl-hd-feedback'; }, 900);
          nextImage();
        });
      });

      nextImage();
    }

    /* ============ TASK 2: VEHICLE BOUNDING BOX ============ */
    function renderBBox() {
      w.setTitle('DataLabel Pro — Vehicle Detection');
      const DATASET = [
        'https://upload.wikimedia.org/wikipedia/commons/7/77/Peugeot_508-SW_Side_view.JPG',
        'https://upload.wikimedia.org/wikipedia/commons/f/f1/Jaguar_XF_Side-view.JPG',
        'https://upload.wikimedia.org/wikipedia/commons/0/04/Citroen_C5-Sedan-Mk2_Front-view.JPG',
        'https://upload.wikimedia.org/wikipedia/commons/8/8f/Fiat_128-Sedan-4dr_%281969%29_Front-view.JPG',
        'https://upload.wikimedia.org/wikipedia/commons/4/49/Holden_HD_Special_Sedan.JPG'
      ];
      let i = 0;
      let attempts = 0;
      let submitted = 0;

      w.bodyEl.innerHTML = `
        ${backBar('Vehicle Detection — draw bounding box')}
        <div class="dl-bb">
          <div class="dl-bb-status">
            <span>Submitted: <b data-sub>0</b></span>
            <span>Attempts: <b data-att>0</b></span>
            <span>Reviewer: <b data-reviewer>online</b></span>
          </div>
          <div class="dl-bb-canvas-wrap">
            <div class="dl-bb-canvas" data-canvas>
              <div class="dl-loading">Loading frame…</div>
            </div>
            <div class="dl-bb-overlay" data-overlay></div>
          </div>
          <div class="dl-bb-inst">Drag to draw the tightest possible bounding box around the vehicle.</div>
          <div class="dl-bb-actions">
            <button class="dl-btn" data-clear>Clear box</button>
            <button class="dl-btn dl-btn-green" data-submit>Submit for review</button>
          </div>
          <div class="dl-bb-feedback" data-feedback></div>
        </div>
      `;
      wireBack();

      const canvas = w.bodyEl.querySelector('[data-canvas]');
      const overlay = w.bodyEl.querySelector('[data-overlay]');
      const feedback = w.bodyEl.querySelector('[data-feedback]');
      const subEl = w.bodyEl.querySelector('[data-sub]');
      const attEl = w.bodyEl.querySelector('[data-att]');
      let box = null; // {x,y,w,h} in canvas coords

      function loadFrame() {
        const src = DATASET[i % DATASET.length];
        canvas.innerHTML = `<div class="dl-loading">Loading frame…</div>`;
        overlay.innerHTML = '';
        box = null;
        feedback.textContent = '';
        feedback.className = 'dl-bb-feedback';
        const img = new Image();
        img.className = 'dl-bb-img';
        img.alt = 'dashcam frame';
        img.referrerPolicy = 'no-referrer';
        img.src = src;
        img.onload = () => { canvas.innerHTML = ''; canvas.appendChild(img); };
        img.onerror = () => {
          canvas.innerHTML = `<div class="dl-bb-img dl-fallback">🛣<br><small>frame #${i}<br>(connection error · box it anyway)</small></div>`;
        };
      }

      let dragging = false, sx = 0, sy = 0;
      canvas.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        e.preventDefault();
        const r = canvas.getBoundingClientRect();
        sx = e.clientX - r.left; sy = e.clientY - r.top;
        dragging = true;
        canvas.setPointerCapture(e.pointerId);
        box = { x: sx, y: sy, w: 0, h: 0 };
        drawBox();
      });
      canvas.addEventListener('pointermove', e => {
        if (!dragging) return;
        const r = canvas.getBoundingClientRect();
        const cx = e.clientX - r.left, cy = e.clientY - r.top;
        box.x = Math.min(sx, cx);
        box.y = Math.min(sy, cy);
        box.w = Math.abs(cx - sx);
        box.h = Math.abs(cy - sy);
        drawBox();
      });
      canvas.addEventListener('pointerup', () => { dragging = false; });
      canvas.addEventListener('pointercancel', () => { dragging = false; });

      function drawBox() {
        if (!box) { overlay.innerHTML = ''; return; }
        overlay.innerHTML = `<div class="dl-bb-box" style="left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px"></div>`;
      }

      w.bodyEl.querySelector('[data-clear]').addEventListener('click', () => { box = null; drawBox(); feedback.textContent = ''; });

      w.bodyEl.querySelector('[data-submit]').addEventListener('click', () => {
        if (!box || box.w < 10 || box.h < 10) {
          feedback.textContent = '✗ Reviewer: no box detected. Draw a box first.';
          feedback.className = 'dl-bb-feedback bad';
          Sounds && Sounds.play('error');
          return;
        }
        attempts++;
        attEl.textContent = attempts;

        // Parody "reviewer": reject most submissions with nitpicks.
        // Deterministic-ish per attempt so it feels like a real reviewer with opinions.
        const rejectionReasons = [
          'Box too loose. Tighten to vehicle edge (>3px margin).',
          'Box too tight. Include side mirror.',
          'Missed a vehicle in the background.',
          'Partial occlusion — include only visible portions.',
          'Wheels cut off. Reject.',
          'Box includes shadow. Vehicle only.',
          'Ambiguous: is this a vehicle? Please re-evaluate.',
          'Reviewer on break. Please re-submit.',
          'Outside of labeling policy v4.2.1. Re-read guidelines.',
          'Color of box must be red per v4.2.2. (No way to change this — submit anyway.)'
        ];
        // Accept roughly 1 in 4 — the first attempt always rejects, for maximum annoyance.
        const shouldAccept = attempts > 1 && Math.random() < 0.28;
        if (shouldAccept) {
          submitted++;
          subEl.textContent = submitted;
          feedback.textContent = '✓ Accepted. Payout pending review (est. 6–8 weeks).';
          feedback.className = 'dl-bb-feedback ok';
          Sounds && Sounds.play('confirm');
          i++;
          setTimeout(loadFrame, 1100);
        } else {
          const reason = rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)];
          feedback.textContent = '✗ Rejected: ' + reason;
          feedback.className = 'dl-bb-feedback bad';
          Sounds && Sounds.play('error');
          // keep same frame, force retry — exactly like real MTurk QA hell
          box = null; drawBox();
        }
      });

      loadFrame();
    }

    /* ============ TASK 3: MOOD TAGGER ============ */
    function renderMood() {
      w.setTitle('DataLabel Pro — Mood Tagger');
      const PORTRAITS = [
        'https://upload.wikimedia.org/wikipedia/commons/5/53/000_Galina_Ch.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/1/10/01_Elena_Folk.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/0/05/Louisa_McLaughlin.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/7/78/Shirley_Abrahamson.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/d/d0/Aletta_Jacobs%2C_1895-1905.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/6/64/Actress_Anna_Unterberger.jpg'
      ];
      let i = 0;
      const history = []; // recent labels
      const dist = { happy: 0, sad: 0, neutral: 0 };

      w.bodyEl.innerHTML = `
        ${backBar('Mood Tagger')}
        <div class="dl-mood">
          <div class="dl-mood-stats">
            <div class="dl-bar"><span>Happy</span><div class="dl-bar-track"><div class="dl-bar-fill happy" data-bar="happy"></div></div><b data-count-happy>0</b></div>
            <div class="dl-bar"><span>Sad</span><div class="dl-bar-track"><div class="dl-bar-fill sad" data-bar="sad"></div></div><b data-count-sad>0</b></div>
            <div class="dl-bar"><span>Neutral</span><div class="dl-bar-track"><div class="dl-bar-fill neutral" data-bar="neutral"></div></div><b data-count-neutral>0</b></div>
          </div>
          <div class="dl-mood-stage">
            <div class="dl-mood-image" data-img><div class="dl-loading">Loading…</div></div>
            <div class="dl-mood-question">What mood does this person express?</div>
            <div class="dl-mood-actions">
              <button class="dl-btn dl-btn-mood happy" data-mood="happy">🙂 Happy</button>
              <button class="dl-btn dl-btn-mood sad" data-mood="sad">🙁 Sad</button>
              <button class="dl-btn dl-btn-mood neutral" data-mood="neutral">😐 Neutral</button>
            </div>
            <div class="dl-mood-feedback" data-feedback></div>
          </div>
        </div>
      `;
      wireBack();

      const imgBox = w.bodyEl.querySelector('[data-img]');
      const feedback = w.bodyEl.querySelector('[data-feedback]');

      function updateBars() {
        const total = Math.max(1, dist.happy + dist.sad + dist.neutral);
        for (const k of Object.keys(dist)) {
          w.bodyEl.querySelector(`[data-bar="${k}"]`).style.width = (dist[k] / total * 100) + '%';
          w.bodyEl.querySelector(`[data-count-${k}]`).textContent = dist[k];
        }
      }

      function loadNext() {
        const src = PORTRAITS[i % PORTRAITS.length];
        imgBox.innerHTML = `<div class="dl-loading">Loading…</div>`;
        const img = new Image();
        img.className = 'dl-mood-photo';
        img.referrerPolicy = 'no-referrer';
        img.src = src;
        img.onload = () => { imgBox.innerHTML = ''; imgBox.appendChild(img); };
        img.onerror = () => {
          imgBox.innerHTML = `<div class="dl-mood-photo dl-fallback">🧑<br><small>portrait #${i}<br>(connection error · label anyway)</small></div>`;
        };
      }

      w.bodyEl.querySelectorAll('[data-mood]').forEach(b => {
        b.addEventListener('click', () => {
          const label = b.dataset.mood;
          Sounds && Sounds.play('click');

          // Boss wants variety. If the last 4 labels are identical, reject.
          history.push(label);
          if (history.length > 6) history.shift();
          const last4 = history.slice(-4);
          const allSame = last4.length === 4 && last4.every(x => x === last4[0]);

          if (allSame) {
            feedback.innerHTML = '<b>DIVERSITY ALERT</b> — your last 4 labels were all <b>' + last4[0] + '</b>. Our dataset needs balanced labels. Please choose differently.';
            feedback.className = 'dl-mood-feedback bad';
            Sounds && Sounds.play('error');
            // Pop the offending label, force re-label
            history.pop();
            return;
          }

          // Also: boss wants at least 20% of each category. If "neutral" >50% of total, nudge.
          const total = dist.happy + dist.sad + dist.neutral + 1;
          if (label === 'neutral' && (dist.neutral + 1) / total > 0.5 && total > 6) {
            feedback.innerHTML = 'Reviewer note: too many <b>neutral</b> labels. Consider if subject is <i>subtly</i> happy or sad.';
            feedback.className = 'dl-mood-feedback bad';
            Sounds && Sounds.play('error');
            history.pop();
            return;
          }

          dist[label]++;
          updateBars();
          feedback.textContent = '✓ Submitted.';
          feedback.className = 'dl-mood-feedback ok';
          setTimeout(() => { feedback.textContent = ''; feedback.className = 'dl-mood-feedback'; }, 700);
          i++;
          loadNext();
        });
      });

      loadNext();
      updateBars();
    }
  }
});
