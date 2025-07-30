/**
 * LLM Document Assistant - Backend Server
 * 
 * This is the main entry point for the backend API server.
 * It sets up Express, middleware, and routes.
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const winston = require('winston');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Load configuration
const config = require('../config/app.config');

// Initialize logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: config.logging.file,
      dirname: path.dirname(config.logging.file),
    }),
  ],
});

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: config.server.corsOrigins.split(','),
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import routes
const chatRoutes = require('./routes/chat');
const documentRoutes = require('./routes/documents');
const adminRoutes = require('./routes/admin');

// Register routes
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

// Start server
const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
  logger.info(`Server running at http://${HOST}:${PORT}`);
  logger.info('Press Ctrl+C to quit.');
});

module.exports = app;
