#!/usr/bin/env node

/**
 * BrainBuilder Backend Server Entry Point
 *
 * This file serves as the entry point for the application.
 * It imports the Express app from src/app.js and starts the server.
 */

const app = require('./src/app');
const logger = require('./src/config/logger');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

// Only start listening if this file is run directly (not imported)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server listening on port ${PORT}`);
    logger.info(`📡 API: http://localhost:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      mongoose.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      mongoose.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    logger.error(`❌ Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error(`❌ Uncaught Exception: ${err.message}`);
    process.exit(1);
  });

  // Export server for testing purposes
  module.exports = server;
} else {
  // Export app for testing purposes
  module.exports = app;
}
