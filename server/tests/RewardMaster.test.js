import { describe, it, expect, beforeEach } from 'vitest';
import { RewardMaster } from '../services/RewardMaster.js';

describe('RewardMaster', () => {
  let rewardMaster;
  
  beforeEach(() => {
    rewardMaster = new RewardMaster();
  });
  
  describe('awardXP', () => {
    it('should award XP for valid actions', async () => {
      const userId = 'test_user_1';
      const result = await rewardMaster.awardXP(userId, 'quiz_completion');
      
      expect(result.success).toBe(true);
      expect(result.data.xpEarned).toBe(50);
      expect(result.data.totalXP).toBe(50);
    });
    
    it('should convert XP to MetroPoints at 100:1 ratio', async () => {
      const userId = 'test_user_2';
      
      // Award enough XP to get MetroPoints
      await rewardMaster.awardXP(userId, 'vote_pledge'); // 100 XP
      const result = await rewardMaster.awardXP(userId, 'quiz_completion'); // 50 XP
      
      expect(result.data.metroPoints).toBe(1); // 150 XP = 1 MetroPoint + 50 remaining
      expect(result.data.currentXP).toBe(50);
    });
    
    it('should prevent duplicate actions within 24 hours', async () => {
      const userId = 'test_user_3';
      
      // First action should succeed
      const first = await rewardMaster.awardXP(userId, 'quiz_completion');
      expect(first.success).toBe(true);
      
      // Second identical action should fail
      const second = await rewardMaster.awardXP(userId, 'quiz_completion');
      expect(second.success).toBe(false);
      expect(second.error).toContain('Duplicate action detected');
    });
  });
  
  describe('processQuizCompletion', () => {
    it('should process quiz and award appropriate XP', async () => {
      const userId = 'test_user_4';
      const quizData = {
        quizId: 'quiz_1',
        answers: [0, 1, 2, 0],
        correctAnswers: [0, 1, 2, 1],
        timeSpent: 120000
      };
      
      const result = await rewardMaster.processQuizCompletion(userId, quizData);
      
      expect(result.success).toBe(true);
      expect(result.data.score).toBe(75); // 3/4 correct
      expect(result.data.baseReward.xpEarned).toBe(50);
      expect(result.data.isPerfectScore).toBe(false);
    });
    
    it('should award bonus XP for perfect scores', async () => {
      const userId = 'test_user_5';
      const quizData = {
        quizId: 'quiz_2',
        answers: [0, 1, 2, 1],
        correctAnswers: [0, 1, 2, 1],
        timeSpent: 90000
      };
      
      const result = await rewardMaster.processQuizCompletion(userId, quizData);
      
      expect(result.success).toBe(true);
      expect(result.data.score).toBe(100);
      expect(result.data.isPerfectScore).toBe(true);
      expect(result.data.bonusReward).toBeDefined();
      expect(result.data.bonusReward.xpEarned).toBe(100);
    });
  });
  
  describe('processVotePledge', () => {
    it('should process vote pledge and award XP', async () => {
      const userId = 'test_user_6';
      const pledgeData = {
        electionId: 'nyc_2024',
        pledgeType: 'early-voting',
        scheduledDate: '2024-11-01'
      };
      
      const result = await rewardMaster.processVotePledge(userId, pledgeData);
      
      expect(result.success).toBe(true);
      expect(result.data.pledge).toBeDefined();
      expect(result.data.reward.xpEarned).toBe(100);
    });
    
    it('should prevent duplicate pledges for same election', async () => {
      const userId = 'test_user_7';
      const pledgeData = {
        electionId: 'nyc_2024',
        pledgeType: 'election-day',
        scheduledDate: '2024-11-05'
      };
      
      // First pledge should succeed
      const first = await rewardMaster.processVotePledge(userId, pledgeData);
      expect(first.success).toBe(true);
      
      // Second pledge for same election should fail
      const second = await rewardMaster.processVotePledge(userId, pledgeData);
      expect(second.success).toBe(false);
      expect(second.error).toContain('Duplicate pledge detected');
    });
  });
  
  describe('redeemReward', () => {
    it('should redeem reward when user has sufficient points', async () => {
      const userId = 'test_user_8';
      
      // Give user enough points
      await rewardMaster.awardXP(userId, 'vote_pledge'); // 100 XP = 1 MetroPoint
      await rewardMaster.awardXP(userId, 'quiz_perfect_score'); // 100 XP = 1 MetroPoint
      await rewardMaster.awardXP(userId, 'quiz_completion'); // 50 XP
      await rewardMaster.awardXP(userId, 'flag_submission'); // 25 XP
      await rewardMaster.awardXP(userId, 'flag_verified'); // 50 XP
      // Total: 325 XP = 3 MetroPoints + 25 remaining
      
      const result = await rewardMaster.redeemReward(userId, 'coffee_discount');
      
      expect(result.success).toBe(true);
      expect(result.data.remainingPoints).toBe(0); // 3 - 3 = 0
    });
    
    it('should fail when user has insufficient points', async () => {
      const userId = 'test_user_9';
      
      const result = await rewardMaster.redeemReward(userId, 'omny_5');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient MetroPoints');
    });
  });
  
  describe('getUserProfile', () => {
    it('should create and return user profile', () => {
      const userId = 'test_user_10';
      const profile = rewardMaster.getUserProfile(userId);
      
      expect(profile.userId).toBe(userId);
      expect(profile.totalXP).toBe(0);
      expect(profile.metroPoints).toBe(0);
      expect(profile.level).toBe(1);
      expect(Array.isArray(profile.transactions)).toBe(true);
    });
    
    it('should calculate level based on total XP', async () => {
      const userId = 'test_user_11';
      
      // Award enough XP to reach level 2 (500+ XP)
      for (let i = 0; i < 6; i++) {
        await rewardMaster.awardXP(userId, 'quiz_perfect_score'); // 100 XP each
      }
      
      const profile = rewardMaster.getUserProfile(userId);
      expect(profile.level).toBe(2); // 600 XP / 500 = 1.2, floor + 1 = 2
    });
  });
});