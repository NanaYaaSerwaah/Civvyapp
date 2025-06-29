/**
 * ContentService - Manages feed content and moderation
 * Integrates with FactHunter for real-time analysis
 */
import { FactHunter } from './FactHunter.js';

export class ContentService {
  constructor() {
    this.factHunter = new FactHunter();
    this.moderationQueue = [];
    
    // Mock content database
    this.contentDatabase = [
      {
        id: 'content_1',
        type: 'story',
        title: 'NYC Housing Budget Increases by $2.1 Billion',
        content: 'Mayor announces $2.1 billion increase in housing budget for 2024, bringing total to $8.9 billion. This represents a 30% increase from last year.',
        source: 'NYC.gov',
        author: 'NYC Housing Authority',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        tags: ['housing', 'budget', 'policy'],
        verified: true
      },
      {
        id: 'content_2',
        type: 'video',
        title: 'Transportation Committee Discusses MTA Funding',
        content: 'City Council transportation committee reviews MTA funding proposal. Committee chair states ridership has recovered to 85% of pre-pandemic levels.',
        source: 'NY1',
        author: 'Transportation Reporter',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        tags: ['transportation', 'mta', 'funding'],
        verified: true
      },
      {
        id: 'content_3',
        type: 'article',
        title: 'Conflicting Statements on Housing Development',
        content: 'Candidate A claims to support 50,000 new affordable units by 2026, but previously voted against zoning changes that would enable such development.',
        source: 'Gothamist',
        author: 'Political Reporter',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        tags: ['housing', 'politics', 'development'],
        verified: true
      }
    ];
  }

  /**
   * Get personalized feed based on user preferences
   */
  async getFeed(userId, preferences = {}) {
    try {
      // Get base content filtered by user preferences
      let feedContent = await this.getFilteredContent(preferences);
      
      // Analyze each content item for contradictions
      const analyzedContent = await Promise.all(
        feedContent.map(async (item) => {
          const relatedContent = this.getRelatedContent(item);
          const analysis = await this.factHunter.analyzeContent(item, relatedContent);
          
          return {
            ...item,
            analysis,
            contradictions: analysis.contradictions.length,
            confidence: analysis.confidence,
            biasScore: analysis.biasScore
          };
        })
      );
      
      // Sort by relevance and recency
      const sortedContent = this.sortFeedContent(analyzedContent, preferences);
      
      return {
        success: true,
        data: sortedContent,
        metadata: {
          totalItems: sortedContent.length,
          lastUpdated: new Date().toISOString(),
          userId
        }
      };
      
    } catch (error) {
      console.error('Feed generation error:', error);
      return {
        success: false,
        error: 'Failed to generate feed',
        data: []
      };
    }
  }

  /**
   * Filter content based on user preferences
   */
  async getFilteredContent(preferences) {
    let content = [...this.contentDatabase];
    
    // Filter by selected issues if available
    if (preferences.issues && preferences.issues.length > 0) {
      content = content.filter(item => 
        preferences.issues.some(issue => 
          item.tags.some(tag => 
            this.matchIssueToTag(issue, tag)
          )
        )
      );
    }
    
    // Filter by format preference
    if (preferences.format && preferences.format !== 'mixed') {
      const formatMap = {
        'visual': ['story', 'image'],
        'articles': ['article'],
        'videos': ['video']
      };
      
      const allowedTypes = formatMap[preferences.format] || [];
      if (allowedTypes.length > 0) {
        content = content.filter(item => allowedTypes.includes(item.type));
      }
    }
    
    return content;
  }

  /**
   * Get related content for contradiction analysis
   */
  getRelatedContent(contentItem) {
    return this.contentDatabase.filter(item => 
      item.id !== contentItem.id &&
      item.tags.some(tag => contentItem.tags.includes(tag))
    );
  }

  /**
   * Sort feed content by relevance and engagement potential
   */
  sortFeedContent(content, preferences) {
    return content.sort((a, b) => {
      // Prioritize content with contradictions (higher engagement)
      const contradictionWeight = (b.contradictions || 0) - (a.contradictions || 0);
      
      // Prioritize recent content
      const timeWeight = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      
      // Prioritize high-confidence analysis
      const confidenceWeight = (b.confidence || 0) - (a.confidence || 0);
      
      return (contradictionWeight * 0.4) + (timeWeight * 0.0001) + (confidenceWeight * 0.3);
    });
  }

  /**
   * Submit content flag for moderation
   */
  async submitFlag(flagData) {
    try {
      const flag = {
        id: `flag_${Date.now()}`,
        contentId: flagData.contentId,
        userId: flagData.userId,
        reason: flagData.reason,
        description: flagData.description,
        timestamp: new Date().toISOString(),
        status: 'pending',
        priority: this.calculateFlagPriority(flagData)
      };
      
      // Add to moderation queue
      this.moderationQueue.push(flag);
      
      // Sort queue by priority
      this.moderationQueue.sort((a, b) => b.priority - a.priority);
      
      return {
        success: true,
        data: flag,
        message: 'Flag submitted successfully'
      };
      
    } catch (error) {
      console.error('Flag submission error:', error);
      return {
        success: false,
        error: 'Failed to submit flag'
      };
    }
  }

  /**
   * Get moderation queue (for admin interface)
   */
  getModerationQueue() {
    return {
      success: true,
      data: this.moderationQueue,
      metadata: {
        totalFlags: this.moderationQueue.length,
        pendingFlags: this.moderationQueue.filter(f => f.status === 'pending').length
      }
    };
  }

  /**
   * Helper methods
   */
  matchIssueToTag(issue, tag) {
    const issueTagMap = {
      'Housing & Rent Control': ['housing', 'rent', 'development'],
      'Public Transportation': ['transportation', 'mta', 'subway', 'bus'],
      'Education & Schools': ['education', 'schools', 'teachers'],
      'Public Safety': ['safety', 'police', 'crime'],
      'Climate & Environment': ['climate', 'environment', 'green'],
      'Healthcare Access': ['healthcare', 'health', 'medical'],
      'Economic Development': ['economy', 'business', 'jobs'],
      'Immigration': ['immigration', 'immigrant', 'sanctuary']
    };
    
    const relevantTags = issueTagMap[issue] || [];
    return relevantTags.some(relevantTag => 
      tag.toLowerCase().includes(relevantTag.toLowerCase())
    );
  }

  calculateFlagPriority(flagData) {
    let priority = 1;
    
    // High priority reasons
    const highPriorityReasons = ['misinformation', 'hate-speech', 'harassment'];
    if (highPriorityReasons.includes(flagData.reason)) {
      priority += 3;
    }
    
    // Medium priority reasons
    const mediumPriorityReasons = ['bias', 'inaccuracy', 'spam'];
    if (mediumPriorityReasons.includes(flagData.reason)) {
      priority += 2;
    }
    
    return priority;
  }
}