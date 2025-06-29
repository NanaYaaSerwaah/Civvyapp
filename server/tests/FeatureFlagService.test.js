import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureFlagService } from '../services/FeatureFlagService.js';

describe('FeatureFlagService', () => {
  let featureFlagService;
  
  beforeEach(() => {
    featureFlagService = new FeatureFlagService();
  });
  
  describe('isEnabled', () => {
    it('should return enabled flag for valid user and cohort', () => {
      const userId = 'user_1';
      const flagName = 'pilot_manhattan_east';
      const userContext = { zipCode: '10001' };
      
      const result = featureFlagService.isEnabled(flagName, userId, userContext);
      
      expect(result.enabled).toBe(true);
      expect(result.features).toBeDefined();
      expect(result.cohort).toBe('manhattan_east');
    });
    
    it('should return disabled for non-existent flag', () => {
      const userId = 'user_1';
      const flagName = 'non_existent_flag';
      
      const result = featureFlagService.isEnabled(flagName, userId);
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('flag_not_found');
    });
    
    it('should respect cohort restrictions', () => {
      const userId = 'user_1';
      const flagName = 'pilot_brooklyn_north';
      const userContext = { zipCode: '10001' }; // Manhattan ZIP
      
      const result = featureFlagService.isEnabled(flagName, userId, userContext);
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('cohort_mismatch');
    });
    
    it('should respect rollout percentage', () => {
      const userId = 'user_consistent_hash';
      const flagName = 'enhanced_feed_algorithm'; // 50% rollout
      
      const result = featureFlagService.isEnabled(flagName, userId);
      
      // Result should be consistent for same user
      const result2 = featureFlagService.isEnabled(flagName, userId);
      expect(result.enabled).toBe(result2.enabled);
    });
    
    it('should check date ranges', () => {
      // Create a flag with future start date
      featureFlagService.createFlag('future_flag', {
        enabled: true,
        startDate: '2030-01-01',
        cohorts: ['all']
      });
      
      const result = featureFlagService.isEnabled('future_flag', 'user_1');
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('not_started');
    });
  });
  
  describe('getUserFeatures', () => {
    it('should return all enabled features for user', () => {
      const userId = 'user_1';
      const userContext = { zipCode: '10001', isEarlyAdopter: true };
      
      const result = featureFlagService.getUserFeatures(userId, userContext);
      
      expect(result.features).toBeDefined();
      expect(Array.isArray(result.features)).toBe(true);
      expect(result.flags).toBeDefined();
      expect(result.cohort).toBeDefined();
    });
  });
  
  describe('updateFlag', () => {
    it('should update existing flag', () => {
      const flagName = 'pilot_manhattan_east';
      const updates = { rolloutPercentage: 75 };
      
      const result = featureFlagService.updateFlag(flagName, updates);
      
      expect(result.success).toBe(true);
      expect(result.data.rolloutPercentage).toBe(75);
    });
    
    it('should fail to update non-existent flag', () => {
      const flagName = 'non_existent_flag';
      const updates = { enabled: false };
      
      const result = featureFlagService.updateFlag(flagName, updates);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Flag not found');
    });
  });
  
  describe('createFlag', () => {
    it('should create new flag', () => {
      const flagName = 'new_test_flag';
      const config = {
        enabled: true,
        rolloutPercentage: 25,
        cohorts: ['test_cohort'],
        features: ['test_feature'],
        description: 'Test flag'
      };
      
      const result = featureFlagService.createFlag(flagName, config);
      
      expect(result.success).toBe(true);
      expect(result.data.enabled).toBe(true);
      expect(result.data.rolloutPercentage).toBe(25);
    });
    
    it('should fail to create duplicate flag', () => {
      const flagName = 'pilot_manhattan_east'; // Already exists
      const config = { enabled: true };
      
      const result = featureFlagService.createFlag(flagName, config);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Flag already exists');
    });
  });
  
  describe('getExposureAnalytics', () => {
    it('should generate exposure analytics', () => {
      // Generate some exposures
      featureFlagService.isEnabled('pilot_manhattan_east', 'user_1', { zipCode: '10001' });
      featureFlagService.isEnabled('pilot_manhattan_east', 'user_2', { zipCode: '10001' });
      featureFlagService.isEnabled('pilot_brooklyn_north', 'user_3', { zipCode: '11201' });
      
      const result = featureFlagService.getExposureAnalytics('24h');
      
      expect(result.success).toBe(true);
      expect(result.data.analytics).toBeDefined();
      expect(result.data.totalExposures).toBeGreaterThan(0);
      expect(result.data.uniqueUsers).toBeGreaterThan(0);
    });
  });
  
  describe('getUserCohort', () => {
    it('should determine cohort from ZIP code', () => {
      const userId = 'user_1';
      
      const manhattanCohort = featureFlagService.getUserCohort(userId, { zipCode: '10001' });
      const brooklynCohort = featureFlagService.getUserCohort(userId, { zipCode: '11201' });
      const queensCohort = featureFlagService.getUserCohort(userId, { zipCode: '11301' });
      const generalCohort = featureFlagService.getUserCohort(userId, { zipCode: '90210' });
      
      expect(manhattanCohort).toBe('manhattan_east');
      expect(brooklynCohort).toBe('brooklyn_north');
      expect(queensCohort).toBe('queens_central');
      expect(generalCohort).toBe('general');
    });
    
    it('should prioritize special cohorts', () => {
      const userId = 'user_1';
      
      const earlyAdopterCohort = featureFlagService.getUserCohort(userId, { 
        zipCode: '10001',
        isEarlyAdopter: true 
      });
      
      const adminCohort = featureFlagService.getUserCohort(userId, { 
        zipCode: '10001',
        isAdmin: true 
      });
      
      expect(earlyAdopterCohort).toBe('early_adopters');
      expect(adminCohort).toBe('admin');
    });
  });
  
  describe('hashUserId', () => {
    it('should generate consistent hash for same input', () => {
      const userId = 'user_123';
      const salt = 'test_flag';
      
      const hash1 = featureFlagService.hashUserId(userId, salt);
      const hash2 = featureFlagService.hashUserId(userId, salt);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('number');
    });
    
    it('should generate different hashes for different inputs', () => {
      const hash1 = featureFlagService.hashUserId('user_1', 'flag_1');
      const hash2 = featureFlagService.hashUserId('user_2', 'flag_1');
      const hash3 = featureFlagService.hashUserId('user_1', 'flag_2');
      
      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash2).not.toBe(hash3);
    });
  });
});