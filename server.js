import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { connectDB, lastDbError } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import timeTrackerRoutes from './routes/timeTrackerRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import habitsRoutes from './routes/habitsRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import islamicRoutes from './routes/islamicRoutes.js';
import studyRoutes from './routes/studyRoutes.js';
import goalsRoutes from './routes/goalsRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

const app = express();

// Security Headers Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS Middleware
const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  'https://lifeosclient.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const allAllowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...configuredOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, serverless, health checks)
      if (!origin) return callback(null, true);

      // Allow if explicit match
      if (allAllowedOrigins.includes(origin)) return callback(null, true);

      // Allow any *.vercel.app deployment preview
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);

      // Allow non-production environments
      if (process.env.NODE_ENV !== 'production') return callback(null, true);

      return callback(new Error(`Blocked by CORS policy for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json({ limit: '1mb' }));

// Auth Rate Limiting (15 attempts per 15 mins per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Root endpoint (Public)
app.get('/', (req, res) => {
  res.json({
    name: 'Life OS API Server',
    status: 'online',
    version: '1.0.0',
    health: '/api/health',
    clientOrigin: process.env.CLIENT_ORIGIN || 'https://lifeosclient.vercel.app',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint (Public)
app.get('/api/health', async (req, res) => {
  let connectError = null;
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      connectError = err.message;
    }
  }

  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = mongoose.connection.readyState;
  const rawUri = process.env.MONGODB_URI || '';
  const maskedUri = rawUri
    ? rawUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
    : 'NOT_SET';

  res.json({
    status: 'ok',
    message: 'Life OS API Server running',
    dbState: states[dbState] || dbState,
    dbHost: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null,
    hasMongoUriEnv: Boolean(process.env.MONGODB_URI),
    mongoUriMasked: maskedUri,
    dbError: connectError || lastDbError || null,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Database Readiness Middleware for all /api endpoints (prevents 10s timeouts)
app.use('/api', async (req, res, next) => {
  if (req.path === '/health') return next();

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      return res.status(503).json({
        message: `Database connection unavailable: ${err.message}. Please verify that MONGODB_URI is set in Vercel settings and MongoDB Atlas allows 0.0.0.0/0.`,
        dbState: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
        error: err.message,
      });
    }
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/time-tracker', timeTrackerRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/health-module', healthRoutes);
app.use('/api', healthRoutes); // Mount health endpoints (/meals, /workouts, /body-metrics, /water, /summary, /food-items/search, /workout-types/search)
app.use('/api/islamic', islamicRoutes); // Mounted: /salah, /qada, /hadith, /vows, /quran, /adhkar, /fasts
app.use('/api/study', studyRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Life OS Backend] Server listening on port ${PORT}`);
    connectDB();
  });
}

export default app;
