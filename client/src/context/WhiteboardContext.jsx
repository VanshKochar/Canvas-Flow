/**
 * ============================================================================
 * WHITEBOARD STATE CONTEXT & STORE (WITH MULTIPLAYER SYNC)
 * ============================================================================
 * Centralized state container managing elements, selection, camera pan/zoom,
 * active tool properties, undo/redo history, collaborative timer, and
 * full-duplex WebSocket real-time synchronization.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { calculateZoomAtPoint } from '../utils/canvasMath.js';
import { TEMPLATES } from '../data/templates.js';
import { socketService } from '../services/socket.js';
import { exportBoardAsSVG } from '../utils/svgExporter.js';

const WhiteboardContext = createContext(null);

export function WhiteboardProvider({ children }) {
  // Theme State (persisted in localStorage)
  const [theme, setTheme] = useState(() => localStorage.getItem('canvasflow-theme') || 'light');

  // Board Metadata
  const [boardTitle, setBoardTitle] = useState('Untitled Workspace');
  const [boardId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('board') || 'board-' + Math.random().toString(36).substring(2, 9);
  });

  // Current Local User Profile (Random avatar & color for demo multiplayer)
  const [currentUser] = useState(() => {
    const id = 'usr_' + Math.random().toString(36).substring(2, 8);
    const names = ['Alex Chen', 'Sarah Miller', 'David Kim', 'Elena Rostova', 'Kenji Sato', 'Priya Patel'];
    const colors = ['#2563eb', '#10b981', '#ec4899', '#8b5cf6', '#f59e0b', '#06b6d4'];
    const name = names[Math.floor(Math.random() * names.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return { id, name, color };
  });

  // Camera Viewport State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);
  const [gridVisible, setGridVisible] = useState(true);

  // Active Tool & Styling Properties
  const [activeTool, setActiveTool] = useState('select');
  const [strokeColor, setStrokeColor] = useState('#2563eb');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeStyle, setStrokeStyle] = useState('solid'); // 'solid' | 'dashed' | 'dotted'
  const [fontSize, setFontSize] = useState(18);
  const [activeEmoji, setActiveEmoji] = useState('🚀');
  const [stickyColor, setStickyColor] = useState('#fef08a');

  // Elements & Selection State
  const [elements, setElements] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // Undo / Redo Command Pattern Stack
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Collaborative Timer State
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 min default
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Presentation Mode & Following State
  const [isPresenting, setIsPresenting] = useState(false);
  const [isFollowingPresenter, setIsFollowingPresenter] = useState(true);
  const [activePresenter, setActivePresenter] = useState(null);

  // Real-Time Multiplayer Users & Object Locks
  const [remoteUsers, setRemoteUsers] = useState({});
  const [activeLocks, setActiveLocks] = useState({});

  // Sync theme to root DOM element attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('canvasflow-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Initialize Real-Time WebSocket Connection & Event Listeners
  useEffect(() => {
    const socket = socketService.connect(boardId, currentUser);

    socket.on('board:init', ({ users, locks }) => {
      setRemoteUsers(users || {});
      setActiveLocks(locks || {});
    });

    socket.on('user:joined', ({ socketId, user }) => {
      setRemoteUsers(prev => ({ ...prev, [socketId]: user }));
    });

    socket.on('user:left', ({ socketId }) => {
      setRemoteUsers(prev => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });

    socket.on('cursor:update', ({ socketId, user }) => {
      setRemoteUsers(prev => ({
        ...prev,
        [socketId]: user
      }));
    });

    socket.on('element:created', ({ element }) => {
      setElements(prev => {
        if (prev.some(el => el.id === element.id)) return prev;
        return [...prev, element];
      });
    });

    socket.on('element:updated', ({ elementId, updates }) => {
      setElements(prev => prev.map(el => (el.id === elementId ? { ...el, ...updates } : el)));
    });

    socket.on('element:deleted', ({ elementIds }) => {
      setElements(prev => prev.filter(el => !elementIds.includes(el.id)));
    });

    socket.on('element:locked', ({ elementId, lockedBy }) => {
      setActiveLocks(prev => ({ ...prev, [elementId]: lockedBy }));
    });

    socket.on('element:unlocked', ({ elementId }) => {
      setActiveLocks(prev => {
        const next = { ...prev };
        delete next[elementId];
        return next;
      });
    });

    socket.on('timer:synced', ({ seconds, isRunning }) => {
      setTimerSeconds(seconds);
      setIsTimerRunning(isRunning);
    });

    socket.on('present:synced', ({ presenter, panX, panY, zoom: pZoom }) => {
      setActivePresenter(presenter);
      if (isFollowingPresenter) {
        setPan({ x: panX, y: panY });
        setZoom(pZoom);
      }
    });

    return () => {
      socketService.disconnect();
    };
  }, [boardId, currentUser, isFollowingPresenter]);

  // Broadcast presentation camera when local user is presenter
  useEffect(() => {
    if (isPresenting) {
      socketService.emitPresentViewport(boardId, {
        panX: pan.x,
        panY: pan.y,
        zoom
      });
    }
  }, [isPresenting, pan, zoom, boardId]);

  // Push new state snapshot into history stack & broadcast to socket
  const commitElements = useCallback((newElements, broadcastType = null, payload = null) => {
    setElements(newElements);
    setHistory(prev => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, newElements];
    });
    setHistoryIndex(prev => prev + 1);

    // Broadcast change to remote collaborators
    if (broadcastType === 'create' && payload) {
      socketService.emitElementCreate(boardId, payload);
    } else if (broadcastType === 'update' && payload) {
      socketService.emitElementUpdate(boardId, payload.id, payload.updates);
    } else if (broadcastType === 'delete' && payload) {
      socketService.emitElementDelete(boardId, payload);
    }
  }, [historyIndex, boardId]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      setSelectedIds([]);
    }
  }, [historyIndex, history]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      setSelectedIds([]);
    }
  }, [historyIndex, history]);

  // Zoom helpers
  const zoomIn = useCallback(() => {
    const windowCenterX = window.innerWidth / 2;
    const windowCenterY = window.innerHeight / 2;
    setZoom(prevZoom => {
      const nextZoom = Math.min(prevZoom * 1.25, 30.0);
      setPan(prevPan => calculateZoomAtPoint(nextZoom, windowCenterX, windowCenterY, prevPan, prevZoom));
      return nextZoom;
    });
  }, []);

  const zoomOut = useCallback(() => {
    const windowCenterX = window.innerWidth / 2;
    const windowCenterY = window.innerHeight / 2;
    setZoom(prevZoom => {
      const nextZoom = Math.max(prevZoom / 1.25, 0.1);
      setPan(prevPan => calculateZoomAtPoint(nextZoom, windowCenterX, windowCenterY, prevPan, prevZoom));
      return nextZoom;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  // Delete selected elements
  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const updated = elements.filter(el => !selectedIds.includes(el.id));
    commitElements(updated, 'delete', selectedIds);
    setSelectedIds([]);
  }, [selectedIds, elements, commitElements]);

  // Load pre-built template
  const loadTemplate = useCallback((templateId) => {
    const tmpl = TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return;
    const newItems = tmpl.generateElements(100 - pan.x, 100 - pan.y);
    commitElements([...elements, ...newItems]);
    newItems.forEach(item => {
      socketService.emitElementCreate(boardId, item);
    });
  }, [elements, pan, commitElements, boardId]);

  // Broadcast timer changes
  const updateTimer = useCallback((seconds, isRunning) => {
    setTimerSeconds(seconds);
    setIsTimerRunning(isRunning);
    socketService.emitTimerSync(boardId, { seconds, isRunning });
  }, [boardId]);

  // Export board as PNG image
  const exportAsPNG = useCallback((canvasRef) => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${boardTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }, [boardTitle]);

  // Export board as Vector SVG
  const exportAsSVG = useCallback(() => {
    const svgString = exportBoardAsSVG(elements, boardTitle);
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${boardTitle.toLowerCase().replace(/\s+/g, '-')}.svg`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [boardTitle, elements]);

  // Export board as JSON backup
  const exportAsJSON = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({ title: boardTitle, version: 1, elements }, null, 2)
    );
    const link = document.createElement('a');
    link.download = `${boardTitle.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.href = dataStr;
    link.click();
  }, [boardTitle, elements]);

  // Import board from JSON file
  const importFromJSON = useCallback((jsonData) => {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (parsed.elements && Array.isArray(parsed.elements)) {
        if (parsed.title) setBoardTitle(parsed.title);
        commitElements(parsed.elements);
        parsed.elements.forEach(item => {
          socketService.emitElementCreate(boardId, item);
        });
      }
    } catch (err) {
      console.error('Failed to parse board JSON:', err);
    }
  }, [commitElements, boardId]);

  // Timer Tick Interval
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
        osc.stop(audioCtx.currentTime + 1.2);
      } catch (e) {
        // AudioContext silent fallback
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const value = {
    theme,
    toggleTheme,
    boardTitle,
    setBoardTitle,
    boardId,
    currentUser,
    pan,
    setPan,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    gridVisible,
    setGridVisible,
    activeTool,
    setActiveTool,
    strokeColor,
    setStrokeColor,
    fillColor,
    setFillColor,
    strokeWidth,
    setStrokeWidth,
    strokeStyle,
    setStrokeStyle,
    fontSize,
    setFontSize,
    activeEmoji,
    setActiveEmoji,
    stickyColor,
    setStickyColor,
    elements,
    setElements,
    commitElements,
    selectedIds,
    setSelectedIds,
    deleteSelected,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    loadTemplate,
    exportAsPNG,
    exportAsSVG,
    exportAsJSON,
    importFromJSON,
    timerSeconds,
    setTimerSeconds,
    isTimerRunning,
    setIsTimerRunning,
    updateTimer,
    isPresenting,
    setIsPresenting,
    isFollowingPresenter,
    setIsFollowingPresenter,
    activePresenter,
    remoteUsers,
    activeLocks,
    socketService
  };

  return (
    <WhiteboardContext.Provider value={value}>
      {children}
    </WhiteboardContext.Provider>
  );
}

export function useWhiteboard() {
  const ctx = useContext(WhiteboardContext);
  if (!ctx) throw new Error('useWhiteboard must be used within a WhiteboardProvider');
  return ctx;
}
