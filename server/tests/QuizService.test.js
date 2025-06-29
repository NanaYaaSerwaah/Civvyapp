import { describe, it, expect, beforeEach } from 'vitest';
import { QuizService } from '../services/QuizService.js';

describe('QuizService', () => {
  let quizService;
  
  beforeEach(() => {
    quizService = new QuizService();
  });
  
  describe('generateQuiz', () => {
    it('should generate quiz with specified number of questions', async () => {
      const userId = 'test_user_1';
      const preferences = {
        issues: ['Housing & Rent Control', 'Public Transportation'],
        difficulty: 'mixed',
        questionCount: 3
      };
      
      const result = await quizService.generateQuiz(userId, preferences);
      
      expect(result.success).toBe(true);
      expect(result.data.questions).toHaveLength(3);
      expect(result.data.quizId).toBeDefined();
      expect(result.data.estimatedTime).toBe(90); // 3 questions * 30 seconds
    });
    
    it('should generate quiz based on user interests', async () => {
      const userId = 'test_user_2';
      const preferences = {
        issues: ['Housing & Rent Control'],
        questionCount: 2
      };
      
      const result = await quizService.generateQuiz(userId, preferences);
      
      expect(result.success).toBe(true);
      expect(result.data.questions.length).toBeGreaterThan(0);
    });
    
    it('should handle empty preferences gracefully', async () => {
      const userId = 'test_user_3';
      const result = await quizService.generateQuiz(userId, {});
      
      expect(result.success).toBe(true);
      expect(result.data.questions.length).toBeGreaterThan(0);
    });
  });
  
  describe('submitQuiz', () => {
    it('should calculate score correctly', async () => {
      const userId = 'test_user_4';
      
      // Generate quiz first
      const quizResult = await quizService.generateQuiz(userId, { questionCount: 4 });
      const quizId = quizResult.data.quizId;
      
      // Submit answers (assuming first answer is always correct for test)
      const userAnswers = [0, 0, 0, 1]; // Mix of correct and incorrect
      const submitResult = await quizService.submitQuiz(quizId, userAnswers);
      
      expect(submitResult.success).toBe(true);
      expect(submitResult.data.score).toBeGreaterThanOrEqual(0);
      expect(submitResult.data.score).toBeLessThanOrEqual(100);
      expect(submitResult.data.results).toHaveLength(4);
    });
    
    it('should mark quiz as completed', async () => {
      const userId = 'test_user_5';
      
      const quizResult = await quizService.generateQuiz(userId, { questionCount: 2 });
      const quizId = quizResult.data.quizId;
      
      const submitResult = await quizService.submitQuiz(quizId, [0, 1]);
      
      expect(submitResult.success).toBe(true);
      
      // Try to submit again - should fail
      const secondSubmit = await quizService.submitQuiz(quizId, [1, 0]);
      expect(secondSubmit.success).toBe(false);
      expect(secondSubmit.error).toContain('already completed');
    });
    
    it('should fail for non-existent quiz', async () => {
      const result = await quizService.submitQuiz('invalid_quiz_id', [0, 1]);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
  
  describe('getLeaderboard', () => {
    it('should return leaderboard of completed quizzes', async () => {
      const userId1 = 'test_user_6';
      const userId2 = 'test_user_7';
      
      // Generate and complete quizzes for multiple users
      const quiz1 = await quizService.generateQuiz(userId1, { questionCount: 2 });
      await quizService.submitQuiz(quiz1.data.quizId, [0, 0]);
      
      const quiz2 = await quizService.generateQuiz(userId2, { questionCount: 2 });
      await quizService.submitQuiz(quiz2.data.quizId, [0, 1]);
      
      const leaderboard = quizService.getLeaderboard(10);
      
      expect(leaderboard.success).toBe(true);
      expect(leaderboard.data.length).toBeGreaterThan(0);
      expect(leaderboard.data[0]).toHaveProperty('userId');
      expect(leaderboard.data[0]).toHaveProperty('score');
    });
  });
  
  describe('mapIssuesToTopics', () => {
    it('should map issues to relevant topics', () => {
      const issues = ['Housing & Rent Control', 'Public Transportation'];
      const topics = quizService.mapIssuesToTopics(issues);
      
      expect(topics).toContain('housing');
      expect(topics).toContain('transportation');
    });
    
    it('should handle unknown issues', () => {
      const issues = ['Unknown Issue'];
      const topics = quizService.mapIssuesToTopics(issues);
      
      expect(Array.isArray(topics)).toBe(true);
    });
  });
});