/**
 * ============================================================================
 * CONTEXTUAL PROPERTIES PANEL
 * ============================================================================
 * Semantic <aside> panel providing stroke color swatches, fill colors,
 * stroke width, dash styles, sticky note colors, and emoji selectors.
 */

import React from 'react';
import { useWhiteboard } from '../context/WhiteboardContext.jsx';
import { Trash2 } from 'lucide-react';

const STROKE_COLORS = ['#0f172a', '#2563eb', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#ffffff'];
const FILL_COLORS = ['transparent', '#e0f2fe', '#dcfce7', '#fee2e2', '#f3e8ff', '#fef3c7'];
const STICKY_COLORS = [
  { label: 'Yellow', color: '#fef08a' },
  { label: 'Green', color: '#bbf7d0' },
  { label: 'Blue', color: '#bfdbfe' },
  { label: 'Pink', color: '#fbcfe8' },
  { label: 'Purple', color: '#e9d5ff' },
  { label: 'Orange', color: '#fed7aa' }
];
const STAMPS = ['🚀', '❤️', '👍', '💡', '🔥', '⭐', '🎯', '🎉'];

export function PropertiesPanel() {
  const {
    activeTool,
    strokeColor,
    setStrokeColor,
    fillColor,
    setFillColor,
    strokeWidth,
    setStrokeWidth,
    strokeStyle,
    setStrokeStyle,
    stickyColor,
    setStickyColor,
    activeEmoji,
    setActiveEmoji,
    selectedIds,
    elements,
    commitElements,
    deleteSelected
  } = useWhiteboard();

  const selectedElements = elements.filter(el => selectedIds.includes(el.id));
  const hasSelection = selectedElements.length > 0;

  // When updating a property with selection active, mutate the selected elements
  const updateSelected = (updates) => {
    if (selectedIds.length === 0) return;
    const updated = elements.map(el => (selectedIds.includes(el.id) ? { ...el, ...updates } : el));
    commitElements(updated);
  };

  const isStickyActive = activeTool === 'sticky' || selectedElements.some(el => el.type === 'sticky');
  const isStampActive = activeTool === 'stamp';

  return (
    <aside
      aria-label="Element Properties"
      style={{
        position: 'absolute',
        top: '80px',
        left: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        background: 'var(--bg-surface)',
        padding: 'var(--space-2)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        zIndex: 40,
        width: '210px'
      }}
    >
      {/* Sticky Note Palette */}
      {isStickyActive && (
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            STICKY NOTE COLOR
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
            {STICKY_COLORS.map(s => (
              <button
                key={s.color}
                title={s.label}
                onClick={() => {
                  setStickyColor(s.color);
                  updateSelected({ fillColor: s.color });
                }}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '4px',
                  background: s.color,
                  border: (stickyColor === s.color || selectedElements[0]?.fillColor === s.color) ? '2px solid var(--text-primary)' : '1px solid rgba(0,0,0,0.15)'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Emoji Stamp Picker */}
      {isStampActive && (
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            SELECT REACTION
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {STAMPS.map(emoji => (
              <button
                key={emoji}
                onClick={() => setActiveEmoji(emoji)}
                style={{
                  fontSize: '20px',
                  padding: '4px',
                  borderRadius: '4px',
                  background: activeEmoji === emoji ? 'var(--accent-subtle)' : 'var(--bg-surface-elevated)'
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stroke Color */}
      {!isStickyActive && !isStampActive && (
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            STROKE COLOR
          </label>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {STROKE_COLORS.map(c => (
              <button
                key={c}
                onClick={() => {
                  setStrokeColor(c);
                  updateSelected({ strokeColor: c });
                }}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  background: c,
                  border: strokeColor === c ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fill Color */}
      {!isStickyActive && !isStampActive && (
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            FILL COLOR
          </label>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {FILL_COLORS.map(c => (
              <button
                key={c}
                onClick={() => {
                  setFillColor(c);
                  updateSelected({ fillColor: c });
                }}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  background: c === 'transparent' ? 'repeating-linear-gradient(45deg, #ccc, #ccc 2px, #fff 2px, #fff 6px)' : c,
                  border: fillColor === c ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stroke Width */}
      {!isStickyActive && !isStampActive && (
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            STROKE WIDTH
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 4, 8].map(w => (
              <button
                key={w}
                onClick={() => {
                  setStrokeWidth(w);
                  updateSelected({ strokeWidth: w });
                }}
                style={{
                  flex: 1,
                  padding: '4px 0',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  background: strokeWidth === w ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                  color: strokeWidth === w ? '#fff' : 'var(--text-primary)'
                }}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stroke Style */}
      {!isStickyActive && !isStampActive && (
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            STROKE STYLE
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['solid', 'dashed', 'dotted'].map(s => (
              <button
                key={s}
                onClick={() => {
                  setStrokeStyle(s);
                  updateSelected({ strokeStyle: s });
                }}
                style={{
                  flex: 1,
                  padding: '4px 0',
                  fontSize: '10px',
                  textTransform: 'capitalize',
                  borderRadius: '4px',
                  background: strokeStyle === s ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                  color: strokeStyle === s ? '#fff' : 'var(--text-primary)'
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selection Delete Action */}
      {hasSelection && (
        <button
          onClick={deleteSelected}
          style={{
            marginTop: 'var(--space-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '6px',
            borderRadius: '4px',
            background: 'var(--danger-subtle)',
            color: 'var(--danger)',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          <Trash2 size={14} />
          <span>Delete Element</span>
        </button>
      )}
    </aside>
  );
}

