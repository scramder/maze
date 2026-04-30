class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 3 + 2;
    this.speedX = (Math.random() - 0.5) * 8;
    this.speedY = (Math.random() - 0.5) * 8;
    this.life = 1; // Vida de la partícula (1 = 100%)
    this.decay = 0.02; // Velocidad de desvanecimiento
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= this.decay;
    this.size *= 0.95;
  }

  draw(ctx) {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  createExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const particle of this.particles) {
      particle.draw(ctx);
    }
  }
} 