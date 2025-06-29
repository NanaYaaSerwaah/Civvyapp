import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { IssueMatcher } from './services/IssueMatcher.js';
import { validateOnboardingData } from './middleware/validation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:3000',
  credentials: true
}));

// Rate limiting - 60 requests per minute per IP (configurable via env)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX) || 60,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Onboarding endpoint
app.post('/api/onboarding', validateOnboardingData, async (req, res) => {
  try {
    const { issues, format, reminders, cadence, zipCode } = req.body;
    
    // Initialize IssueMatcher with user preferences
    const issueMatcher = new IssueMatcher();
    
    // Generate personalized topic set with surprise injection
    const personalizedTopics = await issueMatcher.generateTopicSet({
      selectedIssues: issues,
      zipCode,
      format,
      cadence
    });
    
    // Store onboarding data (mock implementation for now)
    const onboardingResult = {
      id: `onboarding_${Date.now()}`,
      userId: req.body.userId || `user_${Date.now()}`,
      preferences: {
        issues,
        format,
        reminders,
        cadence,
        zipCode
      },
      personalizedTopics,
      createdAt: new Date().toISOString(),
      status: 'completed'
    };
    
    res.status(201).json({
      success: true,
      data: onboardingResult,
      message: 'Onboarding completed successfully'
    });
    
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during onboarding',
      message: 'Please try again later'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Civvy API server running on port ${PORT}`);
  console.log(`📊 Rate limit: ${process.env.RATE_LIMIT_MAX || 60} requests/minute`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});