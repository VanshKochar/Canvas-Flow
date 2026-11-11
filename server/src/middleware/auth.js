/**
 * ============================================================================
 * JWT AUTHENTICATION MIDDLEWARE
 * ============================================================================
 * Extracts and verifies short-lived Access Tokens (15 min) from the
 * Authorization header or cookies. Attaches verified user payload to req.user.
 */

import jwt from 'jsonwebtoken';

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token required. Please authenticate.'
    });
  }

  try {
    const secret = process.env.JWT_ACCESS_SECRET || 'canvasflow_access_secret_production_key_387498';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'TokenExpiredOrInvalid',
      message: 'Access token has expired or is invalid. Use /api/auth/refresh.'
    });
  }
}

