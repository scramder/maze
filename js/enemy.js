/**
 * Manages enemies that chase the player
 */

class Enemy {
  constructor(x, y, maze) {
    this.x = x;
    this.y = y;
    this.size = 20; // Size of the triangle
    this.baseSpeed = 100; // Velocidad base
    this.chaseSpeed = 300; // Velocidad cuando persigue (aumentada a 300)
    this.speed = this.baseSpeed;
    this.angle = 0; // direction the enemy is facing
    this.active = true;
    this.maze = maze;
    this.pathfinder = new PathFinder(maze);
    this.path = [];
    this.currentPathIndex = 0;
    this.lastKnownPlayerPos = null;
    this.searchArea = null;
    this.searchPoints = [];
    this.currentSearchPoint = 0;
    this.pathUpdateCooldown = 0;
    this.detectionRadius = 200; // Radio de detección aumentado a 200px
    this.isChasing = false;
    this.canReachPlayer = false;
    this.randomMoveCooldown = 0;
    this.turnSpeed = 50; // Reducido para giros más suaves
    this.targetAngle = 0;
    this.positionTolerance = 5; // Aumentado para mejor seguimiento
    this.acceleration = 500; // Aumentado para aceleración más rápida
    this.currentSpeed = 0; // Velocidad actual para suavizar cambios
    this.searchAreaRadius = 50; // Radio del área de búsqueda
    this.searchPointsCount = 4; // Número de puntos de búsqueda
    this.pathCheckCooldown = 0;
    this.debugMode = false;
    this.hasReachedLastKnownPos = false;
    this.sharedPath = null;
    this.sharedPathOwner = null;
    this.sharedPathTimeout = 0;
    
    // Variables para detectar atascos
    this.lastPosition = { x: this.x, y: this.y };
    this.stuckTime = 0;
    this.stuckThreshold = 1.0; // Segundos antes de considerar que está atascado
    this.stuckDistance = 10; // Distancia mínima para considerar que se movió
  }
  
  update(deltaTime, playerX, playerY, collisionManager) {
    if (!this.active) return;
    
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);
    
    // Actualizar timeout del path compartido
    if (this.sharedPath) {
      this.sharedPathTimeout -= deltaTime;
      if (this.sharedPathTimeout <= 0) {
        this.sharedPath = null;
        this.sharedPathOwner = null;
      }
    }
    
    // Verificar si podemos alcanzar al jugador
    this.pathCheckCooldown -= deltaTime;
    if (this.pathCheckCooldown <= 0) {
      const testPath = this.pathfinder.findPath(this.x, this.y, playerX, playerY);
      this.canReachPlayer = testPath !== null;
      this.pathCheckCooldown = 0.5;
    }
    
    const wasChasing = this.isChasing;
    this.isChasing = distToPlayer < this.detectionRadius && this.canReachPlayer;
    
    // Usar velocidad máxima si está persiguiendo o tiene un camino hacia el jugador
    const targetSpeed = (this.isChasing || this.lastKnownPlayerPos || this.sharedPath) ? this.chaseSpeed : this.baseSpeed;
    
    // Aceleración instantánea cuando persigue
    if (this.isChasing || this.lastKnownPlayerPos || this.sharedPath) {
      this.currentSpeed = this.chaseSpeed;
    } else {
      // Suavizar cambios de velocidad solo cuando no persigue
      if (this.currentSpeed < targetSpeed) {
        this.currentSpeed = Math.min(this.currentSpeed + this.acceleration * deltaTime, targetSpeed);
      } else if (this.currentSpeed > targetSpeed) {
        this.currentSpeed = Math.max(this.currentSpeed - this.acceleration * deltaTime, targetSpeed);
      }
    }
    
    this.pathUpdateCooldown -= deltaTime;
    
    // Detectar si está atascado
    const currentPos = { x: this.x, y: this.y };
    const distanceMoved = Math.sqrt(
      Math.pow(currentPos.x - this.lastPosition.x, 2) + 
      Math.pow(currentPos.y - this.lastPosition.y, 2)
    );
    
    if (distanceMoved < this.stuckDistance) {
      this.stuckTime += deltaTime;
    } else {
      this.stuckTime = 0;
    }
    
    // Resetear si está atascado
    if (this.stuckTime > this.stuckThreshold) {
      this.resetStuckState();
    }
    
    if (this.isChasing) {
      // Si encontramos al jugador, actualizar la última posición conocida
      this.lastKnownPlayerPos = { x: playerX, y: playerY };
      this.searchArea = {
        x: playerX,
        y: playerY,
        radius: this.searchAreaRadius
      };
      this.generateSearchPoints();
      this.hasReachedLastKnownPos = false;
      
      if (this.pathUpdateCooldown <= 0 || this.path.length === 0) {
        this.updatePath(playerX, playerY);
        this.pathUpdateCooldown = 0.5;
        
        // Compartir el path con otros enemigos cercanos
        this.sharePathWithNearbyEnemies();
      }
    } else if (this.sharedPath) {
      // Si tenemos un path compartido, usarlo
      this.path = this.sharedPath;
      this.currentPathIndex = 0;
    } else if (this.lastKnownPlayerPos) {
      // Si no estamos persiguiendo pero tenemos una última posición conocida
      if (this.pathUpdateCooldown <= 0 || this.path.length === 0) {
        if (this.searchPoints.length > 0) {
          const searchPoint = this.searchPoints[this.currentSearchPoint];
          const canReachSearchPoint = this.pathfinder.findPath(this.x, this.y, searchPoint.x, searchPoint.y) !== null;
          
          if (canReachSearchPoint) {
            this.updatePath(searchPoint.x, searchPoint.y);
            this.pathUpdateCooldown = 0.5;
          } else {
            this.currentSearchPoint = (this.currentSearchPoint + 1) % this.searchPoints.length;
            if (this.currentSearchPoint === 0) {
              // Solo resetear si hemos completado la búsqueda y no encontramos al jugador
              this.lastKnownPlayerPos = null;
              this.searchArea = null;
              this.searchPoints = [];
              this.getRandomTarget();
            }
          }
        }
      }
    } else {
      this.randomMoveCooldown -= deltaTime;
      if (this.randomMoveCooldown <= 0) {
        this.getRandomTarget();
        this.randomMoveCooldown = 2;
      }
    }
    
    if (this.path.length > 0) {
      const target = this.path[this.currentPathIndex];
      const targetDx = target.x - this.x;
      const targetDy = target.y - this.y;
      const dist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
      
      if (dist > this.positionTolerance) {
        // Calcular dirección normalizada hacia el objetivo
        const dirX = targetDx / dist;
        const dirY = targetDy / dist;
        
        // Mover directamente hacia el objetivo
        const moveX = dirX * this.currentSpeed * deltaTime;
        const moveY = dirY * this.currentSpeed * deltaTime;
        
        let newX = this.x + moveX;
        let newY = this.y + moveY;
        
        const collisionRadius = this.size / 2.5;
        const resolved = collisionManager.resolveWallCollision(this, newX, newY, collisionRadius);
        this.x = resolved.x;
        this.y = resolved.y;
        
        // Actualizar el ángulo para la visualización
        this.angle = Math.atan2(dirY, dirX);
        
        if (resolved.collided) {
          this.pathUpdateCooldown = 0;
        }
      } else {
        this.currentPathIndex++;
        if (this.currentPathIndex >= this.path.length) {
          if (!this.isChasing && this.lastKnownPlayerPos) {
            // Si llegamos al último punto de búsqueda y no encontramos al jugador
            if (this.currentSearchPoint === this.searchPoints.length - 1) {
              this.lastKnownPlayerPos = null;
              this.searchArea = null;
              this.searchPoints = [];
              this.getRandomTarget();
            } else {
              // Pasar al siguiente punto de búsqueda
              this.currentSearchPoint++;
              this.pathUpdateCooldown = 0;
            }
          }
          
          this.path = [];
          this.currentPathIndex = 0;
        }
      }
    }
    
    // Actualizar posición para la próxima iteración
    this.lastPosition = { x: this.x, y: this.y };
  }
  
  generateSearchPoints() {
    this.searchPoints = [];
    const angleStep = (Math.PI * 2) / this.searchPointsCount;
    
    for (let i = 0; i < this.searchPointsCount; i++) {
      const angle = i * angleStep;
      const x = this.searchArea.x + Math.cos(angle) * this.searchArea.radius;
      const y = this.searchArea.y + Math.sin(angle) * this.searchArea.radius;
      
      // Verificar que el punto esté dentro del laberinto y en una celda válida
      const cellX = Math.floor(x / this.maze.cellSize);
      const cellY = Math.floor(y / this.maze.cellSize);
      
      if (cellX >= 0 && cellX < this.maze.width && 
          cellY >= 0 && cellY < this.maze.height && 
          this.maze.cells[cellY][cellX] === 0) {
        // Verificar si podemos alcanzar este punto
        const canReach = this.pathfinder.findPath(this.x, this.y, x, y) !== null;
        if (canReach) {
          this.searchPoints.push({ x, y });
        }
      }
    }
    
    // Si no se encontraron puntos válidos, verificar si podemos alcanzar el centro
    if (this.searchPoints.length === 0) {
      const canReachCenter = this.pathfinder.findPath(
        this.x, this.y,
        this.searchArea.x, this.searchArea.y
      ) !== null;
      
      if (canReachCenter) {
        this.searchPoints.push({
          x: this.searchArea.x,
          y: this.searchArea.y
        });
      }
    }
    
    this.currentSearchPoint = 0;
  }
  
  updatePath(targetX, targetY) {
    const newPath = this.pathfinder.findPath(this.x, this.y, targetX, targetY);
    if (newPath) {
      this.path = newPath;
      this.currentPathIndex = 0;
    }
  }
  
  draw(ctx) {
    if (!this.active) return;
    
    const enemyColor = getComputedStyle(document.documentElement).getPropertyValue('--enemy-color');
    
    // Dibujar el camino si está en modo debug
    if (this.debugMode && this.path.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      
      // Dibujar línea desde la posición actual hasta el primer punto
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.path[0].x, this.path[0].y);
      
      // Dibujar líneas entre puntos del camino
      for (let i = 0; i < this.path.length - 1; i++) {
        ctx.moveTo(this.path[i].x, this.path[i].y);
        ctx.lineTo(this.path[i + 1].x, this.path[i + 1].y);
      }
      
      ctx.stroke();
      
      // Dibujar puntos del camino
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      for (const point of this.path) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Dibujar punto actual del camino
      if (this.currentPathIndex < this.path.length) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(
          this.path[this.currentPathIndex].x,
          this.path[this.currentPathIndex].y,
          5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      
      // Dibujar área de búsqueda si existe
      if (this.searchArea) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.arc(
          this.searchArea.x,
          this.searchArea.y,
          this.searchArea.radius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        
        // Dibujar puntos de búsqueda
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        for (const point of this.searchPoints) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Dibujar indicador de path compartido
      if (this.sharedPath) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(this.x, this.y);
        if (this.sharedPathOwner) {
          ctx.lineTo(this.sharedPathOwner.x, this.sharedPathOwner.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    
    // Dibujar el enemigo
    ctx.fillStyle = enemyColor;
    
    // Draw a triangle pointing in the direction of movement
    const halfSize = this.size / 2;
    
    ctx.beginPath();
    // Front point
    ctx.moveTo(
      this.x + Math.cos(this.angle) * this.size,
      this.y + Math.sin(this.angle) * this.size
    );
    // Back-right point
    ctx.lineTo(
      this.x + Math.cos(this.angle + 2.1) * halfSize,
      this.y + Math.sin(this.angle + 2.1) * halfSize
    );
    // Back-left point
    ctx.lineTo(
      this.x + Math.cos(this.angle + 4.2) * halfSize,
      this.y + Math.sin(this.angle + 4.2) * halfSize
    );
    ctx.closePath();
    ctx.fill();
    
    // Add a subtle glow effect
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
  
  getRandomTarget() {
    const cellSize = this.maze.cellSize;
    const currentCellX = Math.floor(this.x / cellSize);
    const currentCellY = Math.floor(this.y / cellSize);
    
    // Intentar encontrar una celda vacía aleatoria cercana
    const directions = [
      [0, -1], [1, -1], [1, 0], [1, 1],
      [0, 1], [-1, 1], [-1, 0], [-1, -1]
    ];
    
    // Mezclar direcciones aleatoriamente
    directions.sort(() => Math.random() - 0.5);
    
    for (const [dx, dy] of directions) {
      const nx = currentCellX + dx;
      const ny = currentCellY + dy;
      
      if (nx >= 0 && nx < this.maze.width && 
          ny >= 0 && ny < this.maze.height && 
          this.maze.cells[ny][nx] === 0) {
        this.path[0] = { x: (nx + 0.5) * cellSize, y: (ny + 0.5) * cellSize };
        this.angle = angleBetween(this.x, this.y, this.path[0].x, this.path[0].y);
        return;
      }
    }
  }
  
  resetStuckState() {
    // Solo resetear el estado de atascamiento, mantener la memoria del camino
    this.stuckTime = 0;
    this.pathUpdateCooldown = 0;
    
    // Si está atascado, intentar recalcular el path
    if (this.lastKnownPlayerPos) {
      this.updatePath(this.lastKnownPlayerPos.x, this.lastKnownPlayerPos.y);
    } else {
      this.getRandomTarget();
    }
  }
  
  sharePathWithNearbyEnemies() {
    if (!this.path || this.path.length === 0) return;
    
    const shareRadius = 200; // Radio para compartir el path
    const enemies = window.gameInstance.enemyManager.enemies;
    
    for (const otherEnemy of enemies) {
      if (otherEnemy === this) continue;
      
      const dx = otherEnemy.x - this.x;
      const dy = otherEnemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < shareRadius) {
        // Verificar si el otro enemigo puede usar este path
        const canUsePath = this.pathfinder.findPath(
          otherEnemy.x, otherEnemy.y,
          this.path[this.path.length - 1].x,
          this.path[this.path.length - 1].y
        ) !== null;
        
        if (canUsePath) {
          otherEnemy.sharedPath = [...this.path];
          otherEnemy.sharedPathOwner = this;
          otherEnemy.sharedPathTimeout = 2.0; // El path compartido dura 2 segundos
        }
      }
    }
  }
}

class EnemyManager {
  constructor(maze) {
    this.enemies = [];
    this.maze = maze;
    this.spawnInterval = 3; // Seconds between enemy spawns
    this.lastSpawnTime = 0;
    this.maxEnemies = 10; // Maximum number of enemies at once
    this.debugMode = false;
  }
  
  update(deltaTime, currentTime, player, collisionManager) {
    // Spawn new enemies
    if (currentTime - this.lastSpawnTime >= this.spawnInterval * 1000 &&
        this.enemies.filter(e => e.active).length < this.maxEnemies) {
      this.spawnEnemy(player.x, player.y);
      this.lastSpawnTime = currentTime;
    }
    
    // Update existing enemies
    for (const enemy of this.enemies) {
      enemy.update(deltaTime, player.x, player.y, collisionManager);
    }
    
    // Remove inactive enemies
    this.enemies = this.enemies.filter(enemy => enemy.active);
  }
  
  spawnEnemy(playerX, playerY) {
    // Find a position away from the player
    const minDistance = 300; // Minimum distance from player to spawn
    const position = this.maze.getRandomEmptyPosition(playerX, playerY, minDistance);
    
    if (position) {
      const enemy = new Enemy(position.x, position.y, this.maze);
      this.enemies.push(enemy);
    }
  }
  
  draw(ctx) {
    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }
  }
  
  reset() {
    this.enemies = [];
    this.lastSpawnTime = 0;
  }
  
  getCount() {
    return this.enemies.filter(e => e.active).length;
  }
  
  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    for (const enemy of this.enemies) {
      enemy.debugMode = this.debugMode;
    }
  }
}