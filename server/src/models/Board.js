/**
 * ============================================================================
 * BOARD DATA MODEL (MONGOOSE & IN-MEMORY ADAPTER)
 * ============================================================================
 */

import mongoose from 'mongoose';
import { isConnectedToMongo, inMemoryStore } from '../config/db.js';

const BoardMemberSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'editor', 'commenter', 'viewer'],
    default: 'editor'
  },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const BoardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Board title is required'],
    trim: true,
    default: 'Untitled Workspace'
  },
  ownerId: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  members: [BoardMemberSchema],
  settings: {
    backgroundColor: { type: String, default: '#f8fafc' },
    gridType: { type: String, enum: ['dots', 'lines', 'none'], default: 'dots' }
  }
}, { timestamps: true });

const MongooseBoard = mongoose.model('Board', BoardSchema);

export class BoardModel {
  static async create({ title, ownerId, settings = {} }) {
    if (isConnectedToMongo) {
      return await MongooseBoard.create({
        title,
        ownerId,
        settings,
        members: [{ userId: ownerId, role: 'admin' }]
      });
    }

    const newBoard = {
      _id: 'brd_' + Date.now() + Math.random().toString(36).substring(2, 6),
      title: title || 'Untitled Workspace',
      ownerId,
      isPublic: false,
      members: [{ userId: ownerId, role: 'admin', addedAt: new Date() }],
      settings: {
        backgroundColor: settings.backgroundColor || '#f8fafc',
        gridType: settings.gridType || 'dots'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryStore.boards.push(newBoard);
    return newBoard;
  }

  static async findById(id) {
    if (isConnectedToMongo) {
      return await MongooseBoard.findById(id);
    }
    return inMemoryStore.boards.find(b => b._id === id || b.id === id) || null;
  }

  static async findByUser(userId) {
    if (isConnectedToMongo) {
      return await MongooseBoard.find({
        $or: [
          { ownerId: userId },
          { 'members.userId': userId }
        ]
      }).sort({ updatedAt: -1 });
    }

    return inMemoryStore.boards.filter(
      b => b.ownerId === userId || b.members?.some(m => m.userId === userId)
    );
  }

  static async update(id, updates) {
    if (isConnectedToMongo) {
      return await MongooseBoard.findByIdAndUpdate(id, updates, { new: true });
    }

    const index = inMemoryStore.boards.findIndex(b => b._id === id || b.id === id);
    if (index === -1) return null;
    inMemoryStore.boards[index] = {
      ...inMemoryStore.boards[index],
      ...updates,
      updatedAt: new Date()
    };
    return inMemoryStore.boards[index];
  }

  static async delete(id) {
    if (isConnectedToMongo) {
      return await MongooseBoard.findByIdAndDelete(id);
    }

    const index = inMemoryStore.boards.findIndex(b => b._id === id || b.id === id);
    if (index === -1) return false;
    inMemoryStore.boards.splice(index, 1);
    // Also remove associated elements
    inMemoryStore.elements = inMemoryStore.elements.filter(e => e.boardId !== id);
    return true;
  }

  static async addMember(id, { userId, role = 'editor' }) {
    if (isConnectedToMongo) {
      return await MongooseBoard.findByIdAndUpdate(
        id,
        { $push: { members: { userId, role, addedAt: new Date() } } },
        { new: true }
      );
    }

    const board = await this.findById(id);
    if (!board) return null;
    board.members = board.members || [];
    board.members.push({ userId, role, addedAt: new Date() });
    return board;
  }
}

