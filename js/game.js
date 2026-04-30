/**
 * Main game logic and state management
 */

class Game {
  constructor() {
    // Expose game instance globally
    window.gameInstance = this;
    
    // Get the canvas and context
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Set up game state
    this.state = 'start'; // start, playing, gameover, won
    this.mazeCellSize = 40;
    this.lastTime = 0;
    this.kills = 0;
    this.timeElapsed = 0;
    this.timeLimit = 180; // 3 minutes in seconds
    
    // Initialize handlers and managers
    this.inputHandler = new InputHandler();
    this.ui = new UI();
    this.particleSystem = new ParticleSystem();
    
    // Initialize size
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    
    // Añadir manejador de teclas para debug
    this.keys = {};
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      if (e.key === 't' || e.key === 'T') {
        this.enemyManager.toggleDebugMode();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
    
    // Start game loop
    this.loop(0);
  }
  
  resize() {
    const container = document.getElementById('game-container');
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    
    // Regenerate maze if dimensions change significantly
    if (this.maze) {
      const oldWidth = this.maze.width;
      const oldHeight = this.maze.height;
      const newWidth = Math.floor(this.canvas.width / this.mazeCellSize);
      const newHeight = Math.floor(this.canvas.height / this.mazeCellSize);
      
      if (Math.abs(oldWidth - newWidth) > 3 || Math.abs(oldHeight - newHeight) > 3) {
        this.initializeLevel();
      }
    }
  }
  
  initializeLevel() {
    // Calculate maze dimensions based on canvas size
    const mazeWidth = Math.max(15, Math.floor(this.canvas.width / this.mazeCellSize));
    const mazeHeight = Math.max(15, Math.floor(this.canvas.height / this.mazeCellSize));
    
    // Create maze
    this.maze = new Maze(mazeWidth, mazeHeight, this.mazeCellSize);
    
    // Create collision manager
    this.collisionManager = new CollisionManager(this.maze);
    
    // Get start position
    const startPos = this.maze.getStartPosition();
    
    // Create player at start position
    this.player = new Player(startPos.x, startPos.y);
    
    // Create projectile manager
    this.projectileManager = new ProjectileManager();
    
    // Create enemy manager
    this.enemyManager = new EnemyManager(this.maze);
    
    // Reset game state
    this.kills = 0;
    this.timeElapsed = 0;
    
    // Update UI
    this.ui.updateKills(this.kills);
    this.ui.updateLives(this.player.lives);
    this.ui.updateTimer(this.timeLimit - this.timeElapsed);
  }
  
  start() {
    this.initializeLevel();
    this.state = 'playing';
    this.ui.hideMessage();
    this.ui.hideSummary();
  }
  
  reset() {
    this.initializeLevel();
    this.ui.reset();
    this.enemyManager.reset();
    this.projectileManager.reset();
    this.inputHandler.reset();
    this.state = 'start';
    this.ui.showStartScreen();
  }
  
  // Main game loop
  loop(timestamp) {
    // Calculate delta time
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update and render based on game state
    if (this.state === 'start') {
      this.updateStartScreen(deltaTime);
    } else if (this.state === 'playing') {
      this.updateGame(deltaTime, timestamp);
    } else if (this.state === 'gameover' || this.state === 'won') {
      this.updateGameOver(deltaTime);
    }
    
    // Continue the loop
    requestAnimationFrame(this.loop.bind(this));
  }
  
  updateStartScreen(deltaTime) {
    // If maze isn't created yet, initialize the level
    if (!this.maze) {
      this.initializeLevel();
      this.ui.showStartScreen();
    }
    
    // Render game world
    this.renderGameWorld();
    
    // Simulate game for demo
    this.demoUpdate(deltaTime);
    
    // Check for enter key to start game
    if (this.inputHandler.isEnterPressed()) {
      this.start();
    }
  }
  
  demoUpdate(deltaTime) {
    // Simple AI movement for demo
    if (!this.demoTarget || distance(this.player.x, this.player.y, this.demoTarget.x, this.demoTarget.y) < 50) {
      // Get a new random target
      this.demoTarget = this.maze.getRandomEmptyPosition(this.player.x, this.player.y, 150);
    }
    
    if (this.demoTarget) {
      // Move towards target
      const angle = angleBetween(this.player.x, this.player.y, this.demoTarget.x, this.demoTarget.y);
      const moveX = Math.cos(angle) * this.player.speed * 0.5 * deltaTime;
      const moveY = Math.sin(angle) * this.player.speed * 0.5 * deltaTime;
      
      // Try to move
      let newX = this.player.x + moveX;
      let newY = this.player.y + moveY;
      
      // Check for wall collisions
      const resolved = this.collisionManager.resolveWallCollision(this.player, newX, newY, this.player.radius);
      this.player.x = resolved.x;
      this.player.y = resolved.y;
      
      // Update player angle
      this.player.angle = angle;
    }
    
    // Update demo enemies
    if (!this.demoEnemies) {
      this.demoEnemies = [];
      
      // Spawn 3 demo enemies
      for (let i = 0; i < 3; i++) {
        const pos = this.maze.getRandomEmptyPosition(this.player.x, this.player.y, 200);
        if (pos) {
          this.demoEnemies.push(new Enemy(pos.x, pos.y, this.maze));
        }
      }
    }
    
    // Update demo enemies
    for (const enemy of this.demoEnemies) {
      enemy.update(deltaTime, this.player.x, this.player.y, this.collisionManager);
    }
  }
  
  updateGame(deltaTime, timestamp) {
    // Update timer
    this.timeElapsed += deltaTime;
    this.ui.updateTimer(this.timeLimit - this.timeElapsed);
    
    // Check for time limit
    if (this.timeElapsed >= this.timeLimit) {
      this.endGame(false, 'Time\'s up!');
      return;
    }
    
    // Update player
    this.player.update(deltaTime, this.inputHandler, this.collisionManager);
    
    // Update projectiles and handle enemy deaths
    const newKills = this.projectileManager.update(
      deltaTime, timestamp, this.player, this.inputHandler, 
      this.collisionManager, this.enemyManager.enemies
    );
    
    // Track kills and create particle effects
    if (newKills > 0) {
      this.kills += newKills;
      this.ui.updateKills(this.kills);
      
      // Create explosion effect for each killed enemy
      for (const enemy of this.enemyManager.enemies) {
        if (!enemy.active) {
          const enemyColor = getComputedStyle(document.documentElement).getPropertyValue('--enemy-color');
          this.particleSystem.createExplosion(enemy.x, enemy.y, enemyColor);
        }
      }
    }
    
    // Update enemies
    this.enemyManager.update(deltaTime, timestamp, this.player, this.collisionManager);
    
    // Update particle system
    this.particleSystem.update();
    
    // Check for player-enemy collisions
    if (this.collisionManager.checkPlayerEnemyCollision(this.player, this.enemyManager.enemies)) {
      if (this.player.takeDamage()) {
        this.ui.updateLives(this.player.lives);
        
        // Check if player is dead
        if (!this.player.isAlive()) {
          this.endGame(false, 'You died!');
          return;
        }
      }
    }
    
    // Check if player reached the exit
    if (this.collisionManager.checkExitCollision(this.player.x, this.player.y, this.player.radius)) {
      this.endGame(true);
      return;
    }
    
    // Render game world
    this.renderGameWorld();
  }
  
  updateGameOver(deltaTime) {
    // Render game world
    this.renderGameWorld();
    
    // Check for enter key to restart
    if (this.inputHandler.isEnterPressed()) {
      this.reset();
    }
  }
  
  renderGameWorld() {
    // Calculate view radius (what the player can see)
    const viewRadius = Math.min(this.canvas.width, this.canvas.height) * 0.4;
    
    // Center the view on the player
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Calculate camera offset
    const cameraOffsetX = centerX - this.player.x;
    const cameraOffsetY = centerY - this.player.y;
    
    // Save context state
    this.ctx.save();
    
    // Apply camera transformation
    this.ctx.translate(cameraOffsetX, cameraOffsetY);
    
    // Draw maze
    this.maze.draw(this.ctx, this.player.x, this.player.y, this.canvas.width, this.canvas.height, viewRadius);
    
    // Draw projectiles
    this.projectileManager.draw(this.ctx);
    
    // Draw enemies
    if (this.state === 'start') {
      // In start screen, draw demo enemies
      if (this.demoEnemies) {
        for (const enemy of this.demoEnemies) {
          enemy.draw(this.ctx);
        }
      }
    } else {
      // In game, draw actual enemies
      this.enemyManager.draw(this.ctx);
    }
    
    // Draw player
    this.player.draw(this.ctx);
    
    // Draw field of vision boundary
    this.ctx.globalCompositeOperation = 'destination-in';
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y, viewRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalCompositeOperation = 'source-over';
    
    // Draw field of vision border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y, viewRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Draw particles
    this.particleSystem.draw(this.ctx);
    
    // Restore context state
    this.ctx.restore();
  }
  
  endGame(success, reason = '') {
    if (success) {
      this.state = 'won';
      this.ui.showGameWonScreen();
    } else {
      this.state = 'gameover';
      this.ui.showGameOverScreen(reason);
    }
    
    // Show game summary
    this.ui.showSummary(this.timeElapsed, this.kills, success);
  }
}