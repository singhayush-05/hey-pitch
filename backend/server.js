import app from './src/app.js';
import { config } from './src/config/env.js';
import { connectDatabase, disconnectDatabase } from './src/config/database.js';
import { logger } from './src/utils/logger.js';

let server;

async function startServer() {
  logger.info(`Starting Hey-Pitch API service in '${config.env}' mode...`);

  // Connect to MongoDB
  await connectDatabase();

  server = app.listen(config.port, () => {
    logger.info(`Hey-Pitch API server listening on http://localhost:${config.port}`);
    logger.info(`Health check live at http://localhost:${config.port}${config.apiPrefix}/health`);
    logger.info(`Allowed frontend origins: ${config.frontendOrigins.join(', ')}`);
  });

  // Handle server errors
  server.on('error', (err) => {
    logger.error('Server startup error', { error: err.message });
    process.exit(1);
  });
}

// Graceful shutdown handler
async function handleShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed. Disconnecting database...');
      await disconnectDatabase();
      logger.info('Graceful shutdown complete.');
      process.exit(0);
    });

    // Force close after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Uncaught exceptions & unhandled promise rejections
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason });
  process.exit(1);
});

startServer();
