/**
 * ============================================================================
 * INTERACTIVE WHITEBOARD CANVAS COMPONENT
 * ============================================================================
 * Handles user input (pointer, wheel, keyboard), coordinate mapping,
 * drafting shapes, dragging, connector snapping, and inline text editing.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWhiteboard } from '../context/WhiteboardContext.jsx';
import { renderCanvas } from '../engine/renderer.js';
import {
  screenToWorld,
  worldToScreen,
  calculateZoomAtPoint,
  normalizeRect,
  isPointInRect,
  isPointInEllipse,
  isPointInDiamond,
  isPointInFreehandStroke,
  distanceToSegment,
  findNearestAnchor
} from '../utils/canvasMath.js';

export function Canvas({ canvasRef }) {
  const {
    boardId,
    pan,
    setPan,
    zoom,
    setZoom,
    activeTool,
    setActiveTool,
    strokeColor,
    fillColor,
    strokeWidth,
    strokeStyle,
    fontSize,
    activeEmoji,
    stickyColor,
    elements,
    commitElements,
    selectedIds,
    setSelectedIds,
    deleteSelected,
    undo,
    redo,
    gridVisible,
    theme,
    remoteUsers,
    activeLocks,
    socketService
  } = useWhiteboard();

  // Interaction State
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [activeDraft, setActiveDraft] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [snapPoint, setSnapPoint] = useState(null);

  // Throttling and Lock Refs for Real-Time Multiplayer
  const lastCursorEmitRef = useRef(0);
  const lastElementEmitRef = useRef(0);
  const lockedIdRef = useRef(null);

  // Inline Text Editor State (for sticky notes, shapes & text)
  const [editingElement, setEditingElement] = useState(null);

  // Drag tracking refs (avoiding stale closures in animation loops)
  const dragStartRef = useRef({ screenX: 0, screenY: 0, worldX: 0, worldY: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const dragElementsRef = useRef([]);

  // Resize canvas to full window with Retina DPR
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }, [canvasRef]);

  // Window resize listener
  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Main 60fps Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      renderCanvas(ctx, canvas, {
        pan,
        zoom,
        elements,
        selectedIds,
        activeDraft,
        selectionBox,
        snapPoint,
        remoteUsers,
        activeLocks,
        gridVisible,
        theme
      });
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [canvasRef, pan, zoom, elements, selectedIds, activeDraft, selectionBox, snapPoint, remoteUsers, activeLocks, gridVisible, theme]);

  // Keyboard Shortcuts (Space pan, Delete, Undo/Redo, Tool shortcuts)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore shortcuts if user is typing in inline editor or input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space' && !spacePressed) {
        setSpacePressed(true);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape') {
        setActiveTool('select');
        setSelectedIds([]);
        setActiveDraft(null);
        setEditingElement(null);
      } else if (e.key === 'v') setActiveTool('select');
      else if (e.key === 'r') setActiveTool('rectangle');
      else if (e.key === 'o') setActiveTool('ellipse');
      else if (e.key === 'd') setActiveTool('diamond');
      else if (e.key === 's') setActiveTool('sticky');
      else if (e.key === 'p') setActiveTool('pen');
      else if (e.key === 'c') setActiveTool('connector');
      else if (e.key === 't') setActiveTool('text');
      else if (e.key === 'e') setActiveTool('eraser');
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressed, deleteSelected, undo, redo, setActiveTool, setSelectedIds]);

  // Hit-Testing: Find element under world coordinate
  const findElementAtPosition = useCallback((worldX, worldY) => {
    // Scan backwards so top-most elements are selected first
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.type === 'rectangle' || el.type === 'sticky' || el.type === 'text') {
        if (isPointInRect(worldX, worldY, el)) return el;
      } else if (el.type === 'ellipse') {
        if (isPointInEllipse(worldX, worldY, el)) return el;
      } else if (el.type === 'diamond') {
        if (isPointInDiamond(worldX, worldY, el)) return el;
      } else if (el.type === 'pen') {
        if (isPointInFreehandStroke(worldX, worldY, el.points, el.strokeWidth)) return el;
      } else if (el.type === 'connector') {
        const dist = distanceToSegment(worldX, worldY, el.startX, el.startY, el.endX, el.endY);
        if (dist <= Math.max(el.strokeWidth * 2, 8)) return el;
      } else if (el.type === 'stamp') {
        if (isPointInRect(worldX, worldY, { x: el.x, y: el.y, width: el.width || 40, height: el.height || 40 })) return el;
      }
    }
    return null;
  }, [elements]);

  // Pointer Down Handler
  const handlePointerDown = (e) => {
    if (editingElement) {
      setEditingElement(null);
    }

    const screenX = e.clientX;
    const screenY = e.clientY;
    const { x: worldX, y: worldY } = screenToWorld(screenX, screenY, pan.x, pan.y, zoom);

    setIsPointerDown(true);
    dragStartRef.current = { screenX, screenY, worldX, worldY };
    panStartRef.current = { ...pan };

    // Pan with middle mouse button or holding Space
    if (e.button === 1 || spacePressed) {
      setIsPanning(true);
      return;
    }

    // Left Click Actions
    if (e.button === 0) {
      if (activeTool === 'select') {
        const hit = findElementAtPosition(worldX, worldY);
        if (hit) {
          if (!selectedIds.includes(hit.id)) {
            setSelectedIds([hit.id]);
          }
          lockedIdRef.current = hit.id;
          socketService.emitElementLock(boardId, hit.id);
          // Snapshot selected elements positions before drag
          const selectedEls = elements.filter(el => selectedIds.includes(el.id) || el.id === hit.id);
          dragElementsRef.current = selectedEls.map(el => ({ ...el }));
        } else {
          // Clicked empty canvas: clear selection and start marquee drag
          setSelectedIds([]);
          setSelectionBox({ x: worldX, y: worldY, width: 0, height: 0 });
        }
      } else if (activeTool === 'eraser') {
        const hit = findElementAtPosition(worldX, worldY);
        if (hit) {
          commitElements(elements.filter(el => el.id !== hit.id), 'delete', [hit.id]);
        }
      } else if (['rectangle', 'ellipse', 'diamond'].includes(activeTool)) {
        setActiveDraft({
          id: 'draft-' + Date.now(),
          type: activeTool,
          x: worldX,
          y: worldY,
          width: 0,
          height: 0,
          strokeColor,
          fillColor,
          strokeWidth,
          strokeStyle,
          borderRadius: 8
        });
      } else if (activeTool === 'sticky') {
        const newSticky = {
          id: 'sticky-' + Date.now(),
          type: 'sticky',
          x: worldX - 100,
          y: worldY - 70,
          width: 200,
          height: 140,
          fillColor: stickyColor,
          textColor: '#1e293b',
          text: 'New Idea...',
          fontSize: 16
        };
        commitElements([...elements, newSticky], 'create', newSticky);
        setSelectedIds([newSticky.id]);
        setActiveTool('select');
      } else if (activeTool === 'pen') {
        setActiveDraft({
          id: 'pen-' + Date.now(),
          type: 'pen',
          points: [{ x: worldX, y: worldY }],
          strokeColor,
          strokeWidth,
          strokeStyle: 'solid'
        });
      } else if (activeTool === 'connector') {
        // Detect snap point at start
        const nearest = findNearestAnchor(worldX, worldY, elements);
        const startX = nearest ? nearest.x : worldX;
        const startY = nearest ? nearest.y : worldY;

        setActiveDraft({
          id: 'conn-' + Date.now(),
          type: 'connector',
          startX,
          startY,
          endX: startX,
          endY: startY,
          strokeColor,
          strokeWidth,
          strokeStyle
        });
      } else if (activeTool === 'text') {
        const newText = {
          id: 'text-' + Date.now(),
          type: 'text',
          x: worldX,
          y: worldY,
          text: 'Type text here...',
          fontSize,
          textColor: strokeColor
        };
        commitElements([...elements, newText], 'create', newText);
        setSelectedIds([newText.id]);
        setEditingElement(newText);
        setActiveTool('select');
      } else if (activeTool === 'stamp') {
        const newStamp = {
          id: 'stamp-' + Date.now(),
          type: 'stamp',
          x: worldX - 20,
          y: worldY - 20,
          width: 40,
          height: 40,
          emoji: activeEmoji,
          fontSize: 32
        };
        commitElements([...elements, newStamp], 'create', newStamp);
        setSelectedIds([newStamp.id]);
      }
    }
  };

  // Pointer Move Handler
  const handlePointerMove = (e) => {
    const screenX = e.clientX;
    const screenY = e.clientY;
    const { x: worldX, y: worldY } = screenToWorld(screenX, screenY, pan.x, pan.y, zoom);

    // Throttle cursor broadcast to 30ms (~33 updates/sec)
    const now = Date.now();
    if (now - lastCursorEmitRef.current > 30) {
      socketService.emitCursorMove(boardId, worldX, worldY);
      lastCursorEmitRef.current = now;
    }

    if (isPanning) {
      const deltaX = screenX - dragStartRef.current.screenX;
      const deltaY = screenY - dragStartRef.current.screenY;
      setPan({
        x: panStartRef.current.x + deltaX,
        y: panStartRef.current.y + deltaY
      });
      return;
    }

    if (!isPointerDown) return;

    // Moving selected elements
    if (activeTool === 'select' && dragElementsRef.current.length > 0) {
      const deltaWorldX = worldX - dragStartRef.current.worldX;
      const deltaWorldY = worldY - dragStartRef.current.worldY;

      // Throttle real-time dragged updates to peers
      if (now - lastElementEmitRef.current > 40) {
        dragElementsRef.current.forEach(initial => {
          socketService.emitElementUpdate(boardId, initial.id, {
            x: initial.x + deltaWorldX,
            y: initial.y + deltaWorldY
          });
        });
        lastElementEmitRef.current = now;
      }

      const updated = elements.map(el => {
        const initial = dragElementsRef.current.find(d => d.id === el.id);
        if (initial) {
          if (el.type === 'connector') {
            return {
              ...el,
              startX: initial.startX + deltaWorldX,
              startY: initial.startY + deltaWorldY,
              endX: initial.endX + deltaWorldX,
              endY: initial.endY + deltaWorldY
            };
          }
          return {
            ...el,
            x: initial.x + deltaWorldX,
            y: initial.y + deltaWorldY
          };
        }
        return el;
      });
      setElements(updated);
      return;
    }

    // Dragging selection marquee box
    if (activeTool === 'select' && selectionBox) {
      const normalized = normalizeRect(dragStartRef.current.worldX, dragStartRef.current.worldY, worldX, worldY);
      setSelectionBox(normalized);
      return;
    }

    // Drafting shapes (Rectangle, Ellipse, Diamond)
    if (activeDraft && ['rectangle', 'ellipse', 'diamond'].includes(activeDraft.type)) {
      const normalized = normalizeRect(dragStartRef.current.worldX, dragStartRef.current.worldY, worldX, worldY);
      setActiveDraft(prev => ({
        ...prev,
        ...normalized
      }));
      return;
    }

    // Drafting freehand pen
    if (activeDraft && activeDraft.type === 'pen') {
      setActiveDraft(prev => ({
        ...prev,
        points: [...prev.points, { x: worldX, y: worldY }]
      }));
      return;
    }

    // Drafting dynamic connector with snap detection
    if (activeDraft && activeDraft.type === 'connector') {
      const nearest = findNearestAnchor(worldX, worldY, elements);
      setSnapPoint(nearest);
      const targetX = nearest ? nearest.x : worldX;
      const targetY = nearest ? nearest.y : worldY;

      setActiveDraft(prev => ({
        ...prev,
        endX: targetX,
        endY: targetY
      }));
      return;
    }
  };

  // Pointer Up Handler
  const handlePointerUp = () => {
    setIsPointerDown(false);
    setIsPanning(false);
    setSnapPoint(null);

    // Release active lock held by this user
    if (lockedIdRef.current) {
      socketService.emitElementUnlock(boardId, lockedIdRef.current);
      lockedIdRef.current = null;
    }

    // Commit moved elements and broadcast final state to peers
    if (dragElementsRef.current.length > 0) {
      commitElements(elements);
      dragElementsRef.current.forEach(initial => {
        const final = elements.find(el => el.id === initial.id);
        if (final) {
          socketService.emitElementUpdate(boardId, final.id, final);
        }
      });
      dragElementsRef.current = [];
    }

    // Commit Marquee selection
    if (selectionBox) {
      const inBox = elements.filter(el => {
        return (
          el.x >= selectionBox.x &&
          el.x + (el.width || 0) <= selectionBox.x + selectionBox.width &&
          el.y >= selectionBox.y &&
          el.y + (el.height || 0) <= selectionBox.y + selectionBox.height
        );
      });
      setSelectedIds(inBox.map(el => el.id));
      setSelectionBox(null);
    }

    // Commit drafted shape & broadcast to remote collaborators
    if (activeDraft) {
      if (activeDraft.type === 'pen' && activeDraft.points.length > 1) {
        commitElements([...elements, activeDraft], 'create', activeDraft);
      } else if (activeDraft.type === 'connector') {
        const len = Math.hypot(activeDraft.endX - activeDraft.startX, activeDraft.endY - activeDraft.startY);
        if (len > 10) commitElements([...elements, activeDraft], 'create', activeDraft);
      } else if (activeDraft.width > 5 && activeDraft.height > 5) {
        commitElements([...elements, activeDraft], 'create', activeDraft);
        setSelectedIds([activeDraft.id]);
        setActiveTool('select');
      }
      setActiveDraft(null);
    }
  };

  // Mouse Wheel: Smooth Zoom Anchored at Cursor & 2D Trackpad Panning
  const handleWheel = (e) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom with cursor anchoring
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      const targetZoom = zoom * zoomFactor;
      const newCamera = calculateZoomAtPoint(targetZoom, e.clientX, e.clientY, pan, zoom);
      setPan({ x: newCamera.panX, y: newCamera.panY });
      setZoom(newCamera.zoom);
    } else {
      // Trackpad 2-finger Pan
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  // Double click to edit sticky note or shape text
  const handleDoubleClick = (e) => {
    const { x: worldX, y: worldY } = screenToWorld(e.clientX, e.clientY, pan.x, pan.y, zoom);
    const hit = findElementAtPosition(worldX, worldY);
    if (hit && ['sticky', 'text', 'rectangle', 'ellipse', 'diamond'].includes(hit.type)) {
      setEditingElement(hit);
    }
  };

  // Compute screen coordinates for inline editor overlay
  const editorScreenPos = editingElement ? worldToScreen(editingElement.x, editingElement.y, pan.x, pan.y, zoom) : null;

  return (
    <main
      className="canvas-container"
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        cursor: isPanning || spacePressed ? 'grab' : activeTool === 'select' ? 'default' : 'crosshair'
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        style={{ display: 'block', touchAction: 'none' }}
      />

      {/* Inline Text Overlay Editor for Seamless In-Place Editing */}
      {editingElement && editorScreenPos && (
        <textarea
          autoFocus
          defaultValue={editingElement.text || ''}
          onBlur={(e) => {
            const updated = elements.map(el => (el.id === editingElement.id ? { ...el, text: e.target.value } : el));
            commitElements(updated);
            setEditingElement(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.target.blur();
            }
          }}
          style={{
            position: 'absolute',
            left: `${editorScreenPos.x}px`,
            top: `${editorScreenPos.y}px`,
            width: `${Math.max((editingElement.width || 160) * zoom, 140)}px`,
            height: `${Math.max((editingElement.height || 100) * zoom, 60)}px`,
            fontSize: `${(editingElement.fontSize || 16) * zoom}px`,
            fontFamily: editingElement.type === 'sticky' ? 'Caveat, cursive' : 'Inter, sans-serif',
            color: editingElement.textColor || '#0f172a',
            background: editingElement.fillColor && editingElement.fillColor !== 'transparent' ? editingElement.fillColor : 'rgba(255, 255, 255, 0.95)',
            border: '2px dashed var(--accent-primary)',
            borderRadius: '4px',
            padding: '8px',
            resize: 'none',
            outline: 'none',
            zIndex: 100
          }}
        />
      )}
    </main>
  );
}

