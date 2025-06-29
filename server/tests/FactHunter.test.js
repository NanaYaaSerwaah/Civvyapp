import { describe, it, expect, beforeEach } from 'vitest';
import { FactHunter } from '../services/FactHunter.js';

describe('FactHunter', () => {
  let factHunter;
  
  beforeEach(() => {
    factHunter = new FactHunter();
  });
  
  describe('analyzeContent', () => {
    it('should analyze content and return confidence score', async () => {
      const contentItem = {
        id: 'test_1',
        content: 'NYC budget increased by $2 billion to $8.9 billion total.',
        source: 'Test Source'
      };
      
      const result = await factHunter.analyzeContent(contentItem);
      
      expect(result.contentId).toBe('test_1');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.contradictions)).toBe(true);
    });
    
    it('should detect numerical contradictions', async () => {
      const contentItem = {
        id: 'test_2',
        content: 'The budget is $5 billion. The same budget is actually $8 billion.',
        source: 'Test Source'
      };
      
      const result = await factHunter.analyzeContent(contentItem);
      
      expect(result.contradictions.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
    
    it('should calculate bias score', async () => {
      const contentItem = {
        id: 'test_3',
        content: 'This is absolutely terrible and completely wrong. Everyone knows this is obviously a disaster.',
        source: 'Test Source'
      };
      
      const result = await factHunter.analyzeContent(contentItem);
      
      expect(result.biasScore).toBeGreaterThan(0);
      expect(result.biasScore).toBeLessThanOrEqual(1);
    });
  });
  
  describe('extractClaims', () => {
    it('should extract numerical claims', () => {
      const content = 'The budget is $5.2 billion and affects 2.3 million residents.';
      const claims = factHunter.extractClaims(content);
      
      const numericalClaims = claims.filter(c => c.type === 'numerical');
      expect(numericalClaims.length).toBeGreaterThan(0);
    });
    
    it('should extract policy statements', () => {
      const content = 'The mayor plans to increase funding and will support new legislation.';
      const claims = factHunter.extractClaims(content);
      
      const policyClaims = claims.filter(c => c.type === 'policy');
      expect(policyClaims.length).toBeGreaterThan(0);
    });
  });
  
  describe('calculateBiasScore', () => {
    it('should return higher bias score for biased content', () => {
      const biasedContent = 'This is absolutely terrible and completely wrong. Everyone always does this.';
      const neutralContent = 'The policy was implemented according to the schedule.';
      
      const biasedScore = factHunter.calculateBiasScore(biasedContent);
      const neutralScore = factHunter.calculateBiasScore(neutralContent);
      
      expect(biasedScore).toBeGreaterThan(neutralScore);
    });
  });
});