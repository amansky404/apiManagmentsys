const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('../config/db');
const { JWT_SECRET, authenticateToken, authorizeRole } = require('../middleware/auth');
const { registerToken, getSessionDetails } = require('../middleware/singleSession');
const { getRateStatus, getRateConfig } = require('../middleware/limiter');
const { getMode, setMode, toggleMode } = require('../config/mode');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Private
 *   description: Endpoints that require a valid JWT token.
 */

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative endpoints restricted to admin users.
 */

/**
 * @swagger
 * /private/login:
 *   post:
 *     summary: Authenticate a user and issue a JWT.
 *     tags: [Private]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: aman
 *     responses:
 *       200:
 *         description: JWT issued successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 expiresIn:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials.
 */
router.post('/login', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Username is required.'
    });
  }

  db.get(
    'SELECT id, name, email, username, role FROM users WHERE username = ?',
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({
          error: 'Database Error',
          message: err.message
        });
      }

      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid username.'
        });
      }

      const payload = {
        username: user.username,
        role: user.role,
        ip: req.ip
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '10m' });
      registerToken(req.ip, token);

      res.json({
        token,
        expiresIn: '10 minutes',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        ip: req.ip,
        session: getSessionDetails(req.ip)
      });
  }
  );
});

/**
 * @swagger
 * /private/secure:
 *   get:
 *     summary: Secure endpoint requiring authentication.
 *     tags: [Private]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated response.
 */
router.get('/secure', authenticateToken, (req, res) => {
  res.json({
    message: 'You have accessed a secure resource.',
    user: req.user,
    mode: getMode()
  });
});

/**
 * @swagger
 * /private/status:
 *   get:
 *     summary: Retrieve live security module telemetry for the current IP.
 *     tags: [Private]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status information for rate limiting and session enforcement.
 */
router.get('/status', authenticateToken, (req, res) => {
  const rateLimit = getRateStatus(req.ip);
  const rateConfig = getRateConfig();
  const session = getSessionDetails(req.ip);

  res.json({
    ip: req.ip,
    mode: getMode(),
    rateLimit: {
      ...rateLimit,
      ...rateConfig
    },
    session
  });
});

/**
 * @swagger
 * /private/admin/users:
 *   get:
 *     summary: Retrieve application users (admin only).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         description: Filter users by numeric id.
 *     responses:
 *       200:
 *         description: List of users.
 *       400:
 *         description: Invalid numeric input.
 *       403:
 *         description: Forbidden.
 */
router.get('/admin/users', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { id } = req.query;

  if (id !== undefined && !/^-?\d+$/.test(id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid numeric input for id. Only integers are allowed.'
    });
  }

  const query = id ? 'SELECT id, name, email, username, role FROM users WHERE id = ?' : 'SELECT id, name, email, username, role FROM users';
  const params = id ? [Number(id)] : [];

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        error: 'Database Error',
        message: err.message
      });
    }

    res.json({
      count: rows.length,
      users: rows
    });
  });
});

/**
 * @swagger
 * /private/admin/toggle:
 *   post:
 *     summary: Toggle public/private route mode (admin only).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [public, private]
 *     responses:
 *       200:
 *         description: Updated mode returned.
 */
router.post('/admin/toggle', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { mode } = req.body || {};
  let updatedMode = getMode();

  if (mode) {
    if (!['public', 'private'].includes(mode)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Mode must be either "public" or "private".'
      });
    }
    updatedMode = setMode(mode);
  } else {
    updatedMode = toggleMode();
  }

  res.json({
    message: `Route mode updated to ${updatedMode}.`,
    mode: updatedMode
  });
});

module.exports = router;
