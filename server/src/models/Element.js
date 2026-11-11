/**
 * ============================================================================
 * CANVAS ELEMENT DATA MODEL (MONGOOSE & IN-MEMORY ADAPTER)
 * ============================================================================
 */

import mongoose from 'mongoose';
import { isConnectedToMongo, inMemoryStore } from '../config/db.js';

const ElementSchema = new mongoose.Schema({
  boardId: { type: String, required: true, index: true },
  elementId: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['rectangle', 'ellipse', 'diamond', 'sticky', 'pen', 'connector', 'text', 'stamp']
  },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  strokeColor: { type: String, default: '#0f172a' },
  strokeWidth: { type: Number, default: 2 },
  strokeStyle: { type: String, default: 'solid' },
  fillColor: { type: String, default: 'transparent' },
  text: { type: String, default: '' },
  textColor: { type: String, default: '#0f172a' },
  fontSize: { type: Number, default: 16 },
  points: [{ x: Number, y: Number }],
  startX: Number,
  startY: Number,
  endX: Number,
  endY: Number,
  emoji: String,
  version: { type: Number, default: 1 }
}, { timestamps: true });

const MongooseElement = mongoose.model('Element', ElementSchema);

export class ElementModel {
  static async findByBoardId(boardId) {
    if (isConnectedToMongo) {
      return await MongooseElement.find({ boardId });
    }
    return inMemoryStore.elements.filter(e => e.boardId === boardId);
  }

  static async batchUpsert(boardId, elements) {
    if (!elements || !Array.isArray(elements)) return [];

    if (isConnectedToMongo) {
      // Overwrite current board elements with latest snapshot
      await MongooseElement.deleteMany({ boardId });
      const docs = elements.map(el => ({ ...el, boardId, elementId: el.id }));
      return await MongooseElement.insertMany(docs);
    }

    // In-memory update
    inMemoryStore.elements = inMemoryStore.elements.filter(e => e.boardId !== boardId);
    const stamped = elements.map(el => ({
      ...el,
      boardId,
      elementId: el.id || ('el_' + Math.random().toString(36).substring(2, 8)),
      updatedAt: new Date()
    }));
    inMemoryStore.elements.push(...stamped);
    return stamped;
  }

  static async deleteById(boardId, elementId) {
    if (isConnectedToMongo) {
      return await MongooseElement.findOneAndDelete({ boardId, elementId });
    }

    const index = inMemoryStore.elements.findIndex(e => e.boardId === boardId && (e.elementId === elementId || e.id === elementId));
    if (index !== -1) {
      inMemoryStore.elements.splice(index, 1);
      return true;
    }
    return false;
  }
}

