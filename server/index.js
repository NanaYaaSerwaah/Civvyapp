import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { IssueMatcher } from './services/IssueMatcher.js';
import { ContentService } from './services/ContentService.js';
import { validateOnboardingData, validateFlagData } from './middleware/validation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const contentService = new ContentService();

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

// Feed endpoint - GET /api/feed
app.get('/api/feed', async (req, res) => {
  try {
    const userId = req.query.userId || 'anonymous';
    
    // Get user preferences (mock - would come from database)
    const preferences = req.query.preferences ? JSON.parse(req.query.preferences) : {};
    
    // Generate personalized feed
    const feedResult = await contentService.getFeed(userId, preferences);
    
    if (feedResult.success) {
      res.json(feedResult);
    } else {
      res.status(500).json(feedResult);
    }
    
  } catch (error) {
    console.error('Feed generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate feed',
      message: 'Please try again later'
    });
  }
});

// Flag submission endpoint - POST /api/flag
app.post('/api/flag', validateFlagData, async (req, res) => {
  try {
    const flagResult = await contentService.submitFlag(req.body);
    
    if (flagResult.success) {
      res.status(201).json(flagResult);
    } else {
      res.status(500).json(flagResult);
    }
    
  } catch (error) {
    console.error('Flag submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit flag',
      message: 'Please try again later'
    });
  }
});

// Moderation queue endpoint (admin only)
app.get('/api/moderation', (req, res) => {
  try {
    const queueResult = contentService.getModerationQueue();
    res.json(queueResult);
  } catch (error) {
    console.error('Moderation queue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve moderation queue'
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
  console.log(`🔍 FactHunter AI enabled for contradiction detection`);
});