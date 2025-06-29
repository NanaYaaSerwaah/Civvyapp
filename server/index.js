import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { IssueMatcher } from './services/IssueMatcher.js';
import { ContentService } from './services/ContentService.js';
import { RewardMaster } from './services/RewardMaster.js';
import { QuizService } from './services/QuizService.js';
import { IntegrityGuardian } from './services/IntegrityGuardian.js';
import { AuditService } from './services/AuditService.js';
import { AnalyticsService } from './services/AnalyticsService.js';
import { FeatureFlagService } from './services/FeatureFlagService.js';
import { validateOnboardingData, validateFlagData, validateQuizData, validatePledgeData } from './middleware/validation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const contentService = new ContentService();
const rewardMaster = new RewardMaster();
const quizService = new QuizService();
const integrityGuardian = new IntegrityGuardian();
const auditService = new AuditService();
const analyticsService = new AnalyticsService();
const featureFlagService = new FeatureFlagService();

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

// Analytics tracking endpoint
app.post('/api/analytics/track', async (req, res) => {
  try {
    const { eventName, userId, properties, metadata } = req.body;
    
    if (!eventName || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Event name and user ID are required'
      });
    }

    const result = await analyticsService.trackEvent(
      eventName, 
      userId, 
      properties, 
      {
        ...metadata,
        userAgent: req.get('User-Agent'),
        ipHash: req.ip ? require('crypto').createHash('sha256').update(req.ip).digest('hex').substring(0, 16) : null
      }
    );

    res.json(result);
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event'
    });
  }
});

// Dashboard metrics endpoint
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const { timeframe = '24h', cohort } = req.query;
    
    const metrics = analyticsService.getDashboardMetrics(timeframe, cohort);
    res.json(metrics);
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard metrics'
    });
  }
});

// Campaign analytics endpoint
app.get('/api/analytics/campaign/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { timeframe = '30d' } = req.query;
    
    const analytics = analyticsService.getCampaignAnalytics(campaignId, timeframe);
    res.json(analytics);
  } catch (error) {
    console.error('Campaign analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate campaign analytics'
    });
  }
});

// Cohort analysis endpoint
app.get('/api/analytics/cohort/:cohortId', async (req, res) => {
  try {
    const { cohortId } = req.params;
    const { timeframe = '30d' } = req.query;
    
    const analysis = analyticsService.getCohortAnalysis(cohortId, timeframe);
    res.json(analysis);
  } catch (error) {
    console.error('Cohort analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate cohort analysis'
    });
  }
});

// Feature flag endpoints
app.get('/api/features/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userContext = req.query;
    
    const features = featureFlagService.getUserFeatures(userId, userContext);
    res.json({
      success: true,
      data: features
    });
  } catch (error) {
    console.error('Feature flags error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user features'
    });
  }
});

app.get('/api/features/:userId/:flagName', async (req, res) => {
  try {
    const { userId, flagName } = req.params;
    const userContext = req.query;
    
    const result = featureFlagService.isEnabled(flagName, userId, userContext);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Feature flag check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check feature flag'
    });
  }
});

// Feature flag analytics
app.get('/api/analytics/feature-flags', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    const analytics = featureFlagService.getExposureAnalytics(timeframe);
    res.json(analytics);
  } catch (error) {
    console.error('Feature flag analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate feature flag analytics'
    });
  }
});

// Feedback collection endpoint
app.post('/api/feedback', async (req, res) => {
  try {
    const { userId, type, data, metadata } = req.body;
    
    if (!userId || !type || !data) {
      return res.status(400).json({
        success: false,
        error: 'User ID, type, and data are required'
      });
    }

    const result = await analyticsService.collectFeedback(userId, type, data, {
      ...metadata,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    res.json(result);
  } catch (error) {
    console.error('Feedback collection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to collect feedback'
    });
  }
});

// Onboarding endpoint with analytics tracking
app.post('/api/onboarding', validateOnboardingData, async (req, res) => {
  try {
    const { issues, format, reminders, cadence, zipCode } = req.body;
    
    // Track onboarding start
    const userId = req.body.userId || `user_${Date.now()}`;
    await analyticsService.trackEvent('onboarding_started', userId, {
      issues: issues.length,
      format,
      zipCode
    });
    
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
      userId,
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

    // Log audit event
    await auditService.logEvent('user_onboarded', {
      userId: onboardingResult.userId,
      preferences: onboardingResult.preferences
    });

    // Track onboarding completion
    await analyticsService.trackEvent('onboarding_completed', userId, {
      diversityScore: personalizedTopics.diversityScore,
      totalTopics: personalizedTopics.totalTopics,
      surpriseTopics: personalizedTopics.surpriseTopics.length
    });
    
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

// Feed endpoint with analytics tracking
app.get('/api/feed', async (req, res) => {
  try {
    const userId = req.query.userId || 'anonymous';
    
    // Track feed view
    if (userId !== 'anonymous') {
      await analyticsService.trackEvent('feed_viewed', userId, {
        preferences: req.query.preferences ? 'custom' : 'default'
      });
    }
    
    // Get user preferences (mock - would come from database)
    const preferences = req.query.preferences ? JSON.parse(req.query.preferences) : {};
    
    // Generate personalized feed
    const feedResult = await contentService.getFeed(userId, preferences);
    
    // Track contradictions found
    if (feedResult.success && feedResult.data) {
      const contradictionsFound = feedResult.data.reduce((sum, item) => 
        sum + (item.contradictions || 0), 0
      );
      
      if (contradictionsFound > 0 && userId !== 'anonymous') {
        await analyticsService.trackEvent('contradiction_detected', userId, {
          count: contradictionsFound,
          totalItems: feedResult.data.length
        });
      }
    }
    
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

// Flag submission endpoint with analytics
app.post('/api/flag', validateFlagData, async (req, res) => {
  try {
    // Track flag submission
    await analyticsService.trackEvent('flag_submitted', req.body.userId, {
      reason: req.body.reason,
      contentId: req.body.contentId
    });

    // Process flag with reputation weighting
    const weightedFlag = await integrityGuardian.processFlagWithReputation(req.body);
    
    if (weightedFlag.success) {
      // Submit to content service
      const flagResult = await contentService.submitFlag({
        ...req.body,
        weight: weightedFlag.data.weight,
        priority: weightedFlag.data.priority
      });

      if (flagResult.success) {
        // Award XP for flag submission
        const userId = req.body.userId;
        await rewardMaster.awardXP(userId, 'flag_submission', {
          contentId: req.body.contentId,
          reason: req.body.reason
        });

        // Log audit event
        await auditService.logEvent('flag_submitted', {
          flagId: weightedFlag.data.id,
          contentId: req.body.contentId,
          reason: req.body.reason,
          weight: weightedFlag.data.weight
        });
        
        res.status(201).json(flagResult);
      } else {
        res.status(500).json(flagResult);
      }
    } else {
      res.status(400).json(weightedFlag);
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

// Quiz endpoints with analytics
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { userId, preferences } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Track quiz generation
    await analyticsService.trackEvent('quiz_generated', userId, {
      hasPreferences: !!preferences,
      issueCount: preferences?.issues?.length || 0
    });

    const quizResult = await quizService.generateQuiz(userId, preferences);
    
    if (quizResult.success) {
      // Log audit event
      await auditService.logEvent('quiz_generated', {
        userId,
        quizId: quizResult.data.quizId,
        questionCount: quizResult.data.totalQuestions
      });

      res.status(201).json(quizResult);
    } else {
      res.status(500).json(quizResult);
    }
    
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quiz'
    });
  }
});

app.post('/api/quiz/submit', validateQuizData, async (req, res) => {
  try {
    const { quizId, answers, userId } = req.body;
    
    const submitResult = await quizService.submitQuiz(quizId, answers);
    
    if (submitResult.success) {
      // Track quiz completion
      await analyticsService.trackEvent('quiz_completed', userId, {
        score: submitResult.data.score,
        isPerfectScore: submitResult.data.isPerfectScore,
        timeSpent: submitResult.data.timeSpent,
        questionCount: submitResult.data.totalQuestions
      });

      // Award XP for quiz completion
      const quizData = {
        quizId,
        answers,
        correctAnswers: submitResult.data.results.map(r => r.correctAnswer),
        timeSpent: submitResult.data.timeSpent
      };
      
      const rewardResult = await rewardMaster.processQuizCompletion(userId, quizData);

      // Track XP earned
      if (rewardResult.success) {
        await analyticsService.trackEvent('metropoints_earned', userId, {
          source: 'quiz',
          amount: rewardResult.data.totalXPEarned,
          quizScore: submitResult.data.score
        });
      }

      // Log audit event
      await auditService.logEvent('quiz_completed', {
        userId,
        quizId,
        score: submitResult.data.score,
        isPerfectScore: submitResult.data.isPerfectScore,
        xpEarned: rewardResult.data?.totalXPEarned || 0
      });
      
      res.json({
        ...submitResult,
        rewards: rewardResult.data
      });
    } else {
      res.status(500).json(submitResult);
    }
    
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit quiz'
    });
  }
});

// Vote pledge endpoint with analytics
app.post('/api/vote-pledge', validatePledgeData, async (req, res) => {
  try {
    // Track vote pledge
    await analyticsService.trackEvent('vote_pledge', req.body.userId, {
      electionId: req.body.electionId,
      pledgeType: req.body.pledgeType
    });

    const pledgeResult = await rewardMaster.processVotePledge(req.body.userId, req.body);
    
    if (pledgeResult.success) {
      // Track XP earned
      await analyticsService.trackEvent('metropoints_earned', req.body.userId, {
        source: 'vote_pledge',
        amount: pledgeResult.data.reward?.xpEarned || 0,
        pledgeType: req.body.pledgeType
      });

      // Log audit event
      await auditService.logEvent('vote_pledge', {
        userId: req.body.userId,
        electionId: req.body.electionId,
        pledgeType: req.body.pledgeType,
        xpEarned: pledgeResult.data.reward?.xpEarned || 0
      });

      res.status(201).json(pledgeResult);
    } else {
      res.status(400).json(pledgeResult);
    }
    
  } catch (error) {
    console.error('Vote pledge error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process vote pledge'
    });
  }
});

// Rewards endpoints with analytics
app.get('/api/rewards', (req, res) => {
  try {
    const rewards = rewardMaster.getAvailableRewards();
    res.json({
      success: true,
      data: rewards
    });
  } catch (error) {
    console.error('Rewards fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rewards'
    });
  }
});

app.post('/api/rewards/redeem', async (req, res) => {
  try {
    const { userId, rewardId, quantity = 1 } = req.body;
    
    if (!userId || !rewardId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Reward ID are required'
      });
    }

    const redeemResult = await rewardMaster.redeemReward(userId, rewardId, quantity);
    
    if (redeemResult.success) {
      // Track reward redemption
      await analyticsService.trackEvent('reward_redeemed', userId, {
        rewardId,
        quantity,
        cost: redeemResult.data.transaction.cost,
        category: redeemResult.data.transaction.category
      });

      // Log audit event
      await auditService.logEvent('reward_redeemed', {
        userId,
        rewardId,
        quantity,
        cost: redeemResult.data.transaction.cost
      });

      res.json(redeemResult);
    } else {
      res.status(400).json(redeemResult);
    }
    
  } catch (error) {
    console.error('Reward redemption error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to redeem reward'
    });
  }
});

// User profile endpoint
app.get('/api/user/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const userProfile = rewardMaster.getUserProfile(userId);
    const transactions = rewardMaster.getUserTransactions(userId, 10);
    const trustMetrics = integrityGuardian.getUserTrustMetrics(userId);
    
    res.json({
      success: true,
      data: {
        ...userProfile,
        recentTransactions: transactions,
        trustMetrics: trustMetrics.success ? trustMetrics.data : null
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// Trust and audit endpoints
app.get('/api/user/:userId/reputation', async (req, res) => {
  try {
    const { userId } = req.params;
    const reputation = await integrityGuardian.calculateUserReputation(userId);
    
    if (reputation.success) {
      res.json(reputation);
    } else {
      res.status(500).json(reputation);
    }
  } catch (error) {
    console.error('Reputation calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate reputation'
    });
  }
});

app.get('/api/audit/public', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const auditFeed = integrityGuardian.getPublicAuditFeed(limit, offset);
    res.json(auditFeed);
  } catch (error) {
    console.error('Public audit feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit feed'
    });
  }
});

app.get('/api/transparency/report', (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30d';
    const report = auditService.getTransparencyReport(timeframe);
    res.json(report);
  } catch (error) {
    console.error('Transparency report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate transparency report'
    });
  }
});

// Leaderboard endpoint
app.get('/api/leaderboard', (req, res) => {
  try {
    const leaderboard = quizService.getLeaderboard(10);
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

// Moderation queue endpoint (admin only)
app.get('/api/moderation', (req, res) => {
  try {
    const queueResult = contentService.getModerationQueue();
    const integrityQueue = integrityGuardian.getModerationQueue();
    
    res.json({
      success: true,
      data: {
        contentQueue: queueResult.data || [],
        integrityQueue: integrityQueue.data?.queue || [],
        totalPending: (queueResult.data?.length || 0) + (integrityQueue.data?.totalPending || 0)
      }
    });
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
  console.log(`🎯 RewardMaster gamification engine active`);
  console.log(`🧠 QuizService civic knowledge system ready`);
  console.log(`🛡️ IntegrityGuardian trust layer operational`);
  console.log(`📋 AuditService transparency system active`);
  console.log(`📈 AnalyticsService real-time tracking enabled`);
  console.log(`🎛️ FeatureFlagService pilot management ready`);
});