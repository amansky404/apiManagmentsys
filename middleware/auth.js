const jwt = require('jsonwebtoken');
const { getMode } = require('../config/mode');
const { validateToken } = require('./singleSession');

const JWT_SECRET = process.env.JWT_SECRET || 'tricolor_secret_key';

function extractToken(req) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader) {
    return null;
  }
  const parts = authHeader.split(' ');
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return null;
}

function authenticateToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token required. Please include a valid Bearer token.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token.'
      });
    }

    if (decoded.ip !== req.ip) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token IP mismatch. Please login again from this device.'
      });
    }

    if (!validateToken(req.ip, token)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Active session replaced. Please login again.'
      });
    }

    req.user = decoded;
    next();
  });
}

function authorizeRole(roles = []) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient privileges to access this resource.'
      });
    }
    next();
  };
}

function enforceRouteMode(req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }

  if (getMode() !== 'private') {
    return next();
  }

  const openPaths = ['/private/login'];
  const isSwaggerRoute = req.originalUrl.startsWith('/docs');

  if (openPaths.includes(req.path) || isSwaggerRoute) {
    return next();
  }

  return authenticateToken(req, res, next);
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  authorizeRole,
  enforceRouteMode
};
