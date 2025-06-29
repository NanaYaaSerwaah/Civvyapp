/**
 * IntegrityGuardian - Trust and audit layer for content moderation
 * Implements reputation scoring, audit logging, and transparency features
 */
import crypto from 'crypto';

export class IntegrityGuardian {
  constructor() {
    // Reputation scoring weights
    this.REPUTATION_WEIGHTS = {
      flag_verified: 10,
      flag_rejected: -5,
      quiz_perfect_score: 5,
      vote_pledge_fulfilled: 8,
      content_shared: 2,
      account_age_days: 0.1,
      community_reports: -15
    };

    // Audit log storage (would be database in production)
    this.auditLog = [];
    this.userReputations = new Map();
    this.moderationActions = [];
    
    // Integrity thresholds
    this.TRUST_THRESHOLDS = {
      HIGH_TRUST: 80,
      MEDIUM_TRUST: 50,
      LOW_TRUST: 20,
      FLAGGED_USER: 0
    };
  }

  /**
   * Calculate user reputation score
   */
  calculateUserReputation(userId, userHistory = {}) {
    try {
      let reputation = 50; // Base reputation score
      
      // Get user's historical actions
      const history = this.getUserHistory(userId, userHistory);
      
      // Apply reputation weights
      Object.entries(this.REPUTATION_WEIGHTS).forEach(([action, weight]) => {
        const count = history[action] || 0;
        reputation += count * weight;
      });

      // Account age bonus (days since registration)
      if (history.accountCreated) {
        const daysSinceCreation = Math.floor(
          (Date.now() - new Date(history.accountCreated).getTime()) / (1000 * 60 * 60 * 24)
        );
        reputation += daysSinceCreation * this.REPUTATION_WEIGHTS.account_age_days;
      }

      // Ensure reputation stays within bounds
      reputation = Math.max(0, Math.min(100, reputation));
      
      // Store updated reputation
      this.userReputations.set(userId, {
        score: Math.round(reputation),
        lastUpdated: new Date().toISOString(),
        trustLevel: this.getTrustLevel(reputation),
        history
      });

      return {
        success: true,
        data: {
          userId,
          reputation: Math.round(reputation),
          trustLevel: this.getTrustLevel(reputation),
          breakdown: this.getReputationBreakdown(history)
        }
      };

    } catch (error) {
      console.error('Reputation calculation error:', error);
      return {
        success: false,
        error: 'Failed to calculate reputation'
      };
    }
  }

  /**
   * Log moderation action with hash for integrity
   */
  async logModerationAction(action, metadata = {}) {
    try {
      const logEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        action,
        metadata,
        moderatorId: metadata.moderatorId || 'system',
        contentId: metadata.contentId,
        userId: metadata.userId,
        decision: metadata.decision,
        reason: metadata.reason
      };

      // Create hash for integrity verification
      const hashInput = JSON.stringify({
        id: logEntry.id,
        timestamp: logEntry.timestamp,
        action: logEntry.action,
        contentId: logEntry.contentId,
        decision: logEntry.decision
      });
      
      logEntry.hash = crypto.createHash('sha256').update(hashInput).digest('hex');
      
      // Link to previous entry for blockchain-like integrity
      if (this.auditLog.length > 0) {
        logEntry.previousHash = this.auditLog[this.auditLog.length - 1].hash;
      }

      // Store audit entry
      this.auditLog.push(logEntry);
      this.moderationActions.push(logEntry);

      // Update user reputation if applicable
      if (logEntry.userId) {
        await this.updateUserReputationFromAction(logEntry.userId, logEntry);
      }

      return {
        success: true,
        data: logEntry
      };

    } catch (error) {
      console.error('Audit logging error:', error);
      return {
        success: false,
        error: 'Failed to log moderation action'
      };
    }
  }

  /**
   * Get public audit feed for transparency
   */
  getPublicAuditFeed(limit = 50, offset = 0) {
    try {
      // Filter sensitive information for public view
      const publicEntries = this.auditLog
        .slice(offset, offset + limit)
        .map(entry => ({
          id: entry.id,
          timestamp: entry.timestamp,
          action: entry.action,
          decision: entry.decision,
          reason: entry.reason,
          hash: entry.hash,
          // Exclude sensitive metadata like user IDs
          contentType: entry.metadata?.contentType,
          flagReason: entry.metadata?.flagReason
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return {
        success: true,
        data: {
          entries: publicEntries,
          totalEntries: this.auditLog.length,
          lastUpdated: new Date().toISOString(),
          integrityVerified: this.verifyAuditIntegrity()
        }
      };

    } catch (error) {
      console.error('Audit feed error:', error);
      return {
        success: false,
        error: 'Failed to retrieve audit feed'
      };
    }
  }

  /**
   * Verify audit log integrity
   */
  verifyAuditIntegrity() {
    try {
      for (let i = 0; i < this.auditLog.length; i++) {
        const entry = this.auditLog[i];
        
        // Verify hash
        const hashInput = JSON.stringify({
          id: entry.id,
          timestamp: entry.timestamp,
          action: entry.action,
          contentId: entry.contentId,
          decision: entry.decision
        });
        
        const expectedHash = crypto.createHash('sha256').update(hashInput).digest('hex');
        
        if (entry.hash !== expectedHash) {
          return false;
        }

        // Verify chain integrity
        if (i > 0 && entry.previousHash !== this.auditLog[i - 1].hash) {
          return false;
        }
      }

      return true;

    } catch (error) {
      console.error('Integrity verification error:', error);
      return false;
    }
  }

  /**
   * Process flag submission with reputation weighting
   */
  async processFlagWithReputation(flagData) {
    try {
      const { userId, contentId, reason, description } = flagData;
      
      // Get user reputation
      const userRep = this.userReputations.get(userId) || { score: 50, trustLevel: 'medium' };
      
      // Calculate flag weight based on reputation
      const flagWeight = this.calculateFlagWeight(userRep.score);
      
      // Create weighted flag entry
      const weightedFlag = {
        ...flagData,
        id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        weight: flagWeight,
        userReputation: userRep.score,
        trustLevel: userRep.trustLevel,
        priority: this.calculateFlagPriority(reason, flagWeight)
      };

      // Log the flag submission
      await this.logModerationAction('flag_submitted', {
        flagId: weightedFlag.id,
        userId,
        contentId,
        reason,
        weight: flagWeight,
        userReputation: userRep.score
      });

      return {
        success: true,
        data: weightedFlag
      };

    } catch (error) {
      console.error('Flag processing error:', error);
      return {
        success: false,
        error: 'Failed to process flag'
      };
    }
  }

  /**
   * Get user trust metrics
   */
  getUserTrustMetrics(userId) {
    const reputation = this.userReputations.get(userId);
    
    if (!reputation) {
      return {
        success: false,
        error: 'User reputation not found'
      };
    }

    return {
      success: true,
      data: {
        userId,
        reputation: reputation.score,
        trustLevel: reputation.trustLevel,
        lastUpdated: reputation.lastUpdated,
        flagWeight: this.calculateFlagWeight(reputation.score),
        canModerate: reputation.score >= this.TRUST_THRESHOLDS.HIGH_TRUST,
        restrictions: this.getUserRestrictions(reputation.score)
      }
    };
  }

  /**
   * Get moderation queue with reputation-weighted prioritization
   */
  getModerationQueue(limit = 20) {
    try {
      // Get recent moderation actions that need review
      const pendingActions = this.moderationActions
        .filter(action => action.metadata?.status === 'pending')
        .sort((a, b) => {
          // Sort by priority (higher first) then by timestamp (newer first)
          if (a.metadata?.priority !== b.metadata?.priority) {
            return (b.metadata?.priority || 0) - (a.metadata?.priority || 0);
          }
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        })
        .slice(0, limit);

      return {
        success: true,
        data: {
          queue: pendingActions,
          totalPending: pendingActions.length,
          highPriorityCount: pendingActions.filter(a => (a.metadata?.priority || 0) >= 8).length
        }
      };

    } catch (error) {
      console.error('Moderation queue error:', error);
      return {
        success: false,
        error: 'Failed to retrieve moderation queue'
      };
    }
  }

  /**
   * Helper methods
   */
  getUserHistory(userId, providedHistory = {}) {
    // In production, this would query the database
    // For now, use provided history or defaults
    return {
      flag_verified: providedHistory.flag_verified || 0,
      flag_rejected: providedHistory.flag_rejected || 0,
      quiz_perfect_score: providedHistory.quiz_perfect_score || 0,
      vote_pledge_fulfilled: providedHistory.vote_pledge_fulfilled || 0,
      content_shared: providedHistory.content_shared || 0,
      community_reports: providedHistory.community_reports || 0,
      accountCreated: providedHistory.accountCreated || new Date().toISOString(),
      ...providedHistory
    };
  }

  getTrustLevel(reputation) {
    if (reputation >= this.TRUST_THRESHOLDS.HIGH_TRUST) return 'high';
    if (reputation >= this.TRUST_THRESHOLDS.MEDIUM_TRUST) return 'medium';
    if (reputation >= this.TRUST_THRESHOLDS.LOW_TRUST) return 'low';
    return 'flagged';
  }

  calculateFlagWeight(reputation) {
    // Higher reputation users have more weight in flagging
    if (reputation >= 80) return 1.5;
    if (reputation >= 60) return 1.2;
    if (reputation >= 40) return 1.0;
    if (reputation >= 20) return 0.8;
    return 0.5;
  }

  calculateFlagPriority(reason, weight) {
    const basePriority = {
      'misinformation': 9,
      'hate-speech': 10,
      'harassment': 8,
      'bias': 6,
      'inaccuracy': 5,
      'spam': 4,
      'inappropriate': 3,
      'other': 2
    };

    return Math.round((basePriority[reason] || 2) * weight);
  }

  getReputationBreakdown(history) {
    const breakdown = {};
    
    Object.entries(this.REPUTATION_WEIGHTS).forEach(([action, weight]) => {
      const count = history[action] || 0;
      if (count > 0) {
        breakdown[action] = {
          count,
          weight,
          contribution: count * weight
        };
      }
    });

    return breakdown;
  }

  getUserRestrictions(reputation) {
    const restrictions = [];
    
    if (reputation < this.TRUST_THRESHOLDS.LOW_TRUST) {
      restrictions.push('limited_flagging');
      restrictions.push('content_review_required');
    }
    
    if (reputation < this.TRUST_THRESHOLDS.FLAGGED_USER) {
      restrictions.push('account_suspended');
    }

    return restrictions;
  }

  async updateUserReputationFromAction(userId, logEntry) {
    // Update reputation based on moderation outcomes
    const currentRep = this.userReputations.get(userId) || { score: 50 };
    
    if (logEntry.action === 'flag_verified' && logEntry.decision === 'upheld') {
      currentRep.score += 5;
    } else if (logEntry.action === 'flag_verified' && logEntry.decision === 'rejected') {
      currentRep.score -= 2;
    }

    // Recalculate full reputation
    await this.calculateUserReputation(userId);
  }
}