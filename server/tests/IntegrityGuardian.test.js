import { describe, it, expect, beforeEach } from 'vitest';
import { IntegrityGuardian } from '../services/IntegrityGuardian.js';

describe('IntegrityGuardian', () => {
  let integrityGuardian;
  
  beforeEach(() => {
    integrityGuardian = new IntegrityGuardian();
  });
  
  describe('calculateUserReputation', () => {
    it('should calculate reputation with base score of 50', async () => {
      const userId = 'test_user_1';
      const result = await integrityGuardian.calculateUserReputation(userId);
      
      expect(result.success).toBe(true);
      expect(result.data.reputation).toBe(50); // Base reputation
      expect(result.data.trustLevel).toBe('medium');
    });
    
    it('should increase reputation for positive actions', async () => {
      const userId = 'test_user_2';
      const userHistory = {
        flag_verified: 2,
        quiz_perfect_score: 1,
        vote_pledge_fulfilled: 1
      };
      
      const result = await integrityGuardian.calculateUserReputation(userId, userHistory);
      
      expect(result.success).toBe(true);
      expect(result.data.reputation).toBeGreaterThan(50);
      expect(result.data.trustLevel).toBe('high');
    });
    
    it('should decrease reputation for negative actions', async () => {
      const userId = 'test_user_3';
      const userHistory = {
        flag_rejected: 3,
        community_reports: 2
      };
      
      const result = await integrityGuardian.calculateUserReputation(userId, userHistory);
      
      expect(result.success).toBe(true);
      expect(result.data.reputation).toBeLessThan(50);
      expect(result.data.trustLevel).toBe('low');
    });
  });
  
  describe('logModerationAction', () => {
    it('should log moderation action with hash', async () => {
      const action = 'flag_processed';
      const metadata = {
        contentId: 'content_123',
        userId: 'user_456',
        decision: 'upheld',
        reason: 'misinformation'
      };
      
      const result = await integrityGuardian.logModerationAction(action, metadata);
      
      expect(result.success).toBe(true);
      expect(result.data.id).toBeDefined();
      expect(result.data.hash).toBeDefined();
      expect(result.data.action).toBe(action);
      expect(result.data.metadata).toEqual(metadata);
    });
    
    it('should link to previous entry for integrity', async () => {
      // Log first action
      const first = await integrityGuardian.logModerationAction('flag_submitted', {
        contentId: 'content_1'
      });
      
      // Log second action
      const second = await integrityGuardian.logModerationAction('flag_processed', {
        contentId: 'content_1'
      });
      
      expect(second.data.previousHash).toBe(first.data.hash);
    });
  });
  
  describe('verifyAuditIntegrity', () => {
    it('should verify integrity of audit log', async () => {
      // Add some entries
      await integrityGuardian.logModerationAction('flag_submitted', { contentId: 'test' });
      await integrityGuardian.logModerationAction('flag_processed', { contentId: 'test' });
      
      const isValid = integrityGuardian.verifyAuditIntegrity();
      expect(isValid).toBe(true);
    });
  });
  
  describe('processFlagWithReputation', () => {
    it('should weight flags based on user reputation', async () => {
      const userId = 'test_user_4';
      
      // Set high reputation user
      await integrityGuardian.calculateUserReputation(userId, {
        flag_verified: 5,
        quiz_perfect_score: 3
      });
      
      const flagData = {
        userId,
        contentId: 'content_123',
        reason: 'misinformation',
        description: 'This contains false information'
      };
      
      const result = await integrityGuardian.processFlagWithReputation(flagData);
      
      expect(result.success).toBe(true);
      expect(result.data.weight).toBeGreaterThan(1); // High reputation = higher weight
      expect(result.data.priority).toBeGreaterThan(5);
    });
    
    it('should reduce weight for low reputation users', async () => {
      const userId = 'test_user_5';
      
      // Set low reputation user
      await integrityGuardian.calculateUserReputation(userId, {
        flag_rejected: 5,
        community_reports: 2
      });
      
      const flagData = {
        userId,
        contentId: 'content_456',
        reason: 'spam',
        description: 'This is spam'
      };
      
      const result = await integrityGuardian.processFlagWithReputation(flagData);
      
      expect(result.success).toBe(true);
      expect(result.data.weight).toBeLessThan(1); // Low reputation = lower weight
    });
  });
  
  describe('getUserTrustMetrics', () => {
    it('should return trust metrics for user', async () => {
      const userId = 'test_user_6';
      
      // Calculate reputation first
      await integrityGuardian.calculateUserReputation(userId, {
        flag_verified: 3,
        quiz_perfect_score: 2
      });
      
      const result = integrityGuardian.getUserTrustMetrics(userId);
      
      expect(result.success).toBe(true);
      expect(result.data.userId).toBe(userId);
      expect(result.data.reputation).toBeGreaterThan(50);
      expect(result.data.trustLevel).toBeDefined();
      expect(result.data.flagWeight).toBeGreaterThan(0);
      expect(typeof result.data.canModerate).toBe('boolean');
      expect(Array.isArray(result.data.restrictions)).toBe(true);
    });
  });
  
  describe('getPublicAuditFeed', () => {
    it('should return public audit feed without sensitive data', async () => {
      // Add some audit entries
      await integrityGuardian.logModerationAction('flag_submitted', {
        contentId: 'content_123',
        userId: 'user_456',
        flagReason: 'misinformation'
      });
      
      const result = integrityGuardian.getPublicAuditFeed(10, 0);
      
      expect(result.success).toBe(true);
      expect(result.data.entries).toBeDefined();
      expect(result.data.integrityVerified).toBe(true);
      
      // Check that sensitive data is excluded
      if (result.data.entries.length > 0) {
        const entry = result.data.entries[0];
        expect(entry.userId).toBeUndefined(); // Should not include user ID
        expect(entry.hash).toBeDefined(); // Should include hash for verification
      }
    });
  });
});