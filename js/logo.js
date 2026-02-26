(function() {
    function wave(i, len, amp) {
        return Math.sin((i / (len - 1)) * Math.PI * 1.8 + 0.5) * amp;
    }

    const LETTERS = [
        { word: 'MISALIGNED', rowOffset: '-0.1em', letters: [
            { rot: -4,  sc: 1.0,  sp: -0.06 },
            { rot: 2,   sc: 0.82, sp: -0.05 },
            { rot: -2,  sc: 0.92, sp: -0.06 },
            { rot: 5,   sc: 0.95, sp: -0.05 },
            { rot: -6,  sc: 0.9,  sp: -0.22 },
            { rot: 5,   sc: 0.78, sp: -0.05, tyOverride: -0.18 },
            { rot: -4,  sc: 0.98, sp: -0.06 },
            { rot: 5,   sc: 1.02, sp: -0.05 },
            { rot: -3,  sc: 0.9,  sp: -0.06 },
            { rot: 7,   sc: 1.06, sp: 0 },
        ]},
        { word: 'GAMES', rowOffset: '0.25em', letters: [
            { rot: 4,   sc: 1.04, sp: 0.02 },
            { rot: -4,  sc: 0.92, sp: 0.01 },
            { rot: 3,   sc: 1.06, sp: 0.02 },
            { rot: -5,  sc: 0.85, sp: 0.01 },
            { rot: 4,   sc: 0.98, sp: 0 },
        ]},
    ];

    LETTERS.forEach(row => {
        const len = row.letters.length;
        row.letters.forEach((l, i) => {
            l.ty = l.tyOverride !== undefined ? l.tyOverride : wave(i, len, 0.15);
        });
    });

    function buildLogo(container) {
        if (!container) return;
        const allSpans = [];
        
        LETTERS.forEach(({ word, letters, rowOffset }) => {
            const row = document.createElement('div');
            row.className = 'logo-row';
            row.style.setProperty('--row-offset', rowOffset || '0');
            const rowSpans = [];
            
            word.split('').forEach((ch, i) => {
                const s = letters[i];
                const span = document.createElement('span');
                span.className = 'logo-letter';
                span.textContent = ch;
                span.style.marginRight = s.sp + 'em';
                span.style.transition = 'transform 0.15s ease-out';
                span.dataset.baseRot = s.rot;
                span.dataset.baseTy = s.ty;
                span.dataset.baseSc = s.sc;
                span.dataset.rowIdx = allSpans.length;
                span.dataset.letterIdx = i;
                
                // Wobble animation state
                const wobbleR = 0.5 + Math.random() * 1;
                const wobbleY = 0.5 + Math.random() * 1.5;
                const dur = 3500 + Math.random() * 3000;
                const delay = Math.random() * dur;
                span._wobble = { r: wobbleR, y: wobbleY, dur, delay, start: null };
                span._hover = { scale: 0, push: 0 };
                
                rowSpans.push(span);
                row.appendChild(span);
            });
            
            allSpans.push(rowSpans);
            container.appendChild(row);
        });
        
        // Animation loop
        function animate(ts) {
            allSpans.forEach((rowSpans, ri) => {
                rowSpans.forEach((span, li) => {
                    const w = span._wobble;
                    const h = span._hover;
                    if (!w.start) w.start = ts - w.delay;
                    
                    const t = ((ts - w.start) % w.dur) / w.dur;
                    const phase = Math.sin(t * Math.PI * 2);
                    
                    const baseR = parseFloat(span.dataset.baseRot);
                    const baseTy = parseFloat(span.dataset.baseTy);
                    const baseSc = parseFloat(span.dataset.baseSc);
                    
                    const r = baseR + phase * w.r + h.push * 3;
                    const y = baseTy + phase * w.y * 0.01 + h.push * 0.05;
                    const sc = baseSc * (1 + h.scale * 0.35);
                    
                    span.style.transform = `rotate(${r}deg) translateY(${y}em) scale(${sc})`;
                    
                    // Decay hover effects
                    h.scale *= 0.92;
                    h.push *= 0.88;
                });
            });
            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
        
        // Mouse interactions
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const mx = e.clientX;
            const my = e.clientY;
            
            allSpans.forEach((rowSpans) => {
                rowSpans.forEach((span, li) => {
                    const sr = span.getBoundingClientRect();
                    const cx = sr.left + sr.width / 2;
                    const cy = sr.top + sr.height / 2;
                    const dist = Math.hypot(mx - cx, my - cy);
                    const maxDist = 80;
                    
                    if (dist < maxDist) {
                        const intensity = 1 - dist / maxDist;
                        span._hover.scale = Math.max(span._hover.scale, intensity);
                        
                        // Push neighbors
                        const dir = mx < cx ? 1 : -1;
                        if (rowSpans[li - 1]) rowSpans[li - 1]._hover.push = Math.max(rowSpans[li - 1]._hover.push, -intensity * dir * 2);
                        if (rowSpans[li + 1]) rowSpans[li + 1]._hover.push = Math.max(rowSpans[li + 1]._hover.push, intensity * dir * 2);
                    }
                });
            });
        });
        
        container.addEventListener('mouseleave', () => {
            allSpans.forEach((rowSpans) => {
                rowSpans.forEach((span) => {
                    span._hover.scale = 0;
                    span._hover.push = 0;
                });
            });
        });
    }

    document.querySelectorAll('.diy-logo').forEach(buildLogo);
})();
