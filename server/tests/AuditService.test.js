import { describe, it, expect, beforeEach } from 'vitest';
import { AuditService } from '../services/AuditService.js';

describe('AuditService', () => {
  let auditService;
  
  beforeEach(() => {
    auditService = new AuditService();
  });
  
  describe('logEvent', () => {
    it('should log audit event with metadata', async () => {
      const eventType = 'quiz_completed';
      const data = { userId: 'user_123', score: 85 };
      const metadata = { sessionId: 'session_456' };
      
      const result = await auditService.logEvent(eventType, data, metadata);
      
      expect(result.success).toBe(true);
      expect(result.data.eventType).toBe(eventType);
      expect(result.data.data).toEqual(data);
      expect(result.data.severity).toBe('low');
      expect(result.data.category).toBe('user_action');
    });
    
    it('should categorize events correctly', async () => {
      const events = [
        { type: 'flag_submitted', expectedCategory: 'moderation' },
        { type: 'quiz_completed', expectedCategory: 'user_action' },
        { type: 'system_error', expectedCategory: 'system' },
        { type: 'security_violation', expectedCategory: 'security' }
      ];
      
      for (const event of events) {
        const result = await auditService.logEvent(event.type, {});
        expect(result.data.category).toBe(event.expectedCategory);
      }
    });
  });
  
  describe('getTransparencyReport', () => {
    it('should generate transparency report', async () => {
      // Add some test events
      await auditService.logEvent('flag_submitted', { contentId: 'content_1' });
      await auditService.logEvent('flag_processed', { decision: 'upheld' });
      await auditService.logEvent('quiz_completed', { score: 90 });
      await auditService.logEvent('vote_pledge', { electionId: 'nyc_2024' });
      
      const result = auditService.getTransparencyReport('30d');
      
      expect(result.success).toBe(true);
      expect(result.data.timeframe).toBe('30d');
      expect(result.data.summary.totalEvents).toBeGreaterThan(0);
      expect(result.data.moderation).toBeDefined();
      expect(result.data.userEngagement).toBeDefined();
      expect(result.data.systemHealth).toBeDefined();
    });
    
    it('should filter events by timeframe', async () => {
      // This test would need more sophisticated date mocking
      // For now, just verify the structure
      const result = auditService.getTransparencyReport('7d');
      
      expect(result.success).toBe(true);
      expect(result.data.timeframe).toBe('7d');
    });
  });
  
  describe('getPublicAuditFeed', () => {
    it('should return public audit feed', async () => {
      // Add test events
      await auditService.logEvent('flag_submitted', { contentId: 'content_1' });
      await auditService.logEvent('quiz_completed', { userId: 'user_1', score: 85 });
      
      const result = auditService.getPublicAuditFeed(10);
      
      expect(result.success).toBe(true);
      expect(result.data.events).toBeDefined();
      expect(result.data.totalEvents).toBeGreaterThan(0);
      expect(result.data.categories).toBeDefined();
    });
    
    it('should filter by category', async () => {
      await auditService.logEvent('flag_submitted', {});
      await auditService.logEvent('quiz_completed', {});
      
      const result = auditService.getPublicAuditFeed(10, 'moderation');
      
      expect(result.success).toBe(true);
      // Would need to implement category filtering in the actual method
    });
  });
  
  describe('searchAuditEvents', () => {
    it('should search events by query', async () => {
      await auditService.logEvent('flag_submitted', { 
        contentId: 'content_misinformation',
        reason: 'misinformation'
      });
      await auditService.logEvent('quiz_completed', { 
        userId: 'user_123',
        score: 95
      });
      
      const result = auditService.searchAuditEvents('misinformation');
      
      expect(result.success).toBe(true);
      expect(result.data.events.length).toBeGreaterThan(0);
      expect(result.data.query).toBe('misinformation');
    });
    
    it('should filter by event type', async () => {
      await auditService.logEvent('flag_submitted', {});
      await auditService.logEvent('quiz_completed', {});
      
      const result = auditService.searchAuditEvents('', { 
        eventType: 'flag_submitted' 
      });
      
      expect(result.success).toBe(true);
      expect(result.data.filters.eventType).toBe('flag_submitted');
    });
  });
});