import { verifyToken } from '../utils/jwt.js';

/**
 * Authenticate JWT and attach payload to req.auth
 * Does not require a specific role.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }

  req.auth = payload;
  req.user = payload;
  req.investor = req.user;
  next();
}

/**
 * Optional auth: attach payload if token present, do not fail if missing.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.auth = payload;
      req.user = payload;
      req.investor = req.user;
    }
  }
  next();
}
