/**
 * ============================================================================
 * HEADER NAVIGATION & WORKSPACE CONTROLS
 * ============================================================================
 * Semantic <header> containing board title rename, collaboration controls,
 * timer widget, templates modal, export actions, and zoom levels.
 */

import React, { useState } from 'react';
import { useWhiteboard } from '../context/WhiteboardContext.jsx';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sun,
  Moon,
  Download,
  Upload,
  LayoutTemplate,
  Timer,
  Presentation,
  Users,
  Share2
} from 'lucide-react';

export function Header({ canvasRef, onOpenTemplates, onOpenTimer }) {
  const {
    boardTitle,
    setBoardTitle,
    boardId,
    currentUser,
    remoteUsers,
    theme,
    toggleTheme,
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    undo,
    redo,
    canUndo,
    canRedo,
    exportAsPNG,
    exportAsSVG,
    exportAsJSON,
    importFromJSON,
    timerSeconds,
    isTimerRunning,
    isPresenting,
    setIsPresenting,
    activePresenter,
    isFollowingPresenter,
    setIsFollowingPresenter
  } = useWhiteboard();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Format timer MM:SS
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const handleShareBoard = () => {
    const shareUrl = `${window.location.origin}?board=${boardId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      importFromJSON(event.target?.result);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header
      style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
        pointerEvents: 'none' // Allow canvas clicks to pass through empty regions
      }}
    >
      {/* Left Island: Brand Logo, Title & History */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          background: 'var(--bg-surface)',
          padding: 'var(--space-1) var(--space-2)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-color)',
          pointerEvents: 'auto'
        }}
      >
        {/* App Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            fontWeight: 700,
            fontSize: '15px',
            color: 'var(--accent-primary)',
            paddingRight: 'var(--space-1)',
            borderRight: '1px solid var(--border-color)'
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800
            }}
          >
            CF
          </div>
          <span>CanvasFlow</span>
        </div>

        {/* Board Title (Editable) */}
        {isEditingTitle ? (
          <input
            autoFocus
            type="text"
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            style={{
              fontSize: '14px',
              fontWeight: 600,
              padding: '2px 6px',
              border: '1px solid var(--accent-primary)',
              borderRadius: '4px',
              background: 'transparent',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        ) : (
          <h1
            onClick={() => setIsEditingTitle(true)}
            title="Click to rename board"
            style={{
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px',
              color: 'var(--text-primary)',
              maxWidth: '220px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {boardTitle}
          </h1>
        )}

        {/* Undo / Redo */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: 'var(--space-1)' }}>
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            style={{
              padding: '6px',
              borderRadius: '4px',
              color: canUndo ? 'var(--text-primary)' : 'var(--text-muted)',
              opacity: canUndo ? 1 : 0.4
            }}
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
            style={{
              padding: '6px',
              borderRadius: '4px',
              color: canRedo ? 'var(--text-primary)' : 'var(--text-muted)',
              opacity: canRedo ? 1 : 0.4
            }}
          >
            <Redo2 size={16} />
          </button>
        </div>
      </div>

      {/* Center Island: Collaboration & Tools */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          background: 'var(--bg-surface)',
          padding: 'var(--space-1)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-color)',
          pointerEvents: 'auto'
        }}
      >
        {/* Templates Button */}
        <button
          onClick={onOpenTemplates}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 500,
            background: 'var(--bg-surface-elevated)',
            color: 'var(--text-primary)'
          }}
        >
          <LayoutTemplate size={16} color="var(--accent-primary)" />
          <span>Templates</span>
        </button>

        {/* Collaborative Timer Widget Button */}
        <button
          onClick={onOpenTimer}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 600,
            background: isTimerRunning ? 'var(--danger-subtle)' : 'var(--bg-surface-elevated)',
            color: isTimerRunning ? 'var(--danger)' : 'var(--text-primary)'
          }}
        >
          <Timer size={16} color={isTimerRunning ? 'var(--danger)' : 'var(--accent-primary)'} />
          <span>{formattedTime}</span>
        </button>

        {/* Presentation Mode Toggle */}
        <button
          onClick={() => setIsPresenting(p => !p)}
          title="Toggle Presentation Follow Mode"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 500,
            background: isPresenting ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
            color: isPresenting ? '#ffffff' : 'var(--text-primary)'
          }}
        >
          <Presentation size={16} />
          <span>{isPresenting ? 'Presenting' : 'Present'}</span>
        </button>

        {/* Remote Presenter Following Banner */}
        {activePresenter && !isPresenting && (
          <button
            onClick={() => setIsFollowingPresenter(f => !f)}
            title="Toggle following presenter viewport camera"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              background: isFollowingPresenter ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
              color: isFollowingPresenter ? '#ffffff' : 'var(--text-primary)',
              border: '1px solid var(--accent-border)'
            }}
          >
            <span>{isFollowingPresenter ? `Following ${activePresenter}` : `Follow ${activePresenter}`}</span>
          </button>
        )}
      </div>

      {/* Right Island: Zoom, Export, Theme, Team */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          background: 'var(--bg-surface)',
          padding: 'var(--space-1)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-color)',
          pointerEvents: 'auto',
          position: 'relative'
        }}
      >
        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            onClick={zoomOut}
            title="Zoom Out"
            style={{ padding: '6px', borderRadius: '4px', color: 'var(--text-primary)' }}
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={resetZoom}
            title="Reset Zoom to 100%"
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 600,
              minWidth: '48px',
              color: 'var(--text-primary)'
            }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={zoomIn}
            title="Zoom In"
            style={{ padding: '6px', borderRadius: '4px', color: 'var(--text-primary)' }}
          >
            <ZoomIn size={16} />
          </button>
        </div>

        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

        {/* Export Dropdown Trigger */}
        <button
          onClick={() => setShowExportMenu(m => !m)}
          title="Export Workspace"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 500,
            background: 'var(--bg-surface-elevated)',
            color: 'var(--text-primary)'
          }}
        >
          <Download size={15} />
          <span>Export</span>
        </button>

        {/* Export Menu Popover */}
        {showExportMenu && (
          <div
            style={{
              position: 'absolute',
              top: '48px',
              right: '48px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: 'var(--space-1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '160px',
              zIndex: 100
            }}
          >
            <button
              onClick={() => {
                exportAsPNG(canvasRef);
                setShowExportMenu(false);
              }}
              style={{
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                borderRadius: '4px'
              }}
            >
              Export as PNG Image
            </button>
            <button
              onClick={() => {
                exportAsSVG();
                setShowExportMenu(false);
              }}
              style={{
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                borderRadius: '4px'
              }}
            >
              Export as Scalable SVG
            </button>
            <button
              onClick={() => {
                exportAsJSON();
                setShowExportMenu(false);
              }}
              style={{
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                borderRadius: '4px'
              }}
            >
              Export as JSON Backup
            </button>
            <label
              style={{
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'block'
              }}
            >
              Import JSON File
              <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {/* Share Board Button */}
        <button
          onClick={handleShareBoard}
          title="Copy Live Board Collaboration URL"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 600,
            background: copiedLink ? 'var(--success)' : 'var(--accent-subtle)',
            color: copiedLink ? '#ffffff' : 'var(--accent-primary)',
            border: '1px solid var(--accent-border)'
          }}
        >
          <Share2 size={15} />
          <span>{copiedLink ? 'Copied URL!' : 'Share'}</span>
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          style={{ padding: '6px', borderRadius: '4px', color: 'var(--text-primary)' }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Real-Time Collaborators Presence Avatars */}
        <div
          title={`Active Collaborators (${Object.keys(remoteUsers || {}).length + 1} online)`}
          style={{
            display: 'flex',
            alignItems: 'center',
            marginLeft: '4px'
          }}
        >
          {/* Current Local User */}
          <div
            title={`You (${currentUser?.name || 'Local User'})`}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: currentUser?.color || '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              border: '2px solid var(--bg-surface)'
            }}
          >
            YOU
          </div>

          {/* Connected Remote Teammates */}
          {Object.entries(remoteUsers || {}).map(([sId, u], idx) => {
            const initials = (u.name || 'AN')
              .split(' ')
              .map(n => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();

            return (
              <div
                key={sId}
                title={`Teammate: ${u.name || 'Collaborator'}`}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: u.color || '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  marginLeft: '-8px',
                  border: '2px solid var(--bg-surface)'
                }}
              >
                {initials}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}

