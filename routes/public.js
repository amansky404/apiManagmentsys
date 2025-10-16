const express = require('express');
const { getMode } = require('../config/mode');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Public
 *   description: Endpoints available without authentication when the system is in public mode.
 */

/**
 * @swagger
 * /public/info:
 *   get:
 *     summary: Get system status information.
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Successfully retrieved system info.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 mode:
 *                   type: string
 */
router.get('/info', (req, res) => {
  res.json({
    message: 'Unified API Management System is running.',
    mode: getMode()
  });
});

module.exports = router;
