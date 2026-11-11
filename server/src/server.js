/**
 * ============================================================================
 * SERVER BOOTSTRAP & ENTRYPOINT
 * ============================================================================
 * Initializes database connection, wraps Express app in HTTP server,
 * mounts Socket.io multiplayer engine, and starts network listeners.
 */

import http from 'http';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  // 1. Establish Database Connection (Mongoose with fallback)
  await connectDB();

  // 2. Create Express Application
  const app = createApp();

  // 3. Create HTTP Server
  const server = http.createServer(app);

  // 4. Attach Socket.io Server
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Allow connections from client
      methods: ['GET', 'POST']
    },
    pingInterval: 10000,
    pingTimeout: 5000
  });

  // 5. Register Real-Time Handlers
  setupSocketHandlers(io);

  // 6. Start Listening
  server.listen(PORT, () => {
    console.log(`🚀 CanvasFlow Server running on port ${PORT}`);
    console.log(`📡 WebSocket Engine active at ws://localhost:${PORT}`);
    console.log(`🏥 Health check ready at http://localhost:${PORT}/health`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal Server Boot Error:', err);
  process.exit(1);
});

