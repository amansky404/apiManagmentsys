const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

require('./config/db');
const corsOptions = require('./middleware/cors');
const { rateLimiter } = require('./middleware/limiter');
const { enforceRouteMode } = require('./middleware/auth');
const { getMode } = require('./config/mode');

const publicRoutes = require('./routes/public');
const privateRoutes = require('./routes/private');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(rateLimiter);
app.use(express.static(path.join(__dirname, 'public')));
app.use(enforceRouteMode);

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Unified API Management System – Tricolor Edition',
    version: '1.0.0',
    description: 'Public and private API routes secured with JWT, rate limiting, and single-session enforcement.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

const swaggerOptions = {
  swaggerDefinition,
  apis: [path.join(__dirname, 'routes', '*.js')]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true
    }
  })
);

app.use('/public', publicRoutes);
app.use('/private', privateRoutes);

app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Origin not allowed. Only http://192.168.1.15:3000 is permitted.'
    });
  }
  return res.status(500).json({
    error: 'Server Error',
    message: err.message || 'An unexpected error occurred.'
  });
});

app.listen(PORT, () => {
  console.log('🇮🇳 Unified API Management System – Tricolor Edition');
  console.log(`🚀 Running on http://localhost:${PORT}`);
  console.log(`📜 Swagger Docs: http://localhost:${PORT}/docs`);
  console.log(`🔐 Current Mode: ${getMode().toUpperCase()}`);
});

module.exports = app;
