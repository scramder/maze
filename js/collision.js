/**
 * Handles all collision detection in the game
 */

class CollisionManager {
  constructor(maze) {
    this.maze = maze;
  }
  
  // Check if a circle collides with maze walls
  checkWallCollision(x, y, radius) {
    const cellSize = this.maze.cellSize;
    const cells = this.maze.cells;
    
    // Get the cells that could potentially intersect with the circle
    const minCellX = Math.max(0, Math.floor((x - radius) / cellSize));
    const maxCellX = Math.min(this.maze.width - 1, Math.floor((x + radius) / cellSize));
    const minCellY = Math.max(0, Math.floor((y - radius) / cellSize));
    const maxCellY = Math.min(this.maze.height - 1, Math.floor((y + radius) / cellSize));
    
    for (let cy = minCellY; cy <= maxCellY; cy++) {
      for (let cx = minCellX; cx <= maxCellX; cx++) {
        if (cells[cy][cx] === 1) { // Wall cell
          // Check collision with each edge of the wall cell
          const wallX = cx * cellSize;
          const wallY = cy * cellSize;
          
          // Find closest point on the wall to the circle center
          const closestX = Math.max(wallX, Math.min(x, wallX + cellSize));
          const closestY = Math.max(wallY, Math.min(y, wallY + cellSize));
          
          // Calculate distance between the circle center and closest point
          const distX = x - closestX;
          const distY = y - closestY;
          const distSquared = distX * distX + distY * distY;
          
          // Check if the distance is less than the radius
          if (distSquared < radius * radius) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  // Check if a point is at the exit
  checkExitCollision(x, y, radius) {
    const exitX = this.maze.exit.x * this.maze.cellSize + this.maze.cellSize / 2;
    const exitY = this.maze.exit.y * this.maze.cellSize + this.maze.cellSize / 2;
    
    return distance(x, y, exitX, exitY) < radius + this.maze.cellSize / 4;
  }
  
  // Check if a projectile hits a wall
  checkProjectileWallCollision(projectile) {
    return this.checkWallCollision(projectile.x, projectile.y, projectile.radius);
  }
  
  // Check if a projectile hits an enemy
  checkProjectileEnemyCollision(projectile, enemies) {
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      
      // Calculate the triangle points for this enemy
      const angle = enemy.angle;
      const halfSize = enemy.size / 2;
      const tx1 = enemy.x + Math.cos(angle) * enemy.size;
      const ty1 = enemy.y + Math.sin(angle) * enemy.size;
      const tx2 = enemy.x + Math.cos(angle + 2.1) * halfSize;
      const ty2 = enemy.y + Math.sin(angle + 2.1) * halfSize;
      const tx3 = enemy.x + Math.cos(angle + 4.2) * halfSize;
      const ty3 = enemy.y + Math.sin(angle + 4.2) * halfSize;
      
      if (circleTriangleCollision(
        projectile.x, projectile.y, projectile.radius,
        tx1, ty1, tx2, ty2, tx3, ty3
      )) {
        return enemy;
      }
    }
    
    return null;
  }
  
  // Check if player collides with any enemy
  checkPlayerEnemyCollision(player, enemies) {
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      
      // Calculate the triangle points for this enemy
      const angle = enemy.angle;
      const halfSize = enemy.size / 2;
      const tx1 = enemy.x + Math.cos(angle) * enemy.size;
      const ty1 = enemy.y + Math.sin(angle) * enemy.size;
      const tx2 = enemy.x + Math.cos(angle + 2.1) * halfSize;
      const ty2 = enemy.y + Math.sin(angle + 2.1) * halfSize;
      const tx3 = enemy.x + Math.cos(angle + 4.2) * halfSize;
      const ty3 = enemy.y + Math.sin(angle + 4.2) * halfSize;
      
      if (circleTriangleCollision(
        player.x, player.y, player.radius,
        tx1, ty1, tx2, ty2, tx3, ty3
      )) {
        return true;
      }
    }
    
    return false;
  }
  
  // Helper method to resolve wall collisions by adjusting position
  resolveWallCollision(entity, newX, newY, radius) {
    const cellSize = this.maze.cellSize;
    const cells = this.maze.cells;
    
    // Get the cells that could potentially intersect with the entity
    const minCellX = Math.max(0, Math.floor((newX - radius) / cellSize));
    const maxCellX = Math.min(this.maze.width - 1, Math.floor((newX + radius) / cellSize));
    const minCellY = Math.max(0, Math.floor((newY - radius) / cellSize));
    const maxCellY = Math.min(this.maze.height - 1, Math.floor((newY + radius) / cellSize));
    
    let adjustedX = newX;
    let adjustedY = newY;
    let collided = false;
    
    for (let cy = minCellY; cy <= maxCellY; cy++) {
      for (let cx = minCellX; cx <= maxCellX; cx++) {
        if (cells[cy][cx] === 1) { // Wall cell
          // Wall boundaries
          const wallLeft = cx * cellSize;
          const wallRight = (cx + 1) * cellSize;
          const wallTop = cy * cellSize;
          const wallBottom = (cy + 1) * cellSize;
          
          // Find closest point on the wall to the entity center
          const closestX = Math.max(wallLeft, Math.min(newX, wallRight));
          const closestY = Math.max(wallTop, Math.min(newY, wallBottom));
          
          // Calculate distance and direction
          const distX = newX - closestX;
          const distY = newY - closestY;
          const dist = Math.sqrt(distX * distX + distY * distY);
          
          if (dist < radius) {
            collided = true;
            // Push the entity away from the wall
            if (dist > 0) {
              const pushX = distX / dist * (radius - dist);
              const pushY = distY / dist * (radius - dist);
              adjustedX += pushX;
              adjustedY += pushY;
            } else {
              // If exactly at wall corner, push diagonally
              if (newX < wallLeft + cellSize / 2) adjustedX = wallLeft - radius;
              else adjustedX = wallRight + radius;
              if (newY < wallTop + cellSize / 2) adjustedY = wallTop - radius;
              else adjustedY = wallBottom + radius;
            }
          }
        }
      }
    }
    
    return { x: adjustedX, y: adjustedY, collided };
  }
}