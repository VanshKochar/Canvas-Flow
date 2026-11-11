/**
 * ============================================================================
 * AUTHENTICATION CONTROLLER (DUAL-TOKEN JWT ROTATION)
 * ============================================================================
 */

import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';
import { inMemoryStore } from '../config/db.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'canvasflow_access_secret_production_key_387498';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'canvasflow_refresh_secret_production_key_928374';

function generateTokens(user) {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role
  };

  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

  inMemoryStore.refreshTokens.add(refreshToken);

  return { accessToken, refreshToken };
}

function setRefreshCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

export async function register(req, res, next) {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'ValidationError', message: 'Email, password, and full name are required' });
    }

    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'An account with this email already exists' });
    }

    const user = await UserModel.create({ email, password, fullName });
    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      user: {
        id: user._id || user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      accessToken
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'ValidationError', message: 'Email and password required' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'InvalidCredentials', message: 'Invalid email or password' });
    }

    const isMatch = await UserModel.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'InvalidCredentials', message: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      user: {
        id: user._id || user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      accessToken
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Refresh token cookie missing' });
    }

    jwt.verify(refreshToken, REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Forbidden', message: 'Refresh token expired or invalid' });
      }

      const user = await UserModel.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'NotFound', message: 'User no longer exists' });
      }

      const { accessToken, refreshToken: newRefresh } = generateTokens(user);
      setRefreshCookie(res, newRefresh);

      res.json({
        success: true,
        accessToken
      });
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    inMemoryStore.refreshTokens.delete(refreshToken);
  }
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function getMe(req, res) {
  const user = await UserModel.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'NotFound', message: 'User not found' });

  res.json({
    id: user._id || user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role
  });
}

