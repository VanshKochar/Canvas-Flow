/**
 * ============================================================================
 * SOCKET.IO CLIENT NETWORKING SERVICE
 * ============================================================================
 * Manages WebSocket connection lifecycle, auto-reconnection with exponential
 * backoff, room subscription, and multiplexed event subscriptions.
 */

import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(boardId, user) {
    if (this.socket) {
      if (this.isConnected) {
        this.joinBoard(boardId, user);
        return this.socket;
      }
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('⚡ Connected to Real-Time Collaboration Gateway:', this.socket.id);
      this.joinBoard(boardId, user);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.warn('🔌 Disconnected from Real-Time Gateway:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('⚠️ Real-Time connection error (operating in offline/local mode):', err.message);
    });

    return this.socket;
  }

  joinBoard(boardId, user) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('board:join', { boardId, user });
  }

  emitCursorMove(boardId, x, y) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('cursor:move', { x, y });
  }

  emitElementCreate(boardId, element) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('element:create', { element });
  }

  emitElementUpdate(boardId, elementId, updates) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('element:update', { elementId, updates });
  }

  emitElementDelete(boardId, elementIds) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('element:delete', { elementIds });
  }

  emitElementLock(boardId, elementId) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('element:lock', { elementId });
  }

  emitElementUnlock(boardId, elementId) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('element:unlock', { elementId });
  }

  emitTimerSync(boardId, timerData) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('timer:sync', timerData);
  }

  emitPresentViewport(boardId, viewport) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('present:viewport', viewport);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const socketService = new SocketService();

