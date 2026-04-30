/**
 * Represents the player character
 */

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.speed = 200; // pixels per second
    this.angle = 0; // facing angle
    this.lives = 3;
    this.maxLives = 3;
    this.invulnerable = false;
    this.invulnerabilityTime = 1.5; // seconds
    this.invulnerabilityTimer = 0;
    this.blinkInterval = 0.1; // seconds
    this.visible = true;
  }
  
  update(deltaTime, inputHandler, collisionManager) {
    // Update invulnerability
    if (this.invulnerable) {
      this.invulnerabilityTimer -= deltaTime;
      
      // Blink effect
      this.visible = Math.floor(this.invulnerabilityTimer / this.blinkInterval) % 2 === 0;
      
      if (this.invulnerabilityTimer <= 0) {
        this.invulnerable = false;
        this.visible = true;
      }
    }
    
    // Get movement direction from input
    const direction = inputHandler.getMovementDirection();
    
    // Calculate new position
    let newX = this.x + direction.x * this.speed * deltaTime;
    let newY = this.y + direction.y * this.speed * deltaTime;
    
    // Resolve collisions with walls
    const resolved = collisionManager.resolveWallCollision(this, newX, newY, this.radius);
    this.x = resolved.x;
    this.y = resolved.y;
    
    // Update angle to face mouse
    const mousePos = inputHandler.getMousePosition();
    this.angle = angleBetween(this.x, this.y, mousePos.x, mousePos.y);
  }
  
  draw(ctx) {
    if (!this.visible) return;
    
    const playerColor = getComputedStyle(document.documentElement).getPropertyValue('--player-color');
    
    // Draw player circle
    ctx.fillStyle = playerColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw direction indicator (small line pointing in facing direction)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(
      this.x + Math.cos(this.angle) * (this.radius + 5),
      this.y + Math.sin(this.angle) * (this.radius + 5)
    );
    ctx.stroke();
  }
  
  takeDamage() {
    if (this.invulnerable) return false;
    
    this.lives--;
    
    if (this.lives > 0) {
      // Make player invulnerable temporarily
      this.invulnerable = true;
      this.invulnerabilityTimer = this.invulnerabilityTime;
    }
    
    return true;
  }
  
  isAlive() {
    return this.lives > 0;
  }
  
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.lives = this.maxLives;
    this.invulnerable = false;
    this.invulnerabilityTimer = 0;
    this.visible = true;
  }
}