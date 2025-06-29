/**
 * AuditService - Comprehensive audit and transparency system
 * Provides detailed logging and public transparency features
 */
export class AuditService {
  constructor() {
    this.auditEvents = [];
    this.systemMetrics = {
      totalFlags: 0,
      flagsUpheld: 0,
      flagsRejected: 0,
      averageResponseTime: 0,
      userReports: 0,
      contentRemoved: 0
    };
  }

  /**
   * Log comprehensive audit event
   */
  async logEvent(eventType, data, metadata = {}) {
    try {
      const auditEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        eventType,
        data,
        metadata: {
          ...metadata,
          userAgent: metadata.userAgent || 'system',
          ipAddress: metadata.ipAddress ? this.hashIP(metadata.ipAddress) : null,
          sessionId: metadata.sessionId
        },
        severity: this.calculateEventSeverity(eventType, data),
        category: this.categorizeEvent(eventType)
      };

      this.auditEvents.push(auditEvent);
      
      // Update system metrics
      this.updateSystemMetrics(eventType, data);

      return {
        success: true,
        data: auditEvent
      };

    } catch (error) {
      console.error('Audit event logging error:', error);
      return {
        success: false,
        error: 'Failed to log audit event'
      };
    }
  }

  /**
   * Get transparency report
   */
  getTransparencyReport(timeframe = '30d') {
    try {
      const cutoffDate = this.getTimeframeCutoff(timeframe);
      const relevantEvents = this.auditEvents.filter(
        event => new Date(event.timestamp) >= cutoffDate
      );

      const report = {
        timeframe,
        generatedAt: new Date().toISOString(),
        summary: {
          totalEvents: relevantEvents.length,
          contentModerationActions: relevantEvents.filter(e => e.category === 'moderation').length,
          userActions: relevantEvents.filter(e => e.category === 'user_action').length,
          systemEvents: relevantEvents.filter(e => e.category === 'system').length
        },
        moderation: {
          flagsReceived: relevantEvents.filter(e => e.eventType === 'flag_submitted').length,
          flagsProcessed: relevantEvents.filter(e => e.eventType === 'flag_processed').length,
          contentRemoved: relevantEvents.filter(e => e.eventType === 'content_removed').length,
          averageProcessingTime: this.calculateAverageProcessingTime(relevantEvents)
        },
        userEngagement: {
          quizzesCompleted: relevantEvents.filter(e => e.eventType === 'quiz_completed').length,
          votePledges: relevantEvents.filter(e => e.eventType === 'vote_pledge').length,
          rewardsRedeemed: relevantEvents.filter(e => e.eventType === 'reward_redeemed').length
        },
        systemHealth: {
          uptime: '99.9%', // Mock value
          averageResponseTime: this.systemMetrics.averageResponseTime,
          errorRate: this.calculateErrorRate(relevantEvents)
        }
      };

      return {
        success: true,
        data: report
      };

    } catch (error) {
      console.error('Transparency report error:', error);
      return {
        success: false,
        error: 'Failed to generate transparency report'
      };
    }
  }

  /**
   * Get public audit feed with privacy protection
   */
  getPublicAuditFeed(limit = 100, category = null) {
    try {
      let events = this.auditEvents;

      // Filter by category if specified
      if (category) {
        events = events.filter(event => event.category === category);
      }

      // Remove sensitive information for public view
      const publicEvents = events
        .slice(-limit)
        .map(event => ({
          id: event.id,
          timestamp: event.timestamp,
          eventType: event.eventType,
          category: event.category,
          severity: event.severity,
          // Only include non-sensitive data
          summary: this.createPublicSummary(event)
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return {
        success: true,
        data: {
          events: publicEvents,
          totalEvents: this.auditEvents.length,
          categories: this.getEventCategories(),
          lastUpdated: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Public audit feed error:', error);
      return {
        success: false,
        error: 'Failed to retrieve public audit feed'
      };
    }
  }

  /**
   * Search audit events (admin only)
   */
  searchAuditEvents(query, filters = {}) {
    try {
      let events = this.auditEvents;

      // Apply filters
      if (filters.eventType) {
        events = events.filter(e => e.eventType === filters.eventType);
      }

      if (filters.category) {
        events = events.filter(e => e.category === filters.category);
      }

      if (filters.severity) {
        events = events.filter(e => e.severity === filters.severity);
      }

      if (filters.dateFrom) {
        events = events.filter(e => new Date(e.timestamp) >= new Date(filters.dateFrom));
      }

      if (filters.dateTo) {
        events = events.filter(e => new Date(e.timestamp) <= new Date(filters.dateTo));
      }

      // Text search in event data
      if (query) {
        events = events.filter(event => {
          const searchText = JSON.stringify(event).toLowerCase();
          return searchText.includes(query.toLowerCase());
        });
      }

      return {
        success: true,
        data: {
          events: events.slice(0, 1000), // Limit results
          totalMatches: events.length,
          query,
          filters
        }
      };

    } catch (error) {
      console.error('Audit search error:', error);
      return {
        success: false,
        error: 'Failed to search audit events'
      };
    }
  }

  /**
   * Helper methods
   */
  hashIP(ipAddress) {
    // Hash IP addresses for privacy while maintaining uniqueness
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ipAddress).digest('hex').substring(0, 16);
  }

  calculateEventSeverity(eventType, data) {
    const severityMap = {
      'flag_submitted': 'medium',
      'content_removed': 'high',
      'user_suspended': 'high',
      'quiz_completed': 'low',
      'vote_pledge': 'low',
      'reward_redeemed': 'low',
      'system_error': 'high',
      'security_violation': 'critical'
    };

    return severityMap[eventType] || 'medium';
  }

  categorizeEvent(eventType) {
    const categoryMap = {
      'flag_submitted': 'moderation',
      'flag_processed': 'moderation',
      'content_removed': 'moderation',
      'user_suspended': 'moderation',
      'quiz_completed': 'user_action',
      'vote_pledge': 'user_action',
      'reward_redeemed': 'user_action',
      'system_error': 'system',
      'security_violation': 'security'
    };

    return categoryMap[eventType] || 'general';
  }

  updateSystemMetrics(eventType, data) {
    switch (eventType) {
      case 'flag_submitted':
        this.systemMetrics.totalFlags++;
        break;
      case 'flag_processed':
        if (data.decision === 'upheld') {
          this.systemMetrics.flagsUpheld++;
        } else {
          this.systemMetrics.flagsRejected++;
        }
        break;
      case 'content_removed':
        this.systemMetrics.contentRemoved++;
        break;
    }
  }

  getTimeframeCutoff(timeframe) {
    const now = new Date();
    const cutoffs = {
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };

    return cutoffs[timeframe] || cutoffs['30d'];
  }

  calculateAverageProcessingTime(events) {
    const processedFlags = events.filter(e => e.eventType === 'flag_processed');
    if (processedFlags.length === 0) return 0;

    const totalTime = processedFlags.reduce((sum, event) => {
      return sum + (event.data?.processingTimeMs || 0);
    }, 0);

    return Math.round(totalTime / processedFlags.length);
  }

  calculateErrorRate(events) {
    const totalEvents = events.length;
    const errorEvents = events.filter(e => e.severity === 'high' || e.severity === 'critical').length;
    
    return totalEvents > 0 ? Math.round((errorEvents / totalEvents) * 100 * 100) / 100 : 0;
  }

  createPublicSummary(event) {
    // Create privacy-safe summaries for public consumption
    const summaries = {
      'flag_submitted': 'Content flagged for review',
      'flag_processed': `Flag ${event.data?.decision || 'processed'}`,
      'content_removed': 'Content removed after review',
      'quiz_completed': 'User completed civic quiz',
      'vote_pledge': 'User made voting commitment',
      'reward_redeemed': 'User redeemed civic reward'
    };

    return summaries[event.eventType] || 'System event occurred';
  }

  getEventCategories() {
    return ['moderation', 'user_action', 'system', 'security', 'general'];
  }
}