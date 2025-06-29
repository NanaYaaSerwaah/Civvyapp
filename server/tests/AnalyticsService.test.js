import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsService } from '../services/AnalyticsService.js';

describe('AnalyticsService', () => {
  let analyticsService;
  
  beforeEach(() => {
    analyticsService = new AnalyticsService();
  });
  
  describe('trackEvent', () => {
    it('should track event with metadata', async () => {
      const eventName = 'quiz_completed';
      const userId = 'user_123';
      const properties = { score: 85, timeSpent: 120 };
      const metadata = { sessionId: 'session_456' };
      
      const result = await analyticsService.trackEvent(eventName, userId, properties, metadata);
      
      expect(result.success).toBe(true);
      expect(result.data.eventId).toBeDefined();
      expect(result.data.tracked).toBe(true);
    });
    
    it('should update KPIs when tracking relevant events', async () => {
      await analyticsService.trackEvent('onboarding_started', 'user_1');
      await analyticsService.trackEvent('onboarding_completed', 'user_1');
      
      expect(analyticsService.kpis.onboardingCompletion.started).toBe(1);
      expect(analyticsService.kpis.onboardingCompletion.completed).toBe(1);
    });
  });
  
  describe('getDashboardMetrics', () => {
    it('should generate dashboard metrics', async () => {
      // Add some test events
      await analyticsService.trackEvent('onboarding_started', 'user_1');
      await analyticsService.trackEvent('onboarding_completed', 'user_1');
      await analyticsService.trackEvent('feed_viewed', 'user_1');
      await analyticsService.trackEvent('quiz_completed', 'user_1', { score: 90 });
      
      const result = analyticsService.getDashboardMetrics('24h');
      
      expect(result.success).toBe(true);
      expect(result.data.timeframe).toBe('24h');
      expect(result.data.kpis).toBeDefined();
      expect(result.data.engagement).toBeDefined();
      expect(result.data.content).toBeDefined();
      expect(result.data.funnel).toBeDefined();
    });
    
    it('should filter metrics by cohort', async () => {
      await analyticsService.trackEvent('quiz_completed', 'user_1');
      await analyticsService.trackEvent('quiz_completed', 'user_2');
      
      const result = analyticsService.getDashboardMetrics('24h', 'manhattan_east');
      
      expect(result.success).toBe(true);
      expect(result.data.cohort).toBe('manhattan_east');
    });
  });
  
  describe('checkFeatureFlag', () => {
    it('should check feature flag for user', () => {
      const userId = 'user_1';
      const flagName = 'pilot_manhattan_east';
      
      const result = analyticsService.checkFeatureFlag(flagName, userId, { zipCode: '10001' });
      
      expect(result.enabled).toBeDefined();
      expect(typeof result.enabled).toBe('boolean');
    });
    
    it('should track feature flag exposure', () => {
      const userId = 'user_1';
      const flagName = 'enhanced_feed_algorithm';
      
      analyticsService.checkFeatureFlag(flagName, userId);
      
      // Should have tracked exposure event
      const exposureEvents = analyticsService.events.filter(e => e.eventName === 'feature_flag_exposed');
      expect(exposureEvents.length).toBeGreaterThan(0);
    });
  });
  
  describe('collectFeedback', () => {
    it('should collect user feedback', async () => {
      const userId = 'user_1';
      const feedbackType = 'app_rating';
      const data = { rating: 5, comment: 'Great app!' };
      
      const result = await analyticsService.collectFeedback(userId, feedbackType, data);
      
      expect(result.success).toBe(true);
      expect(result.data.feedbackId).toBeDefined();
      expect(result.data.sentiment).toBeDefined();
    });
    
    it('should analyze sentiment of feedback', async () => {
      const userId = 'user_1';
      const positiveData = { comment: 'This app is amazing and very helpful!' };
      const negativeData = { comment: 'This app is terrible and confusing!' };
      
      const positiveResult = await analyticsService.collectFeedback(userId, 'comment', positiveData);
      const negativeResult = await analyticsService.collectFeedback(userId, 'comment', negativeData);
      
      expect(positiveResult.data.sentiment).toBe('positive');
      expect(negativeResult.data.sentiment).toBe('negative');
    });
  });
  
  describe('getCohortAnalysis', () => {
    it('should generate cohort analysis', async () => {
      const cohortId = 'manhattan_east';
      
      // Add some events for cohort users
      await analyticsService.trackEvent('quiz_completed', 'user_1', { score: 85 });
      await analyticsService.trackEvent('vote_pledge', 'user_1');
      
      const result = analyticsService.getCohortAnalysis(cohortId, '30d');
      
      expect(result.success).toBe(true);
      expect(result.data.cohortId).toBe(cohortId);
      expect(result.data.engagement).toBeDefined();
      expect(result.data.behavior).toBeDefined();
      expect(result.data.performance).toBeDefined();
    });
  });
  
  describe('KPI calculations', () => {
    it('should calculate onboarding completion rate', async () => {
      await analyticsService.trackEvent('onboarding_started', 'user_1');
      await analyticsService.trackEvent('onboarding_started', 'user_2');
      await analyticsService.trackEvent('onboarding_completed', 'user_1');
      
      const events = analyticsService.events;
      const completion = analyticsService.calculateOnboardingCompletion(events);
      
      expect(completion.started).toBe(2);
      expect(completion.completed).toBe(1);
      expect(completion.rate).toBe(50);
    });
    
    it('should calculate contradiction detection rate', async () => {
      await analyticsService.trackEvent('feed_viewed', 'user_1');
      await analyticsService.trackEvent('feed_viewed', 'user_1');
      await analyticsService.trackEvent('contradiction_detected', 'user_1');
      
      const events = analyticsService.events;
      const contradictionRate = analyticsService.calculateContradictionRate(events);
      
      expect(contradictionRate.views).toBe(2);
      expect(contradictionRate.contradictions).toBe(1);
      expect(contradictionRate.rate).toBe(50);
    });
  });
});