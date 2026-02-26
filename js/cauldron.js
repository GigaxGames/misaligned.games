// Cauldron animation module
// Handles fire frames, smoke distortion, and vortex rendering.
// Reusable: works on any page with the right DOM elements.

(function () {
    // Fire: cycle through 3 frames on all fire elements
    const fireEls = document.querySelectorAll('.c-fire');
    const fireFrames = [
        'images/cauldron/fire/CauldronFire1.png',
        'images/cauldron/fire/CauldronFire2.png',
        'images/cauldron/fire/CauldronFire3.png'
    ];
    let fireIdx = 0;
    setInterval(() => {
        fireIdx = (fireIdx + 1) % fireFrames.length;
        fireEls.forEach(el => { el.src = fireFrames[fireIdx]; });
    }, 180);

    // Smoke: noise-based rising wobble on all .c-smoke elements
    const smokeEls = document.querySelectorAll('.c-smoke');
    function animateSmoke(time) {
        smokeEls.forEach((el, i) => {
            const group = Math.floor(i / 3);
            const local = i % 3;
            const t = time * 0.001 + local * 2.5 + group * 7;
            const cycle = (t * 0.11) % 1;
            const fadeIn = Math.min(cycle / 0.15, 1);
            const fadeOut = Math.max(1 - (cycle - 0.4) / 0.6, 0);
            const opacity = Math.min(fadeIn, fadeOut) * 0.35;
            const yOff = -cycle * 140;
            const xWobble = Math.sin(t * 0.6 + local * 2) * 12;
            const scaleVal = 0.8 + cycle * 0.35;

            el.style.opacity = opacity;
            el.style.transform =
                `translateX(calc(-50% + ${xWobble}px)) translateY(${yOff}px) scale(${scaleVal})`;
        });
        requestAnimationFrame(animateSmoke);
    }
    requestAnimationFrame(animateSmoke);

    // Vortex: port of the whirlpool spatial shader
    function hash(x, y) {
        const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        return n - Math.floor(n);
    }

    function smoothNoise(x, y) {
        const ix = Math.floor(x), iy = Math.floor(y);
        const fx = x - ix, fy = y - iy;
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        return (hash(ix, iy) * (1 - sx) + hash(ix + 1, iy) * sx) * (1 - sy) +
               (hash(ix, iy + 1) * (1 - sx) + hash(ix + 1, iy + 1) * sx) * sy;
    }

    function fbm(x, y) {
        let v = 0, amp = 0.5;
        for (let i = 0; i < 3; i++) {
            v += smoothNoise(x, y) * amp;
            x *= 2.0; y *= 2.0; amp *= 0.5;
        }
        return v;
    }

    const canvases = document.querySelectorAll('.c-swirl');

    function drawVortex(time) {
        const t = time * 0.001;

        canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            const W = canvas.width, H = canvas.height;
            const imgData = ctx.createImageData(W, H);
            const px = imgData.data;
            const cx = W / 2, cy = H / 2;

            for (let py = 0; py < H; py++) {
                for (let px2 = 0; px2 < W; px2++) {
                    const dx = px2 - cx, dy = py - cy;
                    // Elliptical: wider than tall (top-down view of round cauldron)
                    const normX = dx / cx;
                    const normY = dy / cy;
                    const normDist = Math.sqrt(normX * normX + normY * normY);

                    if (normDist > 1.0) continue;

                    const angle = Math.atan2(dy, dx);

                    // Funnel depth
                    const funnelDepth = Math.pow(1 - normDist, 2.0);

                    // Swirl UV
                    const swirlDist = normDist * 1.5 + t * 0.3;
                    const swirlAngle = angle * 0.5 + normDist * 1.5;
                    const noiseVal = fbm(swirlDist * 3.0, swirlAngle * 3.0);
                    const stepped = noiseVal > 0.5 ? 1.0 : 0.0;
                    const mask = 1 - normDist * normDist;
                    const swirlFx = stepped * mask * 0.1;

                    // Spiral
                    const spiralDist = normDist * 5.0;
                    let spiral = (spiralDist + t * 1.0 + angle) % 1.0;
                    if (spiral < 0) spiral += 1;
                    spiral *= mask * funnelDepth * 0.25;

                    // Surface noise
                    const surfN = fbm(px2 * 0.02 + t * 2.0, py * 0.02 + t + Math.sin(t) * 0.5);
                    const banded = Math.floor(surfN * 8.0) / 8.0;
                    const surfFx = banded * normDist * normDist * 0.1;

                    // Colors: green liquid
                    const waterR = 0.15, waterG = 0.50, waterB = 0.12;
                    const deepR = 0.04, deepG = 0.22, deepB = 0.06;

                    const r = waterR * (1 - funnelDepth) + deepR * funnelDepth + swirlFx + spiral + surfFx;
                    const g = waterG * (1 - funnelDepth) + deepG * funnelDepth + swirlFx + spiral + surfFx;
                    const b = waterB * (1 - funnelDepth) + deepB * funnelDepth + swirlFx * 0.3 + spiral * 0.3;

                    const edgeFade = 1 - Math.pow(normDist, 2.5);
                    const alpha = edgeFade * 0.92;

                    const idx = (py * W + px2) * 4;
                    px[idx]     = Math.min(r * 255, 255);
                    px[idx + 1] = Math.min(g * 255, 255);
                    px[idx + 2] = Math.min(b * 255, 255);
                    px[idx + 3] = alpha * 255;
                }
            }
            ctx.putImageData(imgData, 0, 0);
        });

        requestAnimationFrame(drawVortex);
    }
    requestAnimationFrame(drawVortex);
})();
