/**
 * ============================================================================
 * ROOT APPLICATION COMPONENT
 * ============================================================================
 * Coordinates the WhiteboardProvider context, Canvas viewport,
 * Header, Toolbar, Properties Panel, and Dialog Modals.
 */

import React, { useRef, useState } from 'react';
import { WhiteboardProvider } from './context/WhiteboardContext.jsx';
import { Canvas } from './components/Canvas.jsx';
import { Header } from './components/Header.jsx';
import { Toolbar } from './components/Toolbar.jsx';
import { PropertiesPanel } from './components/PropertiesPanel.jsx';
import { TemplateModal } from './components/TemplateModal.jsx';
import { TimerModal } from './components/TimerModal.jsx';

export default function App() {
  const canvasRef = useRef(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);

  return (
    <WhiteboardProvider>
      <div
        className="app-root"
        style={{
          width: '100vw',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Semantic Header Controls */}
        <Header
          canvasRef={canvasRef}
          onOpenTemplates={() => setIsTemplatesOpen(true)}
          onOpenTimer={() => setIsTimerOpen(true)}
        />

        {/* Floating Contextual Properties Panel */}
        <PropertiesPanel />

        {/* Infinite Canvas 2D Viewport */}
        <Canvas canvasRef={canvasRef} />

        {/* Semantic Bottom Drawing Toolbar */}
        <Toolbar />

        {/* Pre-built Templates Picker Modal */}
        <TemplateModal
          isOpen={isTemplatesOpen}
          onClose={() => setIsTemplatesOpen(false)}
        />

        {/* Collaborative Timer Modal */}
        <TimerModal
          isOpen={isTimerOpen}
          onClose={() => setIsTimerOpen(false)}
        />
      </div>
    </WhiteboardProvider>
  );
}

