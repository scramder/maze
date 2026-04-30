/**
 * Utility functions for the game
 */

// Generate a random integer between min (inclusive) and max (inclusive)
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Format time in mm:ss format
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Calculate distance between two points
function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Calculate angle between two points
function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

// Normalize vector to have length 1
function normalizeVector(x, y) {
  const length = Math.sqrt(x * x + y * y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: x / length, y: y / length };
}

// Check if point is inside circle
function pointInCircle(px, py, cx, cy, radius) {
  const distanceSquared = Math.pow(px - cx, 2) + Math.pow(py - cy, 2);
  return distanceSquared <= radius * radius;
}

// Check if two circles are colliding
function circlesColliding(c1x, c1y, c1r, c2x, c2y, c2r) {
  const distanceSquared = Math.pow(c1x - c2x, 2) + Math.pow(c1y - c2y, 2);
  const radiusSum = c1r + c2r;
  return distanceSquared <= radiusSum * radiusSum;
}

// Check if a circle is colliding with a triangle
function circleTriangleCollision(cx, cy, radius, tx1, ty1, tx2, ty2, tx3, ty3) {
  // Check if circle center is inside triangle
  if (pointInTriangle(cx, cy, tx1, ty1, tx2, ty2, tx3, ty3)) {
    return true;
  }
  
  // Check if circle intersects any of the triangle's edges
  if (circleLineCollision(cx, cy, radius, tx1, ty1, tx2, ty2) ||
      circleLineCollision(cx, cy, radius, tx2, ty2, tx3, ty3) ||
      circleLineCollision(cx, cy, radius, tx3, ty3, tx1, ty1)) {
    return true;
  }
  
  return false;
}

// Check if a point is inside a triangle
function pointInTriangle(px, py, tx1, ty1, tx2, ty2, tx3, ty3) {
  const d1 = sign(px, py, tx1, ty1, tx2, ty2);
  const d2 = sign(px, py, tx2, ty2, tx3, ty3);
  const d3 = sign(px, py, tx3, ty3, tx1, ty1);

  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

  return !(hasNeg && hasPos);
}

// Helper function for pointInTriangle
function sign(px, py, tx1, ty1, tx2, ty2) {
  return (px - tx2) * (ty1 - ty2) - (tx1 - tx2) * (py - ty2);
}

// Check if a circle intersects a line segment
function circleLineCollision(cx, cy, radius, x1, y1, x2, y2) {
  // Calculate closest point on the line segment to the circle center
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const dot = ((cx - x1) * dx + (cy - y1) * dy) / (len * len);
  
  let closestX, closestY;
  if (dot < 0) {
    closestX = x1;
    closestY = y1;
  } else if (dot > 1) {
    closestX = x2;
    closestY = y2;
  } else {
    closestX = x1 + dot * dx;
    closestY = y1 + dot * dy;
  }
  
  // Check if the closest point is within the circle's radius
  return distance(cx, cy, closestX, closestY) <= radius;
}

// Linear interpolation between two values
function lerp(a, b, t) {
  return a + t * (b - a);
}