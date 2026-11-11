/**
 * ============================================================================
 * CANVAS MATHEMATICS & GEOMETRY UTILITIES
 * ============================================================================
 * Handles all Screen <-> World coordinate space transforms, zoom anchoring,
 * collision hit-testing, and dynamic connector anchor calculations.
 */

/**
 * Converts screen pixels (mouse event coordinates) into infinite world coordinates.
 */
export function screenToWorld(screenX, screenY, panX, panY, zoom) {
  return {
    x: (screenX - panX) / zoom,
    y: (screenY - panY) / zoom
  };
}

/**
 * Converts infinite world coordinates into viewport screen pixels.
 */
export function worldToScreen(worldX, worldY, panX, panY, zoom) {
  return {
    x: worldX * zoom + panX,
    y: worldY * zoom + panY
  };
}

/**
 * Calculates new pan coordinates when zooming into an arbitrary focal point
 * (such as the mouse cursor) so the point under the cursor stays fixed in screen space.
 */
export function calculateZoomAtPoint(targetZoom, mouseScreenX, mouseScreenY, currentPan, currentZoom) {
  // Clamp zoom range between 10% (0.1) and 3000% (30.0)
  const clampedZoom = Math.min(Math.max(targetZoom, 0.1), 30.0);

  // Compute the world coordinate directly under the mouse cursor before zoom
  const worldX = (mouseScreenX - currentPan.x) / currentZoom;
  const worldY = (mouseScreenY - currentPan.y) / currentZoom;

  // Reposition pan so world coordinate projects to the exact same screen pixel
  return {
    panX: mouseScreenX - worldX * clampedZoom,
    panY: mouseScreenY - worldY * clampedZoom,
    zoom: clampedZoom
  };
}

/**
 * Normalizes two diagonal corner points into standard top-left (x, y) with positive width & height.
 */
export function normalizeRect(x1, y1, x2, y2) {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1)
  };
}

/**
 * Hit-Test: Axis-Aligned Bounding Box (Rectangles, Sticky Notes, Text, Images)
 */
export function isPointInRect(px, py, rect, tolerance = 0) {
  return (
    px >= rect.x - tolerance &&
    px <= rect.x + rect.width + tolerance &&
    py >= rect.y - tolerance &&
    py <= rect.y + rect.height + tolerance
  );
}

/**
 * Hit-Test: Ellipse / Circle (Normalized Euclidean Distance)
 */
export function isPointInEllipse(px, py, ellipse) {
  const rx = ellipse.width / 2;
  const ry = ellipse.height / 2;
  if (rx <= 0 || ry <= 0) return false;
  const cx = ellipse.x + rx;
  const cy = ellipse.y + ry;
  return Math.pow(px - cx, 2) / Math.pow(rx, 2) + Math.pow(py - cy, 2) / Math.pow(ry, 2) <= 1;
}

/**
 * Hit-Test: Diamond (Rotated Square / Rhombus)
 */
export function isPointInDiamond(px, py, diamond) {
  const cx = diamond.x + diamond.width / 2;
  const cy = diamond.y + diamond.height / 2;
  const dx = Math.abs(px - cx);
  const dy = Math.abs(py - cy);
  const halfW = diamond.width / 2;
  const halfH = diamond.height / 2;
  if (halfW <= 0 || halfH <= 0) return false;
  return dx / halfW + dy / halfH <= 1;
}

/**
 * Calculates shortest perpendicular distance from point P to line segment AB.
 */
export function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);

  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

/**
 * Hit-Test: Freehand pen stroke points
 */
export function isPointInFreehandStroke(px, py, points, strokeWidth = 2, tolerance = 8) {
  if (!points || points.length < 2) return false;
  const threshold = Math.max(strokeWidth / 2 + tolerance, 8);
  for (let i = 0; i < points.length - 1; i++) {
    const dist = distanceToSegment(px, py, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    if (dist <= threshold) return true;
  }
  return false;
}

/**
 * Calculates the 4 cardinal magnetic anchor points for an element (Top, Right, Bottom, Left).
 */
export function getElementAnchors(element) {
  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;
  return [
    { id: 'top', x: cx, y: element.y },
    { id: 'right', x: element.x + element.width, y: cy },
    { id: 'bottom', x: cx, y: element.y + element.height },
    { id: 'left', x: element.x, y: cy }
  ];
}

/**
 * Finds the nearest magnetic anchor point within a given snap radius.
 */
export function findNearestAnchor(worldX, worldY, elements, ignoreElementId = null, snapRadius = 24) {
  let closest = null;
  let minDistance = snapRadius;

  for (const el of elements) {
    if (el.id === ignoreElementId || el.type === 'pen' || el.type === 'connector') continue;
    const anchors = getElementAnchors(el);
    for (const anchor of anchors) {
      const dist = Math.hypot(worldX - anchor.x, worldY - anchor.y);
      if (dist < minDistance) {
        minDistance = dist;
        closest = {
          elementId: el.id,
          anchorId: anchor.id,
          x: anchor.x,
          y: anchor.y
        };
      }
    }
  }

  return closest;
}

/**
 * Linear Interpolation (Lerp) for smooth cursor transitions
 */
export function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

/**
 * Computes bounding box enclosing multiple selected elements.
 */
export function getCombinedBoundingBox(elements) {
  if (!elements || elements.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

