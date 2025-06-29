/**
 * AnalyticsService - Real-time analytics and KPI tracking
 * Integrates with Mixpanel-style event tracking and campaign analytics
 */
export class AnalyticsService {
  constructor() {
    this.events = [];
    this.userSessions = new Map();
    this.campaignMetrics = new Map();
    this.cohortData = new Map();
    
    // KPI tracking
    this.kpis = {
      onboardingCompletion: { completed: 0, started: 0 },
      contradictionsPerHundredViews: { contradictions: 0, views: 0 },
      metroPointsRedemption: { redeemed: 0, earned: 0 },
      dailyActiveUsers: new Set(),
      monthlyActiveUsers: new Set(),
      retentionRates: new Map()
    };
    
    // Feature flags for pilot cohorts
    this.featureFlags = new Map([
      ['pilot_precinct_1', { enabled: true, cohort: 'manhattan_east', features: ['enhanced_feed', 'live_townhall'] }],
      ['pilot_precinct_2', { enabled: true, cohort: 'brooklyn_north', features: ['enhanced_feed'] }],
      ['pilot_precinct_3', { enabled: false, cohort: 'queens_central', features: [] }],
      ['advanced_analytics', { enabled: true, cohort: 'all', features: ['detailed_metrics'] }],
      ['beta_rewards', { enabled: true, cohort: 'early_adopters', features: ['premium_rewards'] }]
    ]);
  }

  /**
   * Track user event with comprehensive metadata
   */
  async trackEvent(eventName, userId, properties = {}, metadata = {}) {
    try {
      const event = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventName,
        userId,
        timestamp: new Date().toISOString(),
        properties: {
          ...properties,
          platform: 'web',
          version: '1.0.0'
        },
        metadata: {
          ...metadata,
          sessionId: this.getOrCreateSession(userId),
          userAgent: metadata.userAgent || 'unknown',
          ipHash: metadata.ipHash || null
        },
        processed: false
      };

      this.events.push(event);
      
      // Update real-time KPIs
      await this.updateKPIs(event);
      
      // Update cohort tracking
      await this.updateCohortMetrics(event);

      return {
        success: true,
        data: { eventId: event.id, tracked: true }
      };

    } catch (error) {
      console.error('Event tracking error:', error);
      return {
        success: false,
        error: 'Failed to track event'
      };
    }
  }

  /**
   * Get real-time dashboard metrics
   */
  getDashboardMetrics(timeframe = '24h', cohort = null) {
    try {
      const cutoffDate = this.getTimeframeCutoff(timeframe);
      let relevantEvents = this.events.filter(
        event => new Date(event.timestamp) >= cutoffDate
      );

      // Filter by cohort if specified
      if (cohort) {
        const cohortUsers = this.getCohortUsers(cohort);
        relevantEvents = relevantEvents.filter(event => 
          cohortUsers.includes(event.userId)
        );
      }

      const metrics = {
        timeframe,
        cohort,
        generatedAt: new Date().toISOString(),
        
        // Core KPIs
        kpis: {
          onboardingCompletion: this.calculateOnboardingCompletion(relevantEvents),
          contradictionsPerHundredViews: this.calculateContradictionRate(relevantEvents),
          metroPointsRedemption: this.calculateRedemptionRate(relevantEvents),
          dailyActiveUsers: this.calculateDAU(relevantEvents),
          monthlyActiveUsers: this.calculateMAU(relevantEvents),
          retentionRate: this.calculateRetention(relevantEvents, timeframe)
        },
        
        // User engagement metrics
        engagement: {
          totalEvents: relevantEvents.length,
          uniqueUsers: new Set(relevantEvents.map(e => e.userId)).size,
          averageSessionDuration: this.calculateAverageSessionDuration(relevantEvents),
          topEvents: this.getTopEvents(relevantEvents),
          userJourney: this.analyzeUserJourney(relevantEvents)
        },
        
        // Content metrics
        content: {
          feedViews: this.countEventsByName(relevantEvents, 'feed_viewed'),
          contentShares: this.countEventsByName(relevantEvents, 'content_shared'),
          flagsSubmitted: this.countEventsByName(relevantEvents, 'flag_submitted'),
          quizzesCompleted: this.countEventsByName(relevantEvents, 'quiz_completed'),
          contradictionsFound: this.countEventsByName(relevantEvents, 'contradiction_detected')
        },
        
        // Conversion funnel
        funnel: {
          landingPageViews: this.countEventsByName(relevantEvents, 'landing_viewed'),
          onboardingStarted: this.countEventsByName(relevantEvents, 'onboarding_started'),
          onboardingCompleted: this.countEventsByName(relevantEvents, 'onboarding_completed'),
          firstFeedView: this.countEventsByName(relevantEvents, 'first_feed_view'),
          firstQuizTaken: this.countEventsByName(relevantEvents, 'first_quiz_taken'),
          firstRewardRedeemed: this.countEventsByName(relevantEvents, 'first_reward_redeemed')
        }
      };

      return {
        success: true,
        data: metrics
      };

    } catch (error) {
      console.error('Dashboard metrics error:', error);
      return {
        success: false,
        error: 'Failed to generate dashboard metrics'
      };
    }
  }

  /**
   * Get campaign-specific analytics
   */
  getCampaignAnalytics(campaignId, timeframe = '30d') {
    try {
      const cutoffDate = this.getTimeframeCutoff(timeframe);
      const campaignEvents = this.events.filter(event => 
        event.properties.campaignId === campaignId &&
        new Date(event.timestamp) >= cutoffDate
      );

      const analytics = {
        campaignId,
        timeframe,
        generatedAt: new Date().toISOString(),
        
        overview: {
          totalEvents: campaignEvents.length,
          uniqueUsers: new Set(campaignEvents.map(e => e.userId)).size,
          conversionRate: this.calculateCampaignConversion(campaignEvents),
          averageEngagementTime: this.calculateAverageEngagement(campaignEvents)
        },
        
        performance: {
          impressions: this.countEventsByName(campaignEvents, 'campaign_impression'),
          clicks: this.countEventsByName(campaignEvents, 'campaign_click'),
          conversions: this.countEventsByName(campaignEvents, 'campaign_conversion'),
          clickThroughRate: this.calculateCTR(campaignEvents),
          costPerConversion: this.calculateCPC(campaignEvents)
        },
        
        demographics: this.analyzeCampaignDemographics(campaignEvents),
        timeline: this.generateCampaignTimeline(campaignEvents),
        topPerformingContent: this.getTopPerformingContent(campaignEvents)
      };

      return {
        success: true,
        data: analytics
      };

    } catch (error) {
      console.error('Campaign analytics error:', error);
      return {
        success: false,
        error: 'Failed to generate campaign analytics'
      };
    }
  }

  /**
   * Feature flag management for pilot cohorts
   */
  checkFeatureFlag(flagName, userId, userProperties = {}) {
    try {
      const flag = this.featureFlags.get(flagName);
      
      if (!flag || !flag.enabled) {
        return { enabled: false, reason: 'flag_disabled' };
      }

      // Check cohort eligibility
      const userCohort = this.getUserCohort(userId, userProperties);
      
      if (flag.cohort !== 'all' && flag.cohort !== userCohort) {
        return { enabled: false, reason: 'cohort_mismatch' };
      }

      // Track feature flag exposure
      this.trackEvent('feature_flag_exposed', userId, {
        flagName,
        cohort: userCohort,
        features: flag.features
      });

      return {
        enabled: true,
        features: flag.features,
        cohort: userCohort,
        metadata: flag
      };

    } catch (error) {
      console.error('Feature flag check error:', error);
      return { enabled: false, reason: 'error' };
    }
  }

  /**
   * User feedback collection and analysis
   */
  async collectFeedback(userId, feedbackType, data, metadata = {}) {
    try {
      const feedback = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: feedbackType,
        data,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          sessionId: this.getOrCreateSession(userId),
          userCohort: this.getUserCohort(userId, metadata.userProperties || {})
        },
        processed: false,
        sentiment: this.analyzeSentiment(data.text || data.comment || '')
      };

      // Track as analytics event
      await this.trackEvent('feedback_submitted', userId, {
        feedbackType,
        sentiment: feedback.sentiment,
        hasText: !!(data.text || data.comment),
        rating: data.rating || null
      });

      return {
        success: true,
        data: { feedbackId: feedback.id, sentiment: feedback.sentiment }
      };

    } catch (error) {
      console.error('Feedback collection error:', error);
      return {
        success: false,
        error: 'Failed to collect feedback'
      };
    }
  }

  /**
   * Cohort analysis for pilot groups
   */
  getCohortAnalysis(cohortId, timeframe = '30d') {
    try {
      const cutoffDate = this.getTimeframeCutoff(timeframe);
      const cohortUsers = this.getCohortUsers(cohortId);
      const cohortEvents = this.events.filter(event => 
        cohortUsers.includes(event.userId) &&
        new Date(event.timestamp) >= cutoffDate
      );

      const analysis = {
        cohortId,
        timeframe,
        userCount: cohortUsers.length,
        generatedAt: new Date().toISOString(),
        
        engagement: {
          activeUsers: new Set(cohortEvents.map(e => e.userId)).size,
          averageSessionsPerUser: this.calculateAverageSessionsPerUser(cohortEvents),
          averageEventsPerUser: cohortEvents.length / cohortUsers.length,
          retentionRate: this.calculateCohortRetention(cohortId, timeframe)
        },
        
        behavior: {
          topActions: this.getTopEvents(cohortEvents),
          conversionFunnel: this.analyzeCohortFunnel(cohortEvents),
          featureAdoption: this.analyzeCohortFeatureAdoption(cohortEvents),
          timeToValue: this.calculateTimeToValue(cohortEvents)
        },
        
        performance: {
          onboardingCompletion: this.calculateOnboardingCompletion(cohortEvents),
          quizParticipation: this.calculateQuizParticipation(cohortEvents),
          rewardRedemption: this.calculateRedemptionRate(cohortEvents),
          contentEngagement: this.calculateContentEngagement(cohortEvents)
        }
      };

      return {
        success: true,
        data: analysis
      };

    } catch (error) {
      console.error('Cohort analysis error:', error);
      return {
        success: false,
        error: 'Failed to generate cohort analysis'
      };
    }
  }

  /**
   * Helper methods for calculations
   */
  getOrCreateSession(userId) {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, {
        id: `session_${Date.now()}_${userId}`,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        eventCount: 0
      });
    }
    
    const session = this.userSessions.get(userId);
    session.lastActivity = new Date().toISOString();
    session.eventCount++;
    
    return session.id;
  }

  async updateKPIs(event) {
    // Update onboarding completion rate
    if (event.eventName === 'onboarding_started') {
      this.kpis.onboardingCompletion.started++;
    } else if (event.eventName === 'onboarding_completed') {
      this.kpis.onboardingCompletion.completed++;
    }

    // Update contradiction detection rate
    if (event.eventName === 'feed_viewed') {
      this.kpis.contradictionsPerHundredViews.views++;
    } else if (event.eventName === 'contradiction_detected') {
      this.kpis.contradictionsPerHundredViews.contradictions++;
    }

    // Update MetroPoints redemption rate
    if (event.eventName === 'metropoints_earned') {
      this.kpis.metroPointsRedemption.earned += event.properties.amount || 1;
    } else if (event.eventName === 'reward_redeemed') {
      this.kpis.metroPointsRedemption.redeemed += event.properties.cost || 1;
    }

    // Update DAU/MAU
    const today = new Date().toDateString();
    const thisMonth = new Date().toISOString().substring(0, 7);
    
    this.kpis.dailyActiveUsers.add(`${today}_${event.userId}`);
    this.kpis.monthlyActiveUsers.add(`${thisMonth}_${event.userId}`);
  }

  calculateOnboardingCompletion(events) {
    const started = events.filter(e => e.eventName === 'onboarding_started').length;
    const completed = events.filter(e => e.eventName === 'onboarding_completed').length;
    
    return {
      started,
      completed,
      rate: started > 0 ? Math.round((completed / started) * 100) : 0
    };
  }

  calculateContradictionRate(events) {
    const views = events.filter(e => e.eventName === 'feed_viewed').length;
    const contradictions = events.filter(e => e.eventName === 'contradiction_detected').length;
    
    return {
      views,
      contradictions,
      rate: views > 0 ? Math.round((contradictions / views) * 100) : 0
    };
  }

  calculateRedemptionRate(events) {
    const earned = events
      .filter(e => e.eventName === 'metropoints_earned')
      .reduce((sum, e) => sum + (e.properties.amount || 1), 0);
    
    const redeemed = events
      .filter(e => e.eventName === 'reward_redeemed')
      .reduce((sum, e) => sum + (e.properties.cost || 1), 0);
    
    return {
      earned,
      redeemed,
      rate: earned > 0 ? Math.round((redeemed / earned) * 100) : 0
    };
  }

  calculateDAU(events) {
    const today = new Date().toDateString();
    const todayEvents = events.filter(e => 
      new Date(e.timestamp).toDateString() === today
    );
    
    return new Set(todayEvents.map(e => e.userId)).size;
  }

  calculateMAU(events) {
    const thisMonth = new Date().toISOString().substring(0, 7);
    const monthEvents = events.filter(e => 
      e.timestamp.substring(0, 7) === thisMonth
    );
    
    return new Set(monthEvents.map(e => e.userId)).size;
  }

  getUserCohort(userId, userProperties = {}) {
    // Simple cohort assignment based on user properties
    const zipCode = userProperties.zipCode || '';
    
    if (zipCode.startsWith('100')) return 'manhattan_east';
    if (zipCode.startsWith('112')) return 'brooklyn_north';
    if (zipCode.startsWith('113')) return 'queens_central';
    
    return 'general';
  }

  getCohortUsers(cohortId) {
    // Mock cohort user assignment - would be from database in production
    const cohorts = {
      'manhattan_east': ['user_1', 'user_2', 'user_3'],
      'brooklyn_north': ['user_4', 'user_5', 'user_6'],
      'queens_central': ['user_7', 'user_8', 'user_9'],
      'early_adopters': ['user_1', 'user_4', 'user_7'],
      'general': ['user_10', 'user_11', 'user_12']
    };
    
    return cohorts[cohortId] || [];
  }

  countEventsByName(events, eventName) {
    return events.filter(e => e.eventName === eventName).length;
  }

  getTopEvents(events) {
    const eventCounts = {};
    events.forEach(event => {
      eventCounts[event.eventName] = (eventCounts[event.eventName] || 0) + 1;
    });
    
    return Object.entries(eventCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }

  getTimeframeCutoff(timeframe) {
    const now = new Date();
    const cutoffs = {
      '1h': new Date(now.getTime() - 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };
    
    return cutoffs[timeframe] || cutoffs['24h'];
  }

  analyzeSentiment(text) {
    // Simple sentiment analysis - would use proper NLP in production
    const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'helpful'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'confusing', 'broken'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positive = words.filter(word => positiveWords.includes(word)).length;
    const negative = words.filter(word => negativeWords.includes(word)).length;
    
    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }
}