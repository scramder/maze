/**
 * Handles all input from the player
 */

class InputHandler {
  constructor() {
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      enter: false
    };
    
    this.mouse = {
      x: 0,
      y: 0,
      pressed: false
    };
    
    // Add keyboard event listeners
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Add mouse event listeners
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Touch events for mobile
    window.addEventListener('touchstart', this.handleTouchStart.bind(this));
    window.addEventListener('touchmove', this.handleTouchMove.bind(this));
    window.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }
  
  handleKeyDown(event) {
    switch(event.key.toLowerCase()) {
      case 'w':
        this.keys.w = true;
        break;
      case 'a':
        this.keys.a = true;
        break;
      case 's':
        this.keys.s = true;
        break;
      case 'd':
        this.keys.d = true;
        break;
      case 'enter':
        this.keys.enter = true;
        break;
    }
  }
  
  handleKeyUp(event) {
    switch(event.key.toLowerCase()) {
      case 'w':
        this.keys.w = false;
        break;
      case 'a':
        this.keys.a = false;
        break;
      case 's':
        this.keys.s = false;
        break;
      case 'd':
        this.keys.d = false;
        break;
      case 'enter':
        this.keys.enter = false;
        break;
    }
  }
  
  handleMouseMove(event) {
    // Get position relative to canvas
    const canvas = document.getElementById('game-canvas');
    const rect = canvas.getBoundingClientRect();
    
    // Get mouse position in viewport coordinates
    const viewportX = event.clientX - rect.left;
    const viewportY = event.clientY - rect.top;
    
    // Convert to world coordinates
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Get player position from game instance
    const game = window.gameInstance; // We'll need to set this in the Game constructor
    if (game && game.player) {
      // Calculate world position by reversing the camera transformation
      this.mouse.x = viewportX - centerX + game.player.x;
      this.mouse.y = viewportY - centerY + game.player.y;
    } else {
      // Fallback to viewport coordinates if game instance is not available
      this.mouse.x = viewportX;
      this.mouse.y = viewportY;
    }
  }
  
  handleMouseDown(event) {
    if (event.button === 0) { // Left mouse button
      this.mouse.pressed = true;
    }
  }
  
  handleMouseUp(event) {
    if (event.button === 0) { // Left mouse button
      this.mouse.pressed = false;
    }
  }
  
  handleTouchStart(event) {
    event.preventDefault();
    
    if (event.touches.length > 0) {
      const canvas = document.getElementById('game-canvas');
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = event.touches[0].clientX - rect.left;
      this.mouse.y = event.touches[0].clientY - rect.top;
      this.mouse.pressed = true;
    }
  }
  
  handleTouchMove(event) {
    event.preventDefault();
    
    if (event.touches.length > 0) {
      const canvas = document.getElementById('game-canvas');
      const rect = canvas.getBoundingClientRect();
      
      // Get touch position in viewport coordinates
      const viewportX = event.touches[0].clientX - rect.left;
      const viewportY = event.touches[0].clientY - rect.top;
      
      // Convert to world coordinates
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Get player position from game instance
      const game = window.gameInstance;
      if (game && game.player) {
        // Calculate world position by reversing the camera transformation
        this.mouse.x = viewportX - centerX + game.player.x;
        this.mouse.y = viewportY - centerY + game.player.y;
      } else {
        // Fallback to viewport coordinates if game instance is not available
        this.mouse.x = viewportX;
        this.mouse.y = viewportY;
      }
    }
  }
  
  handleTouchEnd(event) {
    event.preventDefault();
    this.mouse.pressed = false;
  }
  
  // Get the direction the player should move based on key inputs
  getMovementDirection() {
    let dx = 0;
    let dy = 0;
    
    if (this.keys.w) dy -= 1;
    if (this.keys.s) dy += 1;
    if (this.keys.a) dx -= 1;
    if (this.keys.d) dx += 1;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const normalized = normalizeVector(dx, dy);
      dx = normalized.x;
      dy = normalized.y;
    }
    
    return { x: dx, y: dy };
  }
  
  isEnterPressed() {
    return this.keys.enter;
  }
  
  isShooting() {
    return this.mouse.pressed;
  }
  
  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  }
  
  // Reset all input states
  reset() {
    this.keys.w = false;
    this.keys.a = false;
    this.keys.s = false;
    this.keys.d = false;
    this.keys.enter = false;
    this.mouse.pressed = false;
  }
}