/**
 * Antigravity-style Particles Animation
 * Floating particles with mouse interaction and smooth drift
 */

class ParticlesAnimation {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 110 };
        this.particleCount = 45;
        this.animationFrame = null;
        this.colors = [
            'rgba(226, 214, 196, 0.28)',
            'rgba(195, 185, 170, 0.25)',
            'rgba(166, 158, 145, 0.22)',
            'rgba(148, 142, 132, 0.2)',
            'rgba(210, 200, 186, 0.24)',
        ];

        this.init();
    }

    init() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particles-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        document.body.prepend(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // Event listeners
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        // Create particles
        this.createParticles();

        // Start animation
        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Adjust particle count based on screen size
        const area = window.innerWidth * window.innerHeight;
        this.particleCount = Math.min(70, Math.max(25, Math.floor(area / 18000)));

        // Recreate particles on resize
        if (this.particles.length > 0) {
            this.createParticles();
        }
    }

    handleMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    createParticles() {
        this.particles = [];

        for (let i = 0; i < this.particleCount; i++) {
            const size = Math.random() * 1.1 + 0.4;
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const speedX = (Math.random() - 0.5) * 0.18;
            const speedY = (Math.random() - 0.5) * 0.18;
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            const baseOpacity = Math.random() * 0.2 + 0.08;

            this.particles.push({
                x,
                y,
                size,
                baseSize: size,
                speedX,
                speedY,
                color,
                baseOpacity,
                opacity: baseOpacity,
                pulse: Math.random() * Math.PI * 2, // Random pulse phase
                pulseSpeed: Math.random() * 0.02 + 0.005,
                originalX: x,
                originalY: y,
            });
        }
    }

    drawParticle(particle) {
        this.ctx.beginPath();

        // Create gradient for glow effect
        const gradient = this.ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 2
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');

        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = particle.size * 2.2;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    connectParticles() {
        const maxDistance = 90;

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    const opacity = (1 - distance / maxDistance) * 0.04;
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(178, 170, 156, ${opacity})`;
                    this.ctx.lineWidth = 0.3;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    updateParticle(particle) {
        // Pulse effect
        particle.pulse += particle.pulseSpeed;
        const pulseFactor = 0.3 + Math.sin(particle.pulse) * 0.2;
        particle.size = particle.baseSize * (1 + pulseFactor * 0.3);

        // Normal movement
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Mouse interaction - repel particles
        if (this.mouse.x !== null && this.mouse.y !== null) {
            const dx = particle.x - this.mouse.x;
            const dy = particle.y - this.mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.mouse.radius) {
                const force = (this.mouse.radius - distance) / this.mouse.radius;
                const angle = Math.atan2(dy, dx);
                const pushX = Math.cos(angle) * force * 2;
                const pushY = Math.sin(angle) * force * 2;

                particle.x += pushX;
                particle.y += pushY;

                // Increase opacity when near mouse
                particle.opacity = Math.min(1, particle.baseOpacity + force * 0.5);
            } else {
                // Slowly return to base opacity
                particle.opacity += (particle.baseOpacity - particle.opacity) * 0.05;
            }
        }

        // Wrap around edges with smooth transition
        const margin = 50;
        if (particle.x < -margin) particle.x = this.canvas.width + margin;
        if (particle.x > this.canvas.width + margin) particle.x = -margin;
        if (particle.y < -margin) particle.y = this.canvas.height + margin;
        if (particle.y > this.canvas.height + margin) particle.y = -margin;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections first (behind particles)
        this.connectParticles();

        // Update and draw particles
        this.particles.forEach(particle => {
            this.updateParticle(particle);
            this.drawParticle(particle);
        });

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize particles when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ParticlesAnimation();
});
