/**
 * Generates and manages the maze
 */

class Maze {
  constructor(width, height, cellSize) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cells = [];
    this.start = { x: 0, y: 0 };
    this.exit = { x: 0, y: 0 };
    this.generate();
  }
  
  // Generate a new maze using recursive backtracking algorithm
  generate() {
    // Initialize all cells as walls
    this.cells = Array(this.height).fill().map(() => Array(this.width).fill(1));
    
    // Start from a random cell
    const startX = randomInt(0, Math.floor(this.width / 2) - 1) * 2 + 1;
    const startY = randomInt(0, Math.floor(this.height / 2) - 1) * 2 + 1;
    
    // Set start cell as path
    this.cells[startY][startX] = 0;
    
    // Carve paths through the maze using recursive backtracking
    this.carvePassages(startX, startY);
    
    // Set start and exit points (far from each other)
    this.setStartAndExit();
  }
  
  // Recursive backtracking to carve passages
  carvePassages(x, y) {
    // Define directions: [dx, dy]
    const directions = [
      [0, -2], // Up
      [2, 0],  // Right
      [0, 2],  // Down
      [-2, 0]  // Left
    ];
    
    // Shuffle directions for randomness
    directions.sort(() => Math.random() - 0.5);
    
    // Try each direction
    for (let [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      // Check if the new position is valid and still a wall
      if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1 && this.cells[ny][nx] === 1) {
        // Carve a path
        this.cells[y + dy/2][x + dx/2] = 0; // Remove wall between cells
        this.cells[ny][nx] = 0; // Mark new cell as path
        
        // Continue recursively
        this.carvePassages(nx, ny);
      }
    }
  }
  
  // Set start and exit points that are far from each other
  setStartAndExit() {
    // Find all valid path cells
    const pathCells = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y][x] === 0) {
          pathCells.push({ x, y });
        }
      }
    }
    
    // If no path cells, generate again
    if (pathCells.length === 0) {
      this.generate();
      return;
    }
    
    // Start from a random cell near the top left
    const topLeftCells = pathCells.filter(cell => 
      cell.x < this.width / 3 && cell.y < this.height / 3);
    
    this.start = topLeftCells.length > 0 ? 
      topLeftCells[randomInt(0, topLeftCells.length - 1)] : 
      pathCells[randomInt(0, pathCells.length - 1)];
    
    // Find the farthest cell from start for exit
    let maxDist = 0;
    let farthestCell = null;
    
    for (const cell of pathCells) {
      const dist = Math.abs(cell.x - this.start.x) + Math.abs(cell.y - this.start.y); // Manhattan distance
      
      if (dist > maxDist) {
        maxDist = dist;
        farthestCell = cell;
      }
    }
    
    this.exit = farthestCell || pathCells[randomInt(0, pathCells.length - 1)];
    
    // Ensure a minimum distance between start and exit
    const minDistance = Math.max(this.width, this.height) / 2;
    if (maxDist < minDistance && pathCells.length > 10) {
      this.setStartAndExit(); // Try again if too close
    }
  }
  
  // Draw the maze
  draw(ctx, playerX, playerY, canvasWidth, canvasHeight, viewRadius) {
    const wallColor = getComputedStyle(document.documentElement).getPropertyValue('--maze-wall-color');
    const pathColor = getComputedStyle(document.documentElement).getPropertyValue('--maze-path-color');
    const startColor = getComputedStyle(document.documentElement).getPropertyValue('--start-color');
    const exitColor = getComputedStyle(document.documentElement).getPropertyValue('--exit-color');
    
    // Calculate visible area
    const visibleMinX = Math.max(0, Math.floor((playerX - viewRadius) / this.cellSize));
    const visibleMaxX = Math.min(this.width - 1, Math.ceil((playerX + viewRadius) / this.cellSize));
    const visibleMinY = Math.max(0, Math.floor((playerY - viewRadius) / this.cellSize));
    const visibleMaxY = Math.min(this.height - 1, Math.ceil((playerY + viewRadius) / this.cellSize));
    
    // Draw visible cells
    for (let y = visibleMinY; y <= visibleMaxY; y++) {
      for (let x = visibleMinX; x <= visibleMaxX; x++) {
        const cellX = x * this.cellSize;
        const cellY = y * this.cellSize;
        
        // Skip if out of view radius
        const cellCenterX = cellX + this.cellSize / 2;
        const cellCenterY = cellY + this.cellSize / 2;
        const dist = distance(playerX, playerY, cellCenterX, cellCenterY);
        if (dist > viewRadius) continue;
        
        // Draw cell based on type
        if (this.cells[y][x] === 1) {
          // Wall
          ctx.fillStyle = wallColor;
          ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
        } else {
          // Path
          ctx.fillStyle = pathColor;
          ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
          
          // Draw start marker
          if (x === this.start.x && y === this.start.y) {
            ctx.fillStyle = startColor;
            ctx.beginPath();
            ctx.arc(
              cellX + this.cellSize / 2,
              cellY + this.cellSize / 2,
              this.cellSize / 3,
              0, Math.PI * 2
            );
            ctx.fill();
          }
          
          // Draw exit marker
          if (x === this.exit.x && y === this.exit.y) {
            ctx.fillStyle = exitColor;
            ctx.beginPath();
            ctx.arc(
              cellX + this.cellSize / 2,
              cellY + this.cellSize / 2,
              this.cellSize / 3,
              0, Math.PI * 2
            );
            ctx.fill();
          }
        }
      }
    }
  }
  
  // Get the position of the start point in pixels
  getStartPosition() {
    return {
      x: this.start.x * this.cellSize + this.cellSize / 2,
      y: this.start.y * this.cellSize + this.cellSize / 2
    };
  }
  
  // Get the position of the exit point in pixels
  getExitPosition() {
    return {
      x: this.exit.x * this.cellSize + this.cellSize / 2,
      y: this.exit.y * this.cellSize + this.cellSize / 2
    };
  }
  
  // Find a random empty cell position away from the player
  getRandomEmptyPosition(playerX, playerY, minDistance) {
    const emptyCells = [];
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y][x] === 0) {
          const cellX = x * this.cellSize + this.cellSize / 2;
          const cellY = y * this.cellSize + this.cellSize / 2;
          const dist = distance(playerX, playerY, cellX, cellY);
          
          if (dist >= minDistance) {
            emptyCells.push({ x: cellX, y: cellY });
          }
        }
      }
    }
    
    if (emptyCells.length === 0) {
      // If no suitable cells found, try with half the minimum distance
      return this.getRandomEmptyPosition(playerX, playerY, minDistance / 2);
    }
    
    return emptyCells[randomInt(0, emptyCells.length - 1)];
  }
}