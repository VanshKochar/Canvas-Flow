/**
 * ============================================================================
 * DATABASE CONFIGURATION & RESILIENT PERSISTENCE
 * ============================================================================
 * Connects to MongoDB via Mongoose. If MongoDB is unavailable on the host
 * machine, falls back to a thread-safe in-memory mock store so development
 * never halts.
 */

import mongoose from 'mongoose';

export let isConnectedToMongo = false;

// In-Memory DataStore Fallback (active if MongoDB daemon is not running)
export const inMemoryStore = {
  users: [],
  boards: [],
  elements: [],
  refreshTokens: new Set()
};

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/canvasflow_whiteboard';

  try {
    // Attempt Mongoose connection with 3-second timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    isConnectedToMongo = true;
    console.log('✅ Connected to MongoDB at:', uri);
  } catch (error) {
    isConnectedToMongo = false;
    console.warn('⚠️  MongoDB local daemon not detected. Operating with In-Memory Resilient Store.');
    console.warn('   (All REST CRUD, Auth, and WebSockets will function seamlessly in memory).');
  }
}

