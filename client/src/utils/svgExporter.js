/**
 * ============================================================================
 * VECTOR SVG EXPORTER
 * ============================================================================
 * Converts infinite canvas elements into crisp, scalable, standalone SVG
 * documents that can be opened in Figma, Illustrator, or web browsers.
 */

export function exportBoardAsSVG(elements, title = 'Whiteboard') {
  if (!elements || elements.length === 0) return null;

  // 1. Calculate bounding box enclosing all elements
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((el) => {
    minX = Math.min(minX, el.x !== undefined ? el.x : (el.startX || 0));
    minY = Math.min(minY, el.y !== undefined ? el.y : (el.startY || 0));
    maxX = Math.max(maxX, (el.x || 0) + (el.width || 0), el.endX || 0);
    maxY = Math.max(maxY, (el.y || 0) + (el.height || 0), el.endY || 0);
  });

  const padding = 64;
  const viewBoxX = minX - padding;
  const viewBoxY = minY - padding;
  const width = Math.max(maxX - minX + padding * 2, 400);
  const height = Math.max(maxY - minY + padding * 2, 300);

  // 2. Generate SVG tags for each element
  let svgContent = '';

  elements.forEach((el) => {
    const stroke = el.strokeColor || '#0f172a';
    const strokeWidth = el.strokeWidth || 2;
    const fill = el.fillColor && el.fillColor !== 'transparent' ? el.fillColor : 'none';
    const dash = el.strokeStyle === 'dashed' ? 'stroke-dasharray="8 6"' : el.strokeStyle === 'dotted' ? 'stroke-dasharray="3 4"' : '';

    if (el.type === 'rectangle') {
      const rx = el.borderRadius || 8;
      svgContent += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dash} />\n`;
      if (el.text) {
        svgContent += `  <text x="${el.x + el.width / 2}" y="${el.y + el.height / 2 + 5}" font-family="Inter, sans-serif" font-size="${el.fontSize || 16}" fill="${el.textColor || stroke}" text-anchor="middle">${escapeXml(el.text)}</text>\n`;
      }
    } else if (el.type === 'ellipse') {
      const rx = el.width / 2;
      const ry = el.height / 2;
      const cx = el.x + rx;
      const cy = el.y + ry;
      svgContent += `  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dash} />\n`;
      if (el.text) {
        svgContent += `  <text x="${cx}" y="${cy + 5}" font-family="Inter, sans-serif" font-size="${el.fontSize || 16}" fill="${el.textColor || stroke}" text-anchor="middle">${escapeXml(el.text)}</text>\n`;
      }
    } else if (el.type === 'diamond') {
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const points = `${cx},${el.y} ${el.x + el.width},${cy} ${cx},${el.y + el.height} ${el.x},${cy}`;
      svgContent += `  <polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dash} />\n`;
      if (el.text) {
        svgContent += `  <text x="${cx}" y="${cy + 5}" font-family="Inter, sans-serif" font-size="${el.fontSize || 14}" fill="${el.textColor || stroke}" text-anchor="middle">${escapeXml(el.text)}</text>\n`;
      }
    } else if (el.type === 'sticky') {
      svgContent += `  <g filter="drop-shadow(3px 4px 5px rgba(0,0,0,0.15))">\n`;
      svgContent += `    <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="4" fill="${el.fillColor || '#fef08a'}" stroke="rgba(0,0,0,0.08)" stroke-width="1" />\n`;
      svgContent += `    <text x="${el.x + 14}" y="${el.y + 28}" font-family="sans-serif" font-size="${el.fontSize || 16}" fill="${el.textColor || '#1e293b'}">${escapeXml(el.text || '')}</text>\n`;
      svgContent += `  </g>\n`;
    } else if (el.type === 'pen' && el.points && el.points.length > 1) {
      const d = el.points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
      svgContent += `  <path d="${d}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />\n`;
    } else if (el.type === 'connector') {
      svgContent += `  <line x1="${el.startX}" y1="${el.startY}" x2="${el.endX}" y2="${el.endY}" stroke="${stroke}" stroke-width="${strokeWidth}" marker-end="url(#arrowhead)" />\n`;
    } else if (el.type === 'text') {
      svgContent += `  <text x="${el.x}" y="${el.y + (el.fontSize || 18)}" font-family="Inter, sans-serif" font-size="${el.fontSize || 18}" fill="${el.textColor || stroke}">${escapeXml(el.text || '')}</text>\n`;
    } else if (el.type === 'stamp') {
      svgContent += `  <text x="${el.x + 20}" y="${el.y + 28}" font-size="${el.fontSize || 32}" text-anchor="middle">${el.emoji || '🚀'}</text>\n`;
    }
  });

  // 3. Assemble complete SVG document with arrowhead marker defs
  const svgDoc = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#0f172a" />
    </marker>
  </defs>
  <!-- Background Canvas -->
  <rect x="${viewBoxX}" y="${viewBoxY}" width="${width}" height="${height}" fill="#f8fafc" />
${svgContent}</svg>`;

  return svgDoc;
}

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

