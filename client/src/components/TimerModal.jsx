/**
 * ============================================================================
 * COLLABORATIVE TIMER MODAL
 * ============================================================================
 * Synchronized countdown timer for time-boxed sprint ceremonies,
 * lightning talks, and ideation sessions.
 */

import React from 'react';
import { useWhiteboard } from '../context/WhiteboardContext.jsx';
import { X, Play, Pause, RotateCcw, Clock } from 'lucide-react';

export function TimerModal({ isOpen, onClose }) {
  const { timerSeconds, setTimerSeconds, isTimerRunning, setIsTimerRunning, updateTimer } = useWhiteboard();

  if (!isOpen) return null;

  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const setPreset = (seconds) => {
    updateTimer(seconds, false);
  };

  const handleToggleTimer = () => {
    updateTimer(timerSeconds, !isTimerRunning);
  };

  const handleReset = () => {
    updateTimer(300, false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="timer-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100
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
          width: '320px',
          padding: 'var(--space-3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-2)'
        }}
      >
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={18} color="var(--accent-primary)" />
            <h2 id="timer-modal-title" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Team Timer
            </h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Large Digital Clock Face */}
        <div
          style={{
            fontSize: '44px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: isTimerRunning ? 'var(--accent-primary)' : 'var(--text-primary)',
            padding: 'var(--space-2) 0',
            letterSpacing: '2px'
          }}
        >
          {formattedTime}
        </div>

        {/* Primary Controls */}
        <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
          <button
            onClick={handleToggleTimer}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 24px',
              borderRadius: 'var(--radius-md)',
              background: isTimerRunning ? 'var(--warning)' : 'var(--accent-primary)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
            <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
          </button>
          <button
            onClick={handleReset}
            title="Reset to 5m"
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{ width: '100%', marginTop: 'var(--space-1)' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textAlign: 'center' }}>
            QUICK PRESETS
          </label>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
            {[
              { label: '1m', sec: 60 },
              { label: '3m', sec: 180 },
              { label: '5m', sec: 300 },
              { label: '10m', sec: 600 },
              { label: '15m', sec: 900 }
            ].map(p => (
              <button
                key={p.label}
                onClick={() => setPreset(p.sec)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

