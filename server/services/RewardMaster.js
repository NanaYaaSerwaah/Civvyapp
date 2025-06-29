/**
 * RewardMaster - Gamification engine for civic engagement
 * Handles XP→MetroPoints conversion, quiz scoring, and reward redemption
 */
export class RewardMaster {
  constructor() {
    this.XP_TO_METROPOINTS_RATIO = 100; // 100 XP = 1 MetroPoint
    this.FRAUD_DETECTION_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in ms
    
    // XP reward values for different actions
    this.XP_REWARDS = {
      quiz_completion: 50,
      quiz_perfect_score: 100,
      vote_pledge: 100,
      flag_submission: 25,
      flag_verified: 50,
      content_share: 15,
      daily_login: 10,
      streak_bonus: 25
    };

    // Mock user data store (would be database in production)
    this.userProfiles = new Map();
    this.transactionHistory = [];
    this.pledgeHistory = [];
    
    // Mock OMNY and merchant integrations
    this.omnyService = new MockOMNYService();
    this.merchantService = new MockMerchantService();
  }

  /**
   * Award XP for user actions and convert to MetroPoints
   */
  async awardXP(userId, action, metadata = {}) {
    try {
      const xpAmount = this.XP_REWARDS[action] || 0;
      
      if (xpAmount === 0) {
        return {
          success: false,
          error: 'Invalid action type'
        };
      }

      // Fraud detection for duplicate actions
      if (await this.detectFraud(userId, action, metadata)) {
        return {
          success: false,
          error: 'Duplicate action detected within 24 hours'
        };
      }

      // Get or create user profile
      const userProfile = this.getUserProfile(userId);
      
      // Award XP
      userProfile.totalXP += xpAmount;
      userProfile.currentXP += xpAmount;
      
      // Convert XP to MetroPoints
      const newMetroPoints = Math.floor(userProfile.currentXP / this.XP_TO_METROPOINTS_RATIO);
      const metroPointsEarned = newMetroPoints - userProfile.metroPoints;
      
      if (metroPointsEarned > 0) {
        userProfile.metroPoints = newMetroPoints;
        userProfile.currentXP = userProfile.currentXP % this.XP_TO_METROPOINTS_RATIO;
      }

      // Record transaction
      const transaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'earn',
        action,
        xpAmount,
        metroPointsEarned,
        timestamp: new Date().toISOString(),
        metadata
      };
      
      this.transactionHistory.push(transaction);
      userProfile.transactions.push(transaction);

      // Update user profile
      this.userProfiles.set(userId, userProfile);

      return {
        success: true,
        data: {
          xpEarned: xpAmount,
          metroPointsEarned,
          totalXP: userProfile.totalXP,
          currentXP: userProfile.currentXP,
          metroPoints: userProfile.metroPoints,
          transaction
        }
      };

    } catch (error) {
      console.error('XP award error:', error);
      return {
        success: false,
        error: 'Failed to award XP'
      };
    }
  }

  /**
   * Process quiz completion and award XP
   */
  async processQuizCompletion(userId, quizData) {
    try {
      const { quizId, answers, correctAnswers, timeSpent } = quizData;
      
      // Calculate score
      const score = this.calculateQuizScore(answers, correctAnswers);
      const isPerfectScore = score === 100;
      
      // Determine XP reward
      const baseAction = 'quiz_completion';
      const bonusAction = isPerfectScore ? 'quiz_perfect_score' : null;
      
      // Award base XP
      const baseReward = await this.awardXP(userId, baseAction, {
        quizId,
        score,
        timeSpent,
        questionsTotal: correctAnswers.length
      });

      let bonusReward = null;
      if (bonusAction && baseReward.success) {
        bonusReward = await this.awardXP(userId, bonusAction, {
          quizId,
          perfectScore: true
        });
      }

      return {
        success: true,
        data: {
          score,
          isPerfectScore,
          baseReward: baseReward.data,
          bonusReward: bonusReward?.data,
          totalXPEarned: (baseReward.data?.xpEarned || 0) + (bonusReward?.data?.xpEarned || 0)
        }
      };

    } catch (error) {
      console.error('Quiz processing error:', error);
      return {
        success: false,
        error: 'Failed to process quiz completion'
      };
    }
  }

  /**
   * Process vote pledge with fraud detection
   */
  async processVotePledge(userId, pledgeData) {
    try {
      const { electionId, pledgeType, scheduledDate } = pledgeData;
      
      // Check for duplicate pledges within 24 hours
      const recentPledge = this.pledgeHistory.find(pledge => 
        pledge.userId === userId &&
        pledge.electionId === electionId &&
        Date.now() - new Date(pledge.timestamp).getTime() < this.FRAUD_DETECTION_WINDOW
      );

      if (recentPledge) {
        return {
          success: false,
          error: 'Duplicate pledge detected within 24 hours'
        };
      }

      // Record pledge
      const pledge = {
        id: `pledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        electionId,
        pledgeType,
        scheduledDate,
        timestamp: new Date().toISOString(),
        status: 'active'
      };

      this.pledgeHistory.push(pledge);

      // Award XP
      const reward = await this.awardXP(userId, 'vote_pledge', {
        electionId,
        pledgeType,
        pledgeId: pledge.id
      });

      return {
        success: true,
        data: {
          pledge,
          reward: reward.data
        }
      };

    } catch (error) {
      console.error('Vote pledge error:', error);
      return {
        success: false,
        error: 'Failed to process vote pledge'
      };
    }
  }

  /**
   * Redeem MetroPoints for rewards
   */
  async redeemReward(userId, rewardId, quantity = 1) {
    try {
      const userProfile = this.getUserProfile(userId);
      const reward = this.getAvailableRewards().find(r => r.id === rewardId);
      
      if (!reward) {
        return {
          success: false,
          error: 'Reward not found'
        };
      }

      const totalCost = reward.cost * quantity;
      
      if (userProfile.metroPoints < totalCost) {
        return {
          success: false,
          error: 'Insufficient MetroPoints',
          required: totalCost,
          available: userProfile.metroPoints
        };
      }

      // Process redemption based on reward type
      let redemptionResult;
      
      if (reward.category === 'transit') {
        redemptionResult = await this.omnyService.addCredit(userId, reward.value * quantity);
      } else if (reward.category === 'local') {
        redemptionResult = await this.merchantService.generateVoucher(userId, reward, quantity);
      } else {
        redemptionResult = await this.processDigitalReward(userId, reward, quantity);
      }

      if (!redemptionResult.success) {
        return redemptionResult;
      }

      // Deduct MetroPoints
      userProfile.metroPoints -= totalCost;

      // Record transaction
      const transaction = {
        id: `redeem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'redeem',
        rewardId,
        quantity,
        cost: totalCost,
        timestamp: new Date().toISOString(),
        redemptionData: redemptionResult.data
      };

      this.transactionHistory.push(transaction);
      userProfile.transactions.push(transaction);
      userProfile.redemptions.push(transaction);

      // Update user profile
      this.userProfiles.set(userId, userProfile);

      return {
        success: true,
        data: {
          transaction,
          remainingPoints: userProfile.metroPoints,
          redemptionDetails: redemptionResult.data
        }
      };

    } catch (error) {
      console.error('Reward redemption error:', error);
      return {
        success: false,
        error: 'Failed to redeem reward'
      };
    }
  }

  /**
   * Get user profile with XP and MetroPoints balance
   */
  getUserProfile(userId) {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        userId,
        totalXP: 0,
        currentXP: 0,
        metroPoints: 0,
        level: 1,
        transactions: [],
        redemptions: [],
        badges: [],
        createdAt: new Date().toISOString()
      });
    }
    
    const profile = this.userProfiles.get(userId);
    
    // Calculate level based on total XP
    profile.level = Math.floor(profile.totalXP / 500) + 1;
    
    return profile;
  }

  /**
   * Get available rewards catalog
   */
  getAvailableRewards() {
    return [
      {
        id: 'omny_5',
        title: 'OMNY Credit - $5',
        description: '$5 MetroCard credit for subway and bus',
        cost: 5,
        value: 5,
        category: 'transit',
        icon: 'train',
        available: true
      },
      {
        id: 'omny_10',
        title: 'OMNY Credit - $10',
        description: '$10 MetroCard credit for subway and bus',
        cost: 10,
        value: 10,
        category: 'transit',
        icon: 'train',
        available: true
      },
      {
        id: 'coffee_discount',
        title: 'Local Coffee Discount',
        description: '20% off at participating NYC cafes',
        cost: 3,
        value: 0.2,
        category: 'local',
        icon: 'coffee',
        available: true,
        validDays: 30
      },
      {
        id: 'restaurant_discount',
        title: 'Restaurant Discount',
        description: '15% off at local restaurants',
        cost: 4,
        value: 0.15,
        category: 'local',
        icon: 'utensils',
        available: true,
        validDays: 30
      },
      {
        id: 'xp_boost',
        title: 'XP Boost Weekend',
        description: 'Double XP for 48 hours',
        cost: 2,
        value: 2,
        category: 'boost',
        icon: 'zap',
        available: true,
        duration: 48
      }
    ];
  }

  /**
   * Get user transaction history
   */
  getUserTransactions(userId, limit = 20) {
    const userProfile = this.getUserProfile(userId);
    return userProfile.transactions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Helper methods
   */
  calculateQuizScore(userAnswers, correctAnswers) {
    if (!userAnswers || !correctAnswers || correctAnswers.length === 0) {
      return 0;
    }

    let correct = 0;
    for (let i = 0; i < correctAnswers.length; i++) {
      if (userAnswers[i] === correctAnswers[i]) {
        correct++;
      }
    }

    return Math.round((correct / correctAnswers.length) * 100);
  }

  async detectFraud(userId, action, metadata) {
    // Simple fraud detection - check for duplicate actions within time window
    const recentTransactions = this.transactionHistory.filter(txn =>
      txn.userId === userId &&
      txn.action === action &&
      Date.now() - new Date(txn.timestamp).getTime() < this.FRAUD_DETECTION_WINDOW
    );

    // Special handling for vote pledges
    if (action === 'vote_pledge' && metadata.electionId) {
      return recentTransactions.some(txn => 
        txn.metadata?.electionId === metadata.electionId
      );
    }

    // General duplicate detection
    return recentTransactions.length > 0;
  }

  async processDigitalReward(userId, reward, quantity) {
    // Process digital rewards like XP boosts
    return {
      success: true,
      data: {
        type: 'digital',
        rewardId: reward.id,
        quantity,
        activatedAt: new Date().toISOString(),
        expiresAt: reward.duration ? 
          new Date(Date.now() + reward.duration * 60 * 60 * 1000).toISOString() : 
          null
      }
    };
  }
}

/**
 * Mock OMNY Service Integration
 */
class MockOMNYService {
  async addCredit(userId, amount) {
    // Mock OMNY API integration
    return {
      success: true,
      data: {
        transactionId: `omny_${Date.now()}`,
        userId,
        creditAmount: amount,
        newBalance: amount, // Mock balance
        processedAt: new Date().toISOString()
      }
    };
  }
}

/**
 * Mock Merchant Service Integration
 */
class MockMerchantService {
  async generateVoucher(userId, reward, quantity) {
    // Mock merchant API integration
    return {
      success: true,
      data: {
        voucherId: `voucher_${Date.now()}`,
        userId,
        rewardId: reward.id,
        discountPercent: reward.value,
        quantity,
        validUntil: new Date(Date.now() + (reward.validDays || 30) * 24 * 60 * 60 * 1000).toISOString(),
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=voucher_${Date.now()}`
      }
    };
  }
}