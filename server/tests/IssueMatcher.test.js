import { describe, it, expect, beforeEach } from 'vitest';
import { IssueMatcher } from '../services/IssueMatcher.js';

describe('IssueMatcher', () => {
  let issueMatcher;
  
  beforeEach(() => {
    issueMatcher = new IssueMatcher();
  });
  
  describe('generateTopicSet', () => {
    it('should generate topics with at least one surprise topic', async () => {
      const preferences = {
        selectedIssues: ['Housing & Rent Control', 'Public Transportation'],
        zipCode: '10001',
        format: 'visual',
        cadence: 'weekly'
      };
      
      const result = await issueMatcher.generateTopicSet(preferences);
      
      expect(result.surpriseTopics.length).toBeGreaterThanOrEqual(1);
      expect(result.baseTopics.length).toBeGreaterThan(0);
      expect(result.diversityScore).toBeGreaterThan(0);
    });
    
    it('should include topics from selected issues', async () => {
      const preferences = {
        selectedIssues: ['Housing & Rent Control'],
        zipCode: '10001',
        format: 'articles',
        cadence: 'daily'
      };
      
      const result = await issueMatcher.generateTopicSet(preferences);
      
      const housingTopics = result.baseTopics.filter(
        topic => topic.category === 'Housing & Rent Control'
      );
      
      expect(housingTopics.length).toBeGreaterThan(0);
    });
    
    it('should respect cadence limits', async () => {
      const preferences = {
        selectedIssues: ['Housing & Rent Control', 'Public Transportation', 'Education & Schools'],
        zipCode: '10001',
        format: 'mixed',
        cadence: 'daily'
      };
      
      const result = await issueMatcher.generateTopicSet(preferences);
      
      // Daily cadence should limit to 3 topics max
      expect(result.baseTopics.length).toBeLessThanOrEqual(3);
    });
  });
  
  describe('calculateDiversityScore', () => {
    it('should calculate diversity score correctly', () => {
      const baseTopics = [
        { category: 'Housing & Rent Control' },
        { category: 'Public Transportation' }
      ];
      const surpriseTopics = [
        { category: 'surprise' }
      ];
      
      const score = issueMatcher.calculateDiversityScore(baseTopics, surpriseTopics);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
  
  describe('injectSurpriseTopics', () => {
    it('should inject at least one surprise topic', () => {
      const selectedIssues = ['Housing & Rent Control'];
      const surpriseTopics = issueMatcher.injectSurpriseTopics(selectedIssues);
      
      expect(surpriseTopics.length).toBeGreaterThanOrEqual(1);
      expect(surpriseTopics[0].type).toBe('surprise');
    });
    
    it('should inject 30% surprise topics with minimum of 1', () => {
      const selectedIssues = ['Housing & Rent Control', 'Public Transportation', 'Education & Schools'];
      const surpriseTopics = issueMatcher.injectSurpriseTopics(selectedIssues);
      
      // 30% of 3 = 0.9, rounded up to 1
      expect(surpriseTopics.length).toBeGreaterThanOrEqual(1);
    });
  });
});