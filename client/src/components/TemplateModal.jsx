/**
 * ============================================================================
 * PRE-BUILT TEMPLATE PICKER MODAL
 * ============================================================================
 * Semantic modal for instant framework insertion (Agile retro, Kanban, etc.)
 */

import React from 'react';
import { useWhiteboard } from '../context/WhiteboardContext.jsx';
import { TEMPLATES } from '../data/templates.js';
import { X, Sparkles, MessageSquare, Kanban, Network } from 'lucide-react';

const ICON_MAP = {
  MessageSquare,
  Kanban,
  Network
};

export function TemplateModal({ isOpen, onClose }) {
  const { loadTemplate } = useWhiteboard();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 'var(--space-2)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-float)',
          border: '1px solid var(--border-color)',
          width: '100%',
          maxWidth: '680px',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-2) var(--space-3)',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--accent-primary)" />
            <h2 id="template-modal-title" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Template Library
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              padding: '6px',
              borderRadius: '4px',
              color: 'var(--text-secondary)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Templates Grid */}
        <div
          style={{
            padding: 'var(--space-3)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-2)',
            maxHeight: '65vh',
            overflowY: 'auto'
          }}
        >
          {TEMPLATES.map((tmpl) => {
            const Icon = ICON_MAP[tmpl.icon] || Sparkles;
            return (
              <div
                key={tmpl.id}
                onClick={() => {
                  loadTemplate(tmpl.id);
                  onClose();
                }}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-2)',
                  background: 'var(--bg-surface-elevated)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'var(--accent-subtle)',
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {tmpl.name}
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 500 }}>
                      {tmpl.category}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {tmpl.description}
                </p>
                <button
                  style={{
                    marginTop: 'auto',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    width: '100%',
                    textAlign: 'center'
                  }}
                >
                  Insert Template
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

