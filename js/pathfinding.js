class Node {
  constructor(x, y, walkable = true) {
    this.x = x;
    this.y = y;
    this.walkable = walkable;
    this.g = 0; // Costo desde el inicio
    this.h = 0; // Costo estimado hasta el objetivo
    this.f = 0; // Costo total (g + h)
    this.parent = null;
  }
}

class PathFinder {
  constructor(maze) {
    this.maze = maze;
    this.cellSize = maze.cellSize;
  }

  // Encuentra el camino usando A*
  findPath(startX, startY, endX, endY) {
    const startCellX = Math.floor(startX / this.cellSize);
    const startCellY = Math.floor(startY / this.cellSize);
    const endCellX = Math.floor(endX / this.cellSize);
    const endCellY = Math.floor(endY / this.cellSize);

    // Crear nodos para cada celda
    const nodes = [];
    for (let y = 0; y < this.maze.height; y++) {
      nodes[y] = [];
      for (let x = 0; x < this.maze.width; x++) {
        nodes[y][x] = new Node(x, y, this.maze.cells[y][x] === 0);
      }
    }

    const startNode = nodes[startCellY][startCellX];
    const endNode = nodes[endCellY][endCellX];

    const openSet = [startNode];
    const closedSet = new Set();

    while (openSet.length > 0) {
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }

      const currentNode = openSet[currentIndex];

      if (currentNode === endNode) {
        return this.reconstructPath(currentNode);
      }

      openSet.splice(currentIndex, 1);
      closedSet.add(currentNode);

      const neighbors = this.getNeighbors(currentNode, nodes);
      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor)) continue;

        const tentativeG = currentNode.g + 1;

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeG >= neighbor.g) {
          continue;
        }

        neighbor.parent = currentNode;
        neighbor.g = tentativeG;
        neighbor.h = this.heuristic(neighbor, endNode);
        neighbor.f = neighbor.g + neighbor.h;
      }
    }

    return null;
  }

  // Obtener nodos vecinos (solo horizontales y verticales para movimientos más cuadrados)
  getNeighbors(node, nodes) {
    const neighbors = [];
    const directions = [
      [0, -1], // arriba
      [1, 0],  // derecha
      [0, 1],  // abajo
      [-1, 0]  // izquierda
    ];

    for (const [dx, dy] of directions) {
      const nx = node.x + dx;
      const ny = node.y + dy;

      if (nx >= 0 && nx < this.maze.width && 
          ny >= 0 && ny < this.maze.height && 
          nodes[ny][nx].walkable) {
        neighbors.push(nodes[ny][nx]);
      }
    }

    return neighbors;
  }

  // Heurística (distancia Manhattan)
  heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  // Reconstruir el camino con puntos centrados en los pasillos
  reconstructPath(node) {
    const path = [];
    let current = node;
    let lastDirection = null;

    while (current) {
      const centerX = (current.x + 0.5) * this.cellSize;
      const centerY = (current.y + 0.5) * this.cellSize;
      
      if (current.parent) {
        const prevX = (current.parent.x + 0.5) * this.cellSize;
        const prevY = (current.parent.y + 0.5) * this.cellSize;
        
        // Determinar la dirección actual
        const currentDirection = {
          x: Math.sign(current.x - current.parent.x),
          y: Math.sign(current.y - current.parent.y)
        };
        
        // Si hay un cambio de dirección, agregar puntos intermedios para suavizar la curva
        if (lastDirection && (lastDirection.x !== currentDirection.x || lastDirection.y !== currentDirection.y)) {
          // Agregar punto intermedio en la esquina
          if (currentDirection.x !== 0) {
            path.unshift({
              x: centerX,
              y: prevY
            });
          } else {
            path.unshift({
              x: prevX,
              y: centerY
            });
          }
        }
        
        lastDirection = currentDirection;
      }
      
      path.unshift({
        x: centerX,
        y: centerY
      });
      
      current = current.parent;
    }

    // Suavizar el camino eliminando puntos innecesarios
    return this.smoothPath(path);
  }

  smoothPath(path) {
    if (path.length <= 2) return path;
    
    const smoothed = [path[0]];
    let lastPoint = path[0];
    
    for (let i = 1; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i + 1];
      
      // Si el punto actual está alineado con el último y el siguiente, lo omitimos
      const isAligned = this.arePointsAligned(lastPoint, current, next);
      
      if (!isAligned) {
        smoothed.push(current);
        lastPoint = current;
      }
    }
    
    smoothed.push(path[path.length - 1]);
    return smoothed;
  }

  arePointsAligned(p1, p2, p3) {
    // Verificar si tres puntos están alineados horizontal o verticalmente
    return (Math.abs(p1.x - p2.x) < 0.1 && Math.abs(p2.x - p3.x) < 0.1) ||
           (Math.abs(p1.y - p2.y) < 0.1 && Math.abs(p2.y - p3.y) < 0.1);
  }
} 