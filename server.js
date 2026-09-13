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
import { connectDB } from './config/db.js';
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
app.use(helmet());

// CORS Middleware
const allowedOrigins = process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
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

// Health check endpoint (Public)
app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = mongoose.connection.readyState;
  res.json({
    status: 'ok',
    message: 'Life OS API Server running',
    dbState: states[dbState] || dbState,
    dbHost: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/time-tracker', timeTrackerRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/health-module', healthRoutes);
app.use('/api', healthRoutes); // Mount health endpoints (/meals, /workouts, /body-metrics, /water, /summary, /food-items/search, /workout-types/search)
app.use('/api/islamic', islamicRoutes);
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
