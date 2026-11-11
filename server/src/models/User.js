/**
 * ============================================================================
 * USER DATA MODEL (MONGOOSE & IN-MEMORY ADAPTER)
 * ============================================================================
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { isConnectedToMongo, inMemoryStore } from '../config/db.js';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'member', 'guest'],
    default: 'member'
  },
  avatarUrl: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const MongooseUser = mongoose.model('User', UserSchema);

export class UserModel {
  static async findByEmail(email) {
    if (isConnectedToMongo) {
      return await MongooseUser.findOne({ email: email.toLowerCase() });
    }
    return inMemoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static async findById(id) {
    if (isConnectedToMongo) {
      return await MongooseUser.findById(id);
    }
    return inMemoryStore.users.find(u => u._id === id || u.id === id) || null;
  }

  static async create({ email, password, fullName, role = 'member' }) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    if (isConnectedToMongo) {
      return await MongooseUser.create({
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        role
      });
    }

    const newUser = {
      _id: 'usr_' + Date.now() + Math.random().toString(36).substring(2, 6),
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryStore.users.push(newUser);
    return newUser;
  }

  static async comparePassword(candidatePassword, hash) {
    return await bcrypt.compare(candidatePassword, hash);
  }
}

