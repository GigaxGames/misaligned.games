// Fire frame animation
const fireEl = document.getElementById('cauldronFire');
const fireFrames = [
    'images/cauldron/fire/CauldronFire1.png',
    'images/cauldron/fire/CauldronFire2.png',
    'images/cauldron/fire/CauldronFire3.png'
];
let fireIdx = 0;
setInterval(() => {
    fireIdx = (fireIdx + 1) % fireFrames.length;
    fireEl.src = fireFrames[fireIdx];
}, 180);

// Smoke: noise-based distortion matching the Godot smoke.gdshader approach
// The shader distorts UV with scrolling noise. We animate transform + opacity
// to simulate the rising, wobbling smoke layers.
const smokeEls = [
    document.getElementById('smoke1'),
    document.getElementById('smoke2'),
    document.getElementById('smoke3')
];

function animateSmoke(time) {
    smokeEls.forEach((el, i) => {
        const t = time * 0.001 + i * 2.5;
        const cycle = ((t * 0.12) % 1);
        const fadeIn = Math.min(cycle / 0.2, 1);
        const fadeOut = Math.max(1 - (cycle - 0.5) / 0.5, 0);
        const opacity = Math.min(fadeIn, fadeOut) * 0.3;
        const yOff = -cycle * 120;
        const xWobble = Math.sin(t * 0.7 + i) * 8;
        const scaleVal = 0.7 + cycle * 0.4;

        el.style.opacity = opacity;
        el.style.transform =
            `translateX(calc(-50% + ${xWobble}px)) translateY(${yOff}px) scale(${scaleVal})`;
    });
    requestAnimationFrame(animateSmoke);
}
requestAnimationFrame(animateSmoke);


// Whirlpool vortex canvas
// Ported from the Godot spatial shader: polar-coordinate swirl with noise,
// funnel depth, and spiral pattern.
const canvas = document.getElementById('swirlCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// Shader uniforms (tuned for the green cauldron look)
const VORTEX = {
    timeScale: 0.3,
    distanceScale: 1.5,
    angleScale: 0.5,
    spiralTimeScale: 1.0,
    noiseScrollSpeed: 2.0,
    waterColor: [0.15, 0.45, 0.12],
    deepColor:  [0.05, 0.25, 0.08],
};

// Hash-based pseudo-noise (replaces texture lookups)
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

function drawVortex(time) {
    const t = time * 0.001;
    const imgData = ctx.createImageData(W, H);
    const px = imgData.data;
    const cx = W / 2, cy = H / 2;
    const maxR = Math.min(cx, cy) * 0.92;

    for (let py = 0; py < H; py++) {
        for (let px2 = 0; px2 < W; px2++) {
            const dx = px2 - cx, dy = py - cy;

            // Elliptical distance (wider than tall, like a cauldron opening viewed at angle)
            const ex = dx / 1.0, ey = dy / 0.55;
            const dist = Math.sqrt(ex * ex + ey * ey);
            if (dist > maxR) continue;

            const normDist = dist / maxR;
            const angle = Math.atan2(dy, dx);

            // Funnel depth: darker at center
            const funnelDepth = Math.pow(1 - normDist, 2.0);

            // Swirl UV (matching shader: distance*distScale + time, angle*angleScale + dist*distScale)
            const swirlDist = normDist * VORTEX.distanceScale + t * VORTEX.timeScale;
            const swirlAngle = angle * VORTEX.angleScale + normDist * VORTEX.distanceScale;

            // Noise lookup (replaces texture(noise_texture, swirl_uv))
            const noiseVal = fbm(swirlDist * 3.0, swirlAngle * 3.0);
            const steppedNoise = noiseVal > 0.5 ? 1.0 : 0.0;
            const whirlpoolMask = 1 - normDist * normDist;
            const swirlEffect = steppedNoise * whirlpoolMask * 0.1;

            // Spiral pattern
            const spiralDist = normDist * 5.0;
            let spiralPattern = (spiralDist + t * VORTEX.spiralTimeScale + angle) % 1.0;
            if (spiralPattern < 0) spiralPattern += 1;
            spiralPattern *= whirlpoolMask * funnelDepth * 0.2;

            // Surface noise (scrolling)
            const noiseOffset = t * VORTEX.noiseScrollSpeed;
            const surfaceNoise = fbm(
                (px2 * 0.02 + noiseOffset),
                (py * 0.02 + noiseOffset * 0.5 + Math.sin(t) * 0.5)
            );
            const banded = Math.floor(surfaceNoise * 2.0 * 4.0) / 4.0;
            const surfaceMask = normDist * normDist;
            const surfaceEffect = banded * surfaceMask * 0.1;

            // Color mixing (water_color <-> deep_water_color based on funnel depth)
            const r = (VORTEX.waterColor[0] * (1 - funnelDepth) + VORTEX.deepColor[0] * funnelDepth
                       + swirlEffect + spiralPattern + surfaceEffect);
            const g = (VORTEX.waterColor[1] * (1 - funnelDepth) + VORTEX.deepColor[1] * funnelDepth
                       + swirlEffect + spiralPattern + surfaceEffect);
            const b = (VORTEX.waterColor[2] * (1 - funnelDepth) + VORTEX.deepColor[2] * funnelDepth
                       + swirlEffect * 0.3 + spiralPattern * 0.3 + surfaceEffect * 0.3);

            // Edge fade
            const edgeFade = 1 - Math.pow(normDist, 3.0);
            const alpha = edgeFade * 0.9;

            const idx = (py * W + px2) * 4;
            px[idx]     = Math.min(r * 255, 255);
            px[idx + 1] = Math.min(g * 255, 255);
            px[idx + 2] = Math.min(b * 255, 255);
            px[idx + 3] = alpha * 255;
        }
    }

    ctx.putImageData(imgData, 0, 0);
    requestAnimationFrame(drawVortex);
}
requestAnimationFrame(drawVortex);
