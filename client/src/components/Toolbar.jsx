/**
 * ============================================================================
 * BOTTOM FLOATING TOOLBAR
 * ============================================================================
 * Semantic <nav> element adhering to 8px grid spacing, keyboard tooltips,
 * and accessibility standards.
 */

import React from 'react';
import { useWhiteboard } from '../context/WhiteboardContext.jsx';
import {
  MousePointer,
  Square,
  Circle,
  Diamond,
  StickyNote,
  PenTool,
  ArrowRight,
  Type,
  Smile,
  Eraser
} from 'lucide-react';

const TOOLS = [
  { id: 'select', label: 'Select & Move', shortcut: 'V', icon: MousePointer },
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: Square },
  { id: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: Circle },
  { id: 'diamond', label: 'Diamond', shortcut: 'D', icon: Diamond },
  { id: 'sticky', label: 'Sticky Note', shortcut: 'S', icon: StickyNote },
  { id: 'pen', label: 'Freehand Pen', shortcut: 'P', icon: PenTool },
  { id: 'connector', label: 'Dynamic Connector', shortcut: 'C', icon: ArrowRight },
  { id: 'text', label: 'Text Block', shortcut: 'T', icon: Type },
  { id: 'stamp', label: 'Emoji Reaction Stamp', shortcut: 'M', icon: Smile },
  { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: Eraser }
];

export function Toolbar() {
  const { activeTool, setActiveTool } = useWhiteboard();

  return (
    <nav
      aria-label="Canvas Drawing Tools"
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        background: 'var(--bg-surface)',
        padding: 'var(--space-1)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-float)',
        border: '1px solid var(--border-color)',
        zIndex: 50
      }}
    >
      {TOOLS.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;

        return (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            title={`${t.label} (${t.shortcut})`}
            aria-pressed={isActive}
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              background: isActive ? 'var(--accent-subtle)' : 'transparent',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Icon size={19} />
            {/* Keyboard shortcut tiny badge */}
            <span
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '4px',
                fontSize: '9px',
                fontWeight: 600,
                opacity: 0.6
              }}
            >
              {t.shortcut}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

