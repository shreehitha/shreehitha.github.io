/**
 * PortraitParticles
 * Renders an abstract particle "portrait" from an input image onto a canvas.
 *
 * Usage:
 *  - Add <canvas id="portrait-canvas"></canvas>
 *  - Add a data attribute for image path if desired:
 *      <canvas id="portrait-canvas" data-image="images2/silhouette.png"></canvas>
 *
 * Notes:
 *  - For best results use a high-contrast silhouette (dark subject on light bg OR vice versa).
 *  - This is a lightweight Canvas2D implementation (no external libs).
 */

class PortraitParticles {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.options = {
            imageSrc: options.imageSrc || canvas.getAttribute('data-image') || 'images2/silhouette.png',
            density: options.density ?? 7, // lower = more particles
            maxParticles: options.maxParticles ?? 1500,
            threshold: options.threshold ?? 70, // alpha threshold (0-255)
            pointSize: options.pointSize ?? 0.7,
            jitter: options.jitter ?? 0.8,
            lineMaxDist: options.lineMaxDist ?? 24,
            lineOpacity: options.lineOpacity ?? 0.12,
            repelRadius: options.repelRadius ?? 90,
            repelStrength: options.repelStrength ?? 2.2,
            returnForce: options.returnForce ?? 0.06,
            friction: options.friction ?? 0.88,
            colors: options.colors || [
                'rgba(226, 214, 196, 0.6)',
                'rgba(195, 185, 170, 0.55)',
                'rgba(166, 158, 145, 0.5)',
                'rgba(148, 142, 132, 0.45)'
            ],
            backgroundFade: options.backgroundFade ?? 0.12,
        };

        this.mouse = { x: null, y: null };
        this.particles = [];
        this.image = new Image();
        this.image.crossOrigin = 'anonymous';

        this._raf = null;
        this._resizeObserver = null;
        this._boundMouseMove = (e) => this.onMouseMove(e);
        this._boundMouseLeave = () => this.onMouseLeave();
        this._boundResize = () => this.rebuild();
    }

    start() {
        this.attachEvents();
        this.loadImageAndBuild();
    }

    stop() {
        this.detachEvents();
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = null;
    }

    attachEvents() {
        window.addEventListener('mousemove', this._boundMouseMove);
        window.addEventListener('mouseleave', this._boundMouseLeave);
        window.addEventListener('resize', this._boundResize);
    }

    detachEvents() {
        window.removeEventListener('mousemove', this._boundMouseMove);
        window.removeEventListener('mouseleave', this._boundMouseLeave);
        window.removeEventListener('resize', this._boundResize);
    }

    onMouseMove(e) {
        // Disable mouse interaction - keep particles static
        this.mouse.x = null;
        this.mouse.y = null;
        return;
    }

    onMouseLeave() {
        this.mouse.x = null;
        this.mouse.y = null;
    }

    resizeCanvasToElement() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = Math.max(1, Math.floor(rect.width * dpr));
        const h = Math.max(1, Math.floor(rect.height * dpr));
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
        }
    }

    loadImageAndBuild() {
        this.image.onload = () => {
            this.rebuild();
        };
        this.image.onerror = () => {
            // Fail silently (keeps layout clean)
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        };
        // Cache-bust so updates to silhouette.png are always picked up, even with aggressive browser caching.
        const cacheBust = `${this.options.imageSrc}?v=${Date.now()}`;
        this.image.src = cacheBust;
    }

    rebuild() {
        this.resizeCanvasToElement();
        this.buildParticlesFromImage();
        this.animate();
    }

    buildParticlesFromImage() {
        const { density, maxParticles, threshold } = this.options;
        const w = this.canvas.width;
        const h = this.canvas.height;
        if (!w || !h) return;

        const off = document.createElement('canvas');
        const offCtx = off.getContext('2d', { willReadFrequently: true });
        off.width = w;
        off.height = h;

        // Fit image into canvas with "contain", centered
        const imgW = this.image.naturalWidth || this.image.width;
        const imgH = this.image.naturalHeight || this.image.height;
        if (!imgW || !imgH) return;

        const scale = Math.min(w / imgW, h / imgH) * 0.92;
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const dx = (w - drawW) / 2;
        const dy = (h - drawH) / 2;

        offCtx.clearRect(0, 0, w, h);
        offCtx.drawImage(this.image, dx, dy, drawW, drawH);

        const imgData = offCtx.getImageData(0, 0, w, h).data;

        const pts = [];
        for (let y = 0; y < h; y += density) {
            for (let x = 0; x < w; x += density) {
                const i = (y * w + x) * 4;
                const r = imgData[i];
                const g = imgData[i + 1];
                const b = imgData[i + 2];
                const a = imgData[i + 3];

                // Use alpha + luminance to decide "occupied" pixels.
                // We want silhouette; works for transparent PNGs or high contrast.
                const lum = (r * 0.2126 + g * 0.7152 + b * 0.0722);
                const occupied = a > threshold && lum < 245; // treat very white as empty
                if (occupied) {
                    pts.push({ x, y });
                }
            }
        }

        // Downsample if too many
        if (pts.length > maxParticles) {
            const stride = Math.ceil(pts.length / maxParticles);
            const filtered = [];
            for (let i = 0; i < pts.length; i += stride) filtered.push(pts[i]);
            this.particles = filtered.map((p) => this.makeParticle(p.x, p.y));
        } else {
            this.particles = pts.map((p) => this.makeParticle(p.x, p.y));
        }
    }

    makeParticle(x, y) {
        const color = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
        const j = this.options.jitter;
        return {
            x: x + (Math.random() - 0.5) * j,
            y: y + (Math.random() - 0.5) * j,
            vx: 0,
            vy: 0,
            ox: x,
            oy: y,
            size: this.options.pointSize * (0.85 + Math.random() * 0.5),
            color,
        };
    }

    step() {
        const {
            returnForce,
            friction,
        } = this.options;

        // Disable mouse interaction - always keep hasMouse as false
        const hasMouse = false;

        for (const p of this.particles) {
            // Pull back to origin for stability
            const dx0 = p.ox - p.x;
            const dy0 = p.oy - p.y;
            p.vx += dx0 * returnForce;
            p.vy += dy0 * returnForce;

            // Skip mouse repulsion - keep particles static
            if (false) {
                const mx = this.mouse.x;
                const my = this.mouse.y;
                if (hasMouse) {
                    const dx = p.x - mx;
                    const dy = p.y - my;
                    const d2 = dx * dx + dy * dy;
                    const r2 = this.options.repelRadius * this.options.repelRadius;
                    if (d2 < r2 && d2 > 0.0001) {
                        const d = Math.sqrt(d2);
                        const f = (1 - d / this.options.repelRadius) * this.options.repelStrength;
                        p.vx += (dx / d) * f;
                        p.vy += (dy / d) * f;
                    }
                }
            }

            p.vx *= friction;
            p.vy *= friction;
            p.x += p.vx;
            p.y += p.vy;
        }
    }

    draw() {
        const { backgroundFade, lineMaxDist, lineOpacity } = this.options;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Transparent fade for trailing effect
        ctx.fillStyle = `rgba(0, 0, 0, ${backgroundFade})`;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';

        // Lines (only check near neighbors via coarse grid for perf)
        const cell = Math.max(18, Math.floor(lineMaxDist));
        const grid = new Map();
        const key = (cx, cy) => `${cx},${cy}`;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const cx = Math.floor(p.x / cell);
            const cy = Math.floor(p.y / cell);
            const k = key(cx, cy);
            const arr = grid.get(k) || [];
            arr.push(i);
            grid.set(k, arr);
        }

        ctx.lineWidth = 0.5;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const cx = Math.floor(p.x / cell);
            const cy = Math.floor(p.y / cell);

            for (let gx = cx - 1; gx <= cx + 1; gx++) {
                for (let gy = cy - 1; gy <= cy + 1; gy++) {
                    const arr = grid.get(key(gx, gy));
                    if (!arr) continue;
                    for (const j of arr) {
                        if (j <= i) continue;
                        const q = this.particles[j];
                        const dx = p.x - q.x;
                        const dy = p.y - q.y;
                        const d2 = dx * dx + dy * dy;
                        const max2 = lineMaxDist * lineMaxDist;
                        if (d2 < max2) {
                            const d = Math.sqrt(d2);
                            const a = (1 - d / lineMaxDist) * lineOpacity;
                            ctx.strokeStyle = `rgba(255, 192, 217, ${a})`;
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(q.x, q.y);
                            ctx.stroke();
                        }
                    }
                }
            }
        }

        // Dots
        for (const p of this.particles) {
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    animate() {
        if (this._raf) cancelAnimationFrame(this._raf);
        const loop = () => {
            this.step();
            this.draw();
            this._raf = requestAnimationFrame(loop);
        };
        this._raf = requestAnimationFrame(loop);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('portrait-canvas');
    if (!canvas) return;

    const pp = new PortraitParticles(canvas, {
        // Tweaks for your theme; can be adjusted later
        density: 7,
        maxParticles: 1500,
        pointSize: 1.25,
        lineMaxDist: 20,
        lineOpacity: 0.08,
    });
    pp.start();
});

