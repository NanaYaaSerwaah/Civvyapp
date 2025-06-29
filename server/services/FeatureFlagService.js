/**
 * FeatureFlagService - Feature flag management for pilot cohorts
 * Enables controlled rollout and A/B testing capabilities
 */
export class FeatureFlagService {
  constructor() {
    this.flags = new Map([
      // Pilot precinct flags
      ['pilot_manhattan_east', {
        enabled: true,
        rolloutPercentage: 100,
        cohorts: ['manhattan_east'],
        features: ['enhanced_feed', 'live_townhall', 'advanced_analytics'],
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        description: 'Manhattan East pilot program with full feature set'
      }],
      
      ['pilot_brooklyn_north', {
        enabled: true,
        rolloutPercentage: 100,
        cohorts: ['brooklyn_north'],
        features: ['enhanced_feed', 'basic_analytics'],
        startDate: '2025-01-15',
        endDate: '2025-03-31',
        description: 'Brooklyn North pilot with basic feature set'
      }],
      
      ['pilot_queens_central', {
        enabled: false,
        rolloutPercentage: 0,
        cohorts: ['queens_central'],
        features: [],
        startDate: '2025-02-01',
        endDate: '2025-04-30',
        description: 'Queens Central pilot - not yet activated'
      }],
      
      // Feature-specific flags
      ['enhanced_feed_algorithm', {
        enabled: true,
        rolloutPercentage: 50,
        cohorts: ['all'],
        features: ['ai_contradiction_detection', 'personalized_ranking'],
        startDate: '2025-01-01',
        endDate: null,
        description: 'Enhanced feed algorithm with AI-powered features'
      }],
      
      ['live_townhall_beta', {
        enabled: true,
        rolloutPercentage: 25,
        cohorts: ['early_adopters', 'manhattan_east'],
        features: ['live_streaming', 'real_time_qa', 'candidate_verification'],
        startDate: '2025-01-10',
        endDate: '2025-06-01',
        description: 'Live town hall beta testing'
      }],
      
      ['premium_rewards', {
        enabled: true,
        rolloutPercentage: 100,
        cohorts: ['early_adopters'],
        features: ['exclusive_rewards', 'bonus_multipliers', 'priority_support'],
        startDate: '2025-01-01',
        endDate: null,
        description: 'Premium rewards for early adopters'
      }],
      
      ['advanced_analytics_dashboard', {
        enabled: true,
        rolloutPercentage: 100,
        cohorts: ['admin', 'pilot_coordinators'],
        features: ['real_time_metrics', 'cohort_analysis', 'export_capabilities'],
        startDate: '2025-01-01',
        endDate: null,
        description: 'Advanced analytics dashboard for administrators'
      }]
    ]);
    
    this.userCohorts = new Map();
    this.flagExposures = [];
  }

  /**
   * Check if feature flag is enabled for user
   */
  isEnabled(flagName, userId, userContext = {}) {
    try {
      const flag = this.flags.get(flagName);
      
      if (!flag) {
        this.logExposure(flagName, userId, false, 'flag_not_found');
        return { enabled: false, reason: 'flag_not_found' };
      }

      // Check if flag is globally enabled
      if (!flag.enabled) {
        this.logExposure(flagName, userId, false, 'flag_disabled');
        return { enabled: false, reason: 'flag_disabled' };
      }

      // Check date range
      const now = new Date();
      const startDate = flag.startDate ? new Date(flag.startDate) : null;
      const endDate = flag.endDate ? new Date(flag.endDate) : null;
      
      if (startDate && now < startDate) {
        this.logExposure(flagName, userId, false, 'not_started');
        return { enabled: false, reason: 'not_started' };
      }
      
      if (endDate && now > endDate) {
        this.logExposure(flagName, userId, false, 'expired');
        return { enabled: false, reason: 'expired' };
      }

      // Check cohort eligibility
      const userCohort = this.getUserCohort(userId, userContext);
      if (!flag.cohorts.includes('all') && !flag.cohorts.includes(userCohort)) {
        this.logExposure(flagName, userId, false, 'cohort_mismatch');
        return { enabled: false, reason: 'cohort_mismatch', userCohort };
      }

      // Check rollout percentage
      if (flag.rolloutPercentage < 100) {
        const userHash = this.hashUserId(userId, flagName);
        const userPercentile = userHash % 100;
        
        if (userPercentile >= flag.rolloutPercentage) {
          this.logExposure(flagName, userId, false, 'rollout_percentage');
          return { enabled: false, reason: 'rollout_percentage' };
        }
      }

      // Flag is enabled for this user
      this.logExposure(flagName, userId, true, 'enabled');
      return {
        enabled: true,
        features: flag.features,
        cohort: userCohort,
        metadata: {
          rolloutPercentage: flag.rolloutPercentage,
          description: flag.description
        }
      };

    } catch (error) {
      console.error('Feature flag check error:', error);
      this.logExposure(flagName, userId, false, 'error');
      return { enabled: false, reason: 'error' };
    }
  }

  /**
   * Get all enabled features for a user
   */
  getUserFeatures(userId, userContext = {}) {
    const enabledFeatures = new Set();
    const flagResults = {};
    
    for (const [flagName, flag] of this.flags.entries()) {
      const result = this.isEnabled(flagName, userId, userContext);
      flagResults[flagName] = result;
      
      if (result.enabled && result.features) {
        result.features.forEach(feature => enabledFeatures.add(feature));
      }
    }
    
    return {
      features: Array.from(enabledFeatures),
      flags: flagResults,
      cohort: this.getUserCohort(userId, userContext)
    };
  }

  /**
   * Update feature flag configuration
   */
  updateFlag(flagName, updates) {
    try {
      const existingFlag = this.flags.get(flagName);
      
      if (!existingFlag) {
        return { success: false, error: 'Flag not found' };
      }

      const updatedFlag = { ...existingFlag, ...updates };
      this.flags.set(flagName, updatedFlag);

      return {
        success: true,
        data: updatedFlag
      };

    } catch (error) {
      console.error('Flag update error:', error);
      return { success: false, error: 'Failed to update flag' };
    }
  }

  /**
   * Create new feature flag
   */
  createFlag(flagName, config) {
    try {
      if (this.flags.has(flagName)) {
        return { success: false, error: 'Flag already exists' };
      }

      const flag = {
        enabled: config.enabled || false,
        rolloutPercentage: config.rolloutPercentage || 0,
        cohorts: config.cohorts || ['all'],
        features: config.features || [],
        startDate: config.startDate || null,
        endDate: config.endDate || null,
        description: config.description || '',
        createdAt: new Date().toISOString()
      };

      this.flags.set(flagName, flag);

      return {
        success: true,
        data: flag
      };

    } catch (error) {
      console.error('Flag creation error:', error);
      return { success: false, error: 'Failed to create flag' };
    }
  }

  /**
   * Get flag exposure analytics
   */
  getExposureAnalytics(timeframe = '24h') {
    try {
      const cutoffDate = this.getTimeframeCutoff(timeframe);
      const relevantExposures = this.flagExposures.filter(
        exposure => new Date(exposure.timestamp) >= cutoffDate
      );

      const analytics = {};
      
      for (const [flagName] of this.flags.entries()) {
        const flagExposures = relevantExposures.filter(e => e.flagName === flagName);
        const enabled = flagExposures.filter(e => e.enabled).length;
        const total = flagExposures.length;
        
        analytics[flagName] = {
          totalExposures: total,
          enabledExposures: enabled,
          enablementRate: total > 0 ? Math.round((enabled / total) * 100) : 0,
          uniqueUsers: new Set(flagExposures.map(e => e.userId)).size,
          reasons: this.groupExposureReasons(flagExposures)
        };
      }

      return {
        success: true,
        data: {
          timeframe,
          analytics,
          totalExposures: relevantExposures.length,
          uniqueUsers: new Set(relevantExposures.map(e => e.userId)).size
        }
      };

    } catch (error) {
      console.error('Exposure analytics error:', error);
      return { success: false, error: 'Failed to generate analytics' };
    }
  }

  /**
   * Helper methods
   */
  getUserCohort(userId, userContext = {}) {
    // Check if cohort is cached
    if (this.userCohorts.has(userId)) {
      return this.userCohorts.get(userId);
    }

    // Determine cohort based on user context
    let cohort = 'general';
    
    if (userContext.zipCode) {
      const zipCode = userContext.zipCode.toString();
      if (zipCode.startsWith('100')) cohort = 'manhattan_east';
      else if (zipCode.startsWith('112')) cohort = 'brooklyn_north';
      else if (zipCode.startsWith('113')) cohort = 'queens_central';
    }
    
    if (userContext.isEarlyAdopter) {
      cohort = 'early_adopters';
    }
    
    if (userContext.isAdmin) {
      cohort = 'admin';
    }
    
    if (userContext.isPilotCoordinator) {
      cohort = 'pilot_coordinators';
    }

    // Cache the cohort
    this.userCohorts.set(userId, cohort);
    return cohort;
  }

  hashUserId(userId, salt = '') {
    // Simple hash function for consistent user bucketing
    let hash = 0;
    const str = userId + salt;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }

  logExposure(flagName, userId, enabled, reason) {
    this.flagExposures.push({
      id: `exposure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      flagName,
      userId,
      enabled,
      reason,
      timestamp: new Date().toISOString()
    });

    // Keep only recent exposures to prevent memory issues
    if (this.flagExposures.length > 10000) {
      this.flagExposures = this.flagExposures.slice(-5000);
    }
  }

  groupExposureReasons(exposures) {
    const reasons = {};
    exposures.forEach(exposure => {
      reasons[exposure.reason] = (reasons[exposure.reason] || 0) + 1;
    });
    return reasons;
  }

  getTimeframeCutoff(timeframe) {
    const now = new Date();
    const cutoffs = {
      '1h': new Date(now.getTime() - 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    };
    
    return cutoffs[timeframe] || cutoffs['24h'];
  }
}