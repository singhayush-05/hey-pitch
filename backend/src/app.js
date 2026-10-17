import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateEnv } from './config/env.js';
import { generalLimiter } from './middleware/rateLimiter.middleware.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

// Route imports
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import geoRoutes from './routes/geo.routes.js';

// Validate environment variables at module initialization
validateEnv();

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration for explicit frontend origins
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (config.frontendOrigins.includes(origin) || config.isTest) {
        return callback(null, true);
      }

      const msg = `The CORS policy for this site does not allow access from origin: ${origin}`;
      return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Requested-With']
  })
);

// Request body size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply general rate limiting across all API endpoints
app.use(generalLimiter);

// Mount API routes under prefix (/api/v1)
const prefix = config.apiPrefix;
app.use(prefix, healthRoutes);
app.use(`${prefix}/auth`, authRoutes);
app.use(`${prefix}/orders`, orderRoutes);
app.use(`${prefix}/payments`, paymentRoutes);
app.use(`${prefix}/verification`, verificationRoutes);
app.use(`${prefix}/geo`, geoRoutes);

// Root route for API welcome / discovery
app.get('/', (req, res) => {
  res.json({
    name: 'Hey-Pitch Backend API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: `${prefix}/health`,
      ready: `${prefix}/ready`,
      auth: `${prefix}/auth`,
      orders: `${prefix}/orders`,
      payments: `${prefix}/payments`,
      verification: `${prefix}/verification`,
      geo: `${prefix}/geo/lookup`
    }
  });
});

// Centralized 404 handler for unknown routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

export default app;
