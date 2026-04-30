/**
 * Manages projectiles fired by the player
 */

class Projectile {
  constructor(x, y, angle, speed) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.radius = 4;
    this.active = true;
    this.maxDistance = 500; // Maximum travel distance
    this.distanceTraveled = 0;
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;
  }
  
  update(deltaTime) {
    // Move the projectile
    const moveDistance = this.speed * deltaTime;
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
    
    // Track distance traveled
    this.distanceTraveled += moveDistance;
    
    // Deactivate if traveled too far
    if (this.distanceTraveled >= this.maxDistance) {
      this.active = false;
    }
  }
  
  draw(ctx) {
    const projectileColor = getComputedStyle(document.documentElement).getPropertyValue('--projectile-color');
    
    ctx.fillStyle = projectileColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a subtle glow effect
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

class ProjectileManager {
  constructor() {
    this.projectiles = [];
    this.fireRate = 0.25; // Time in seconds between shots
    this.lastFired = 0;
  }
  
  update(deltaTime, currentTime, player, inputHandler, collisionManager, enemies) {
    // Handle firing new projectiles
    if (inputHandler.isShooting() && currentTime - this.lastFired >= this.fireRate * 1000) {
      this.fire(player, inputHandler.getMousePosition());
      this.lastFired = currentTime;
    }
    
    // Update existing projectiles
    let enemiesHit = 0;
    
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update(deltaTime);
      
      // Check for wall collisions
      if (collisionManager.checkProjectileWallCollision(projectile)) {
        projectile.active = false;
      }
      
      // Check for enemy collisions
      const hitEnemy = collisionManager.checkProjectileEnemyCollision(projectile, enemies);
      if (hitEnemy) {
        projectile.active = false;
        hitEnemy.active = false;
        enemiesHit++;
      }
      
      // Remove inactive projectiles
      if (!projectile.active) {
        this.projectiles.splice(i, 1);
      }
    }
    
    return enemiesHit;
  }
  
  fire(player, targetPos) {
    // Calculate angle to target
    const angle = angleBetween(player.x, player.y, targetPos.x, targetPos.y);
    
    // Create new projectile at player position
    const projectile = new Projectile(
      player.x,
      player.y,
      angle,
      400 // Projectile speed
    );
    
    this.projectiles.push(projectile);
  }
  
  draw(ctx) {
    for (const projectile of this.projectiles) {
      projectile.draw(ctx);
    }
  }
  
  reset() {
    this.projectiles = [];
    this.lastFired = 0;
  }
}