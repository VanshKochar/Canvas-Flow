/**
 * ============================================================================
 * SOCKET.IO REAL-TIME COLLABORATION HANDLER
 * ============================================================================
 * Handles room multiplexing, live cursor streaming, element mutation broadcasts,
 * element locking, and presence heartbeat.
 */

// Active rooms state in memory: { [boardId]: { users: Map, locks: Map } }
const activeRooms = new Map();

const USER_COLORS = [
  '#2563eb', // Blue
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#ef4444'  // Red
];

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    let currentBoardId = null;
    let currentUser = null;

    // Join Board Room
    socket.on('board:join', ({ boardId, user }) => {
      currentBoardId = boardId;
      currentUser = {
        id: user?.id || socket.id,
        name: user?.name || `Collaborator-${socket.id.substring(0, 4)}`,
        color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
        cursor: { x: 0, y: 0 }
      };

      socket.join(boardId);

      if (!activeRooms.has(boardId)) {
        activeRooms.set(boardId, {
          users: new Map(),
          locks: new Map()
        });
      }

      const room = activeRooms.get(boardId);
      room.users.set(socket.id, currentUser);

      // Send initial room snapshot to joining user
      const usersList = Object.fromEntries(room.users);
      socket.emit('board:init', {
        users: usersList,
        locks: Object.fromEntries(room.locks)
      });

      // Broadcast new user to others in room
      socket.to(boardId).emit('user:joined', {
        socketId: socket.id,
        user: currentUser
      });
    });

    // Cursor Movement Broadcast (Throttled client-side)
    socket.on('cursor:move', ({ x, y }) => {
      if (!currentBoardId || !currentUser) return;
      currentUser.cursor = { x, y };

      socket.to(currentBoardId).emit('cursor:update', {
        socketId: socket.id,
        user: currentUser
      });
    });

    // Element Mutation Broadcasts
    socket.on('element:create', ({ element }) => {
      if (!currentBoardId) return;
      socket.to(currentBoardId).emit('element:created', { element });
    });

    socket.on('element:update', ({ elementId, updates }) => {
      if (!currentBoardId) return;
      socket.to(currentBoardId).emit('element:updated', { elementId, updates });
    });

    socket.on('element:delete', ({ elementIds }) => {
      if (!currentBoardId) return;
      socket.to(currentBoardId).emit('element:deleted', { elementIds });
    });

    // Element Locking
    socket.on('element:lock', ({ elementId }) => {
      if (!currentBoardId) return;
      const room = activeRooms.get(currentBoardId);
      if (room) {
        room.locks.set(elementId, socket.id);
        socket.to(currentBoardId).emit('element:locked', { elementId, lockedBy: currentUser.id });
      }
    });

    socket.on('element:unlock', ({ elementId }) => {
      if (!currentBoardId) return;
      const room = activeRooms.get(currentBoardId);
      if (room) {
        room.locks.delete(elementId);
        socket.to(currentBoardId).emit('element:unlocked', { elementId });
      }
    });

    // Timer Sync
    socket.on('timer:sync', (timerData) => {
      if (!currentBoardId) return;
      socket.to(currentBoardId).emit('timer:synced', timerData);
    });

    // Presentation Viewport Sync
    socket.on('present:viewport', (viewport) => {
      if (!currentBoardId) return;
      socket.to(currentBoardId).emit('present:synced', {
        presenter: currentUser.name,
        ...viewport
      });
    });

    // Disconnect Cleanup
    socket.on('disconnect', () => {
      if (currentBoardId && activeRooms.has(currentBoardId)) {
        const room = activeRooms.get(currentBoardId);
        room.users.delete(socket.id);

        // Release any locks held by this disconnected socket
        for (const [elementId, lockSocketId] of room.locks.entries()) {
          if (lockSocketId === socket.id) {
            room.locks.delete(elementId);
            socket.to(currentBoardId).emit('element:unlocked', { elementId });
          }
        }

        socket.to(currentBoardId).emit('user:left', { socketId: socket.id });

        if (room.users.size === 0) {
          activeRooms.delete(currentBoardId);
        }
      }
    });
  });
}

