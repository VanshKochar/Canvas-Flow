/**
 * ============================================================================
 * CANVAS 2D RENDERING ENGINE
 * ============================================================================
 * High-performance immediate-mode renderer that executes every frame.
 * Renders the infinite adaptive dot grid, vector shapes, sticky notes,
 * connectors with arrowheads, freehand pen strokes, selection bounding boxes,
 * and remote multiplayer user cursors.
 */

import { getElementAnchors } from '../utils/canvasMath.js';

/**
 * Main render function invoked on every animation frame.
 */
export function renderCanvas(ctx, canvas, state) {
  const {
    pan,
    zoom,
    elements,
    selectedIds,
    activeDraft,
    selectionBox,
    snapPoint,
    remoteUsers,
    activeLocks,
    gridVisible = true,
    theme = 'light'
  } = state;

  const width = canvas.width / (window.devicePixelRatio || 1);
  const height = canvas.height / (window.devicePixelRatio || 1);

  // 1. Clear viewport
  ctx.clearRect(0, 0, width, height);

  // 2. Save context before applying camera transformations
  ctx.save();

  // 3. Apply Camera Transform (Pan & Zoom)
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  // 4. Compute visible world bounds for viewport culling and grid
  const visibleBounds = {
    minX: -pan.x / zoom,
    minY: -pan.y / zoom,
    maxX: (width - pan.x) / zoom,
    maxY: (height - pan.y) / zoom
  };

  // 5. Draw Infinite Adaptive Dot Grid
  if (gridVisible) {
    drawAdaptiveGrid(ctx, visibleBounds, zoom, theme);
  }

  // 6. Draw Persisted Canvas Elements
  for (const element of elements) {
    // Simple viewport culling check
    if (isElementInViewport(element, visibleBounds)) {
      renderElement(ctx, element);
    }
  }

  // 7. Draw Active In-Progress Draft Element (while user is dragging/drawing)
  if (activeDraft) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    renderElement(ctx, activeDraft);
    ctx.restore();
  }

  // 8. Draw Magnetic Snap Target Indicator (for dynamic connectors)
  if (snapPoint) {
    drawSnapIndicator(ctx, snapPoint);
  }

  // 9. Draw Selection Boxes & Transform Handles
  if (selectedIds && selectedIds.length > 0) {
    drawSelectionBorders(ctx, elements, selectedIds, zoom);
  }

  // 9b. Draw Remote Active Object Locks
  if (activeLocks && Object.keys(activeLocks).length > 0) {
    drawRemoteLocks(ctx, elements, activeLocks, zoom);
  }

  // 10. Draw Multi-Select Marquee Drag Box
  if (selectionBox) {
    drawMarqueeBox(ctx, selectionBox);
  }

  // 11. Draw Remote Multiplayer Cursors
  if (remoteUsers) {
    for (const user of Object.values(remoteUsers)) {
      if (user && user.cursor) {
        drawRemoteCursor(ctx, user);
      }
    }
  }

  // 12. Restore context to clean screen state
  ctx.restore();
}

/**
 * Draws an adaptive dot grid that spaces dots appropriately across zoom levels.
 */
function drawAdaptiveGrid(ctx, bounds, zoom, theme) {
  // Base grid spacing is 32px (4x of 8px grid)
  let baseSpacing = 32;
  if (zoom < 0.4) baseSpacing = 64;
  if (zoom < 0.2) baseSpacing = 128;

  const startX = Math.floor(bounds.minX / baseSpacing) * baseSpacing;
  const endX = Math.ceil(bounds.maxX / baseSpacing) * baseSpacing;
  const startY = Math.floor(bounds.minY / baseSpacing) * baseSpacing;
  const endY = Math.ceil(bounds.maxY / baseSpacing) * baseSpacing;

  ctx.fillStyle = theme === 'dark' ? '#334155' : '#cbd5e1';
  const dotRadius = Math.max(1 / zoom, 1.2);

  for (let x = startX; x <= endX; x += baseSpacing) {
    for (let y = startY; y <= endY; y += baseSpacing) {
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Checks if an element intersects the visible viewport bounds.
 */
function isElementInViewport(el, bounds) {
  const margin = 50;
  return !(
    el.x + (el.width || 0) < bounds.minX - margin ||
    el.x > bounds.maxX + margin ||
    el.y + (el.height || 0) < bounds.minY - margin ||
    el.y > bounds.maxY + margin
  );
}

/**
 * Renders an individual element according to its shape type.
 */
export function renderElement(ctx, el) {
  ctx.save();
  ctx.lineWidth = el.strokeWidth || 2;
  ctx.strokeStyle = el.strokeColor || '#0f172a';
  ctx.fillStyle = el.fillColor || 'transparent';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (el.strokeStyle === 'dashed') {
    ctx.setLineDash([8, 6]);
  } else if (el.strokeStyle === 'dotted') {
    ctx.setLineDash([3, 4]);
  } else {
    ctx.setLineDash([]);
  }

  switch (el.type) {
    case 'rectangle':
      drawRectangle(ctx, el);
      break;
    case 'ellipse':
      drawEllipse(ctx, el);
      break;
    case 'diamond':
      drawDiamond(ctx, el);
      break;
    case 'sticky':
      drawStickyNote(ctx, el);
      break;
    case 'text':
      drawTextBlock(ctx, el);
      break;
    case 'pen':
      drawFreehandPen(ctx, el);
      break;
    case 'connector':
      drawConnector(ctx, el);
      break;
    case 'stamp':
      drawStamp(ctx, el);
      break;
    default:
      break;
  }

  ctx.restore();
}

/**
 * Draws rounded rectangle.
 */
function drawRectangle(ctx, el) {
  const radius = Math.min(el.borderRadius || 8, Math.min(el.width, el.height) / 2);
  ctx.beginPath();
  ctx.roundRect(el.x, el.y, el.width, el.height, radius);
  if (el.fillColor && el.fillColor !== 'transparent') ctx.fill();
  ctx.stroke();

  if (el.text) {
    drawCenteredText(ctx, el.text, el.x + el.width / 2, el.y + el.height / 2, el.width - 16, el.textColor || '#0f172a', el.fontSize || 16);
  }
}

/**
 * Draws ellipse / circle.
 */
function drawEllipse(ctx, el) {
  const rx = Math.max(el.width / 2, 1);
  const ry = Math.max(el.height / 2, 1);
  const cx = el.x + rx;
  const cy = el.y + ry;

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  if (el.fillColor && el.fillColor !== 'transparent') ctx.fill();
  ctx.stroke();

  if (el.text) {
    drawCenteredText(ctx, el.text, cx, cy, el.width * 0.75, el.textColor || '#0f172a', el.fontSize || 16);
  }
}

/**
 * Draws diamond / rhombus for decision nodes in flowcharts.
 */
function drawDiamond(ctx, el) {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;

  ctx.beginPath();
  ctx.moveTo(cx, el.y);
  ctx.lineTo(el.x + el.width, cy);
  ctx.lineTo(cx, el.y + el.height);
  ctx.lineTo(el.x, cy);
  ctx.closePath();

  if (el.fillColor && el.fillColor !== 'transparent') ctx.fill();
  ctx.stroke();

  if (el.text) {
    drawCenteredText(ctx, el.text, cx, cy, el.width * 0.6, el.textColor || '#0f172a', el.fontSize || 14);
  }
}

/**
 * Draws realistic sticky note with drop shadow and auto-wrapped text.
 */
function drawStickyNote(ctx, el) {
  ctx.save();
  // Drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = el.fillColor || '#fef08a';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.roundRect(el.x, el.y, el.width, el.height, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Subtle corner dog-ear fold on bottom-right
  const foldSize = 14;
  ctx.beginPath();
  ctx.moveTo(el.x + el.width - foldSize, el.y + el.height);
  ctx.lineTo(el.x + el.width, el.y + el.height - foldSize);
  ctx.lineTo(el.x + el.width - foldSize, el.y + el.height - foldSize);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.fill();

  // Draw sticky note text
  if (el.text) {
    drawMultilineText(
      ctx,
      el.text,
      el.x + 12,
      el.y + 16,
      el.width - 24,
      el.height - 24,
      el.textColor || '#1e293b',
      el.fontSize || 16,
      'Caveat, cursive'
    );
  }
}

/**
 * Draws inline text block.
 */
function drawTextBlock(ctx, el) {
  ctx.font = `${el.fontSize || 18}px Inter, sans-serif`;
  ctx.fillStyle = el.textColor || el.strokeColor || '#0f172a';
  ctx.textBaseline = 'top';

  const lines = (el.text || 'Text').split('\n');
  const lineHeight = (el.fontSize || 18) * 1.35;

  lines.forEach((line, index) => {
    ctx.fillText(line, el.x, el.y + index * lineHeight);
  });
}

/**
 * Draws smooth freehand pen strokes using quadratic curve interpolation.
 */
function drawFreehandPen(ctx, el) {
  if (!el.points || el.points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(el.points[0].x, el.points[0].y);

  if (el.points.length === 2) {
    ctx.lineTo(el.points[1].x, el.points[1].y);
  } else {
    // Quadratic Bézier curve through midpoints for silky smooth strokes
    for (let i = 1; i < el.points.length - 1; i++) {
      const xc = (el.points[i].x + el.points[i + 1].x) / 2;
      const yc = (el.points[i].y + el.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, xc, yc);
    }
    const last = el.points[el.points.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  ctx.stroke();
}

/**
 * Draws dynamic connector with directional arrowhead.
 */
function drawConnector(ctx, el) {
  const { startX, startY, endX, endY } = el;
  if (startX === undefined || endX === undefined) return;

  ctx.beginPath();
  ctx.moveTo(startX, startY);

  // Curved connector using cubic Bézier
  const dx = endX - startX;
  const dy = endY - startY;
  const cx1 = startX + dx * 0.5;
  const cy1 = startY;
  const cx2 = startX + dx * 0.5;
  const cy2 = endY;

  ctx.bezierCurveTo(cx1, cy1, cx2, cy2, endX, endY);
  ctx.stroke();

  // Draw Arrowhead at the end
  const angle = Math.atan2(endY - cy2, endX - cx2);
  const headLen = Math.max(el.strokeWidth * 3.5, 12);

  ctx.fillStyle = el.strokeColor || '#0f172a';
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLen * Math.cos(angle - Math.PI / 6),
    endY - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    endX - headLen * Math.cos(angle + Math.PI / 6),
    endY - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws reaction stamp.
 */
function drawStamp(ctx, el) {
  ctx.font = `${el.fontSize || 36}px Apple Color Emoji, Segoe UI Emoji, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(el.emoji || '👍', el.x + el.width / 2, el.y + el.height / 2);
}

/**
 * Draws text wrapped inside bounding limits.
 */
function drawMultilineText(ctx, text, x, y, maxWidth, maxHeight, color, fontSize, fontFamily) {
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  const words = text.split(' ');
  let line = '';
  const lineHeight = fontSize * 1.35;
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      if (currentY + lineHeight > y + maxHeight) break; // prevent overflowing sticky bottom
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (currentY + lineHeight <= y + maxHeight) {
    ctx.fillText(line, x, currentY);
  }
}

/**
 * Helper to center text in shapes.
 */
function drawCenteredText(ctx, text, cx, cy, maxWidth, color, fontSize) {
  ctx.font = `500 ${fontSize}px Inter, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy, maxWidth);
}

/**
 * Draws selection bounding borders and resize handles.
 */
function drawSelectionBorders(ctx, elements, selectedIds, zoom) {
  const selectedElements = elements.filter(el => selectedIds.includes(el.id));
  if (selectedElements.length === 0) return;

  const handleSize = Math.max(8 / zoom, 6);

  for (const el of selectedElements) {
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = Math.max(1.5 / zoom, 1);
    ctx.setLineDash([4 / zoom, 4 / zoom]);

    const pad = 4 / zoom;
    ctx.strokeRect(el.x - pad, el.y - pad, el.width + pad * 2, el.height + pad * 2);

    // Draw 8 resize handles
    ctx.fillStyle = '#ffffff';
    ctx.setLineDash([]);
    const corners = [
      { x: el.x - pad, y: el.y - pad }, // nw
      { x: el.x + el.width / 2, y: el.y - pad }, // n
      { x: el.x + el.width + pad, y: el.y - pad }, // ne
      { x: el.x + el.width + pad, y: el.y + el.height / 2 }, // e
      { x: el.x + el.width + pad, y: el.y + el.height + pad }, // se
      { x: el.x + el.width / 2, y: el.y + el.height + pad }, // s
      { x: el.x - pad, y: el.y + el.height + pad }, // sw
      { x: el.x - pad, y: el.y + el.height / 2 } // w
    ];

    for (const corner of corners) {
      ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
    }
  }
}

/**
 * Draws active locks held by remote teammates.
 */
function drawRemoteLocks(ctx, elements, activeLocks, zoom) {
  for (const [elId, lockedBy] of Object.entries(activeLocks)) {
    const el = elements.find(e => e.id === elId);
    if (!el) continue;

    ctx.save();
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = Math.max(2 / zoom, 1.5);
    ctx.setLineDash([4 / zoom, 4 / zoom]);

    const pad = 6 / zoom;
    ctx.strokeRect(el.x - pad, el.y - pad, (el.width || 40) + pad * 2, (el.height || 40) + pad * 2);

    // Lock badge
    ctx.font = '600 10px Inter, sans-serif';
    ctx.fillStyle = '#ec4899';
    const badgeText = '🔒 Editing';
    const textW = ctx.measureText(badgeText).width;
    ctx.fillRect(el.x - pad, el.y - pad - 16 / zoom, textW + 8 / zoom, 14 / zoom);

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, el.x - pad + 4 / zoom, el.y - pad - 9 / zoom);
    ctx.restore();
  }
}

/**
 * Draws magnetic snap indicator when connector nears an anchor point.
 */
function drawSnapIndicator(ctx, snapPoint) {
  ctx.save();
  ctx.fillStyle = '#10b981';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(snapPoint.x, snapPoint.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws multi-select marquee drag area.
 */
function drawMarqueeBox(ctx, box) {
  ctx.save();
  ctx.fillStyle = 'rgba(37, 99, 235, 0.1)';
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.fillRect(box.x, box.y, box.width, box.height);
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  ctx.restore();
}

/**
 * Draws remote user cursor with username badge.
 */
function drawRemoteCursor(ctx, user) {
  const { x, y } = user.cursor;
  const color = user.color || '#ec4899';
  const name = user.name || 'Anonymous';

  ctx.save();
  // Cursor pointer arrow
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 12, y + 16);
  ctx.lineTo(x + 5, y + 16);
  ctx.lineTo(x, y + 21);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Name Tag Badge
  ctx.font = '600 11px Inter, sans-serif';
  const textWidth = ctx.measureText(name).width;
  const tagPad = 6;
  const tagHeight = 18;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + 12, y + 14, textWidth + tagPad * 2, tagHeight, 4);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x + 12 + tagPad, y + 14 + tagHeight / 2);

  ctx.restore();
}

