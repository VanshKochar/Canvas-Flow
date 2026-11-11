/**
 * ============================================================================
 * EXPRESS APPLICATION CONFIGURATION & MIDDLEWARE PIPELINE
 * ============================================================================
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import boardRoutes from './routes/boardRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Security Headers (CSP, HSTS, X-Frame-Options)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  // CORS Configuration (Allow frontend origin with credentials)
  const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }
      return callback(null, true); // Dev flexible
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Health Check Endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'canvasflow-whiteboard-api',
      timestamp: new Date().toISOString()
    });
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/boards', boardRoutes);

  // 404 Route Handler
  app.use((req, res) => {
    res.status(404).json({ error: 'NotFound', message: `Route ${req.method} ${req.url} not found` });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}

