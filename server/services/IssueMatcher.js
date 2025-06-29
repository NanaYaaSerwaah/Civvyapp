/**
 * IssueMatcher - Core algorithm for bias-safe topic personalization
 * Implements surprise-topic injection to prevent echo chambers
 */
export class IssueMatcher {
  constructor() {
    this.issueCategories = {
      'Housing & Rent Control': {
        weight: 1.0,
        relatedTopics: ['affordable-housing', 'rent-stabilization', 'housing-development'],
        surpriseTopics: ['zoning-reform', 'property-tax']
      },
      'Public Transportation': {
        weight: 1.0,
        relatedTopics: ['mta-funding', 'subway-accessibility', 'bus-routes'],
        surpriseTopics: ['congestion-pricing', 'bike-infrastructure']
      },
      'Education & Schools': {
        weight: 1.0,
        relatedTopics: ['school-funding', 'teacher-resources', 'student-performance'],
        surpriseTopics: ['school-choice', 'vocational-training']
      },
      'Public Safety': {
        weight: 1.0,
        relatedTopics: ['police-reform', 'community-safety', 'crime-prevention'],
        surpriseTopics: ['mental-health-services', 'youth-programs']
      },
      'Climate & Environment': {
        weight: 1.0,
        relatedTopics: ['green-energy', 'waste-management', 'air-quality'],
        surpriseTopics: ['urban-farming', 'flood-protection']
      },
      'Healthcare Access': {
        weight: 1.0,
        relatedTopics: ['public-health', 'hospital-funding', 'mental-health'],
        surpriseTopics: ['telehealth', 'health-equity']
      },
      'Economic Development': {
        weight: 1.0,
        relatedTopics: ['job-creation', 'small-business', 'economic-inequality'],
        surpriseTopics: ['tech-sector', 'tourism-recovery']
      },
      'Immigration': {
        weight: 1.0,
        relatedTopics: ['immigrant-services', 'sanctuary-city', 'integration-programs'],
        surpriseTopics: ['language-access', 'workforce-development']
      }
    };

    // Surprise topics pool - issues users might not select but should be aware of
    this.surpriseTopicsPool = [
      'municipal-broadband',
      'digital-privacy',
      'government-transparency',
      'civic-engagement',
      'budget-allocation',
      'infrastructure-maintenance',
      'senior-services',
      'disability-rights',
      'arts-culture-funding',
      'food-security'
    ];
  }

  /**
   * Generate personalized topic set with surprise injection
   * @param {Object} preferences - User onboarding preferences
   * @returns {Object} Personalized topic configuration
   */
  async generateTopicSet(preferences) {
    const { selectedIssues, zipCode, format, cadence } = preferences;
    
    // Base topics from user selections
    const baseTopics = this.extractBaseTopics(selectedIssues);
    
    // Inject surprise topics (at least 1 per session as per requirements)
    const surpriseTopics = this.injectSurpriseTopics(selectedIssues);
    
    // Apply geographic weighting based on ZIP code
    const geoWeightedTopics = await this.applyGeographicWeighting(baseTopics, zipCode);
    
    // Format-specific adjustments
    const formatAdjustedTopics = this.adjustForFormat(geoWeightedTopics, format);
    
    // Cadence-based topic distribution
    const distributedTopics = this.distributeForCadence(formatAdjustedTopics, cadence);
    
    return {
      baseTopics: distributedTopics,
      surpriseTopics,
      totalTopics: distributedTopics.length + surpriseTopics.length,
      diversityScore: this.calculateDiversityScore(distributedTopics, surpriseTopics),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Extract base topics from selected issues
   */
  extractBaseTopics(selectedIssues) {
    const topics = [];
    
    selectedIssues.forEach(issue => {
      if (this.issueCategories[issue]) {
        const category = this.issueCategories[issue];
        topics.push(...category.relatedTopics.map(topic => ({
          id: topic,
          category: issue,
          weight: category.weight,
          type: 'selected'
        })));
      }
    });
    
    return topics;
  }

  /**
   * Inject surprise topics to prevent echo chambers
   * Ensures at least 1 surprise topic per user session
   */
  injectSurpriseTopics(selectedIssues) {
    const surpriseCount = Math.max(1, Math.floor(selectedIssues.length * 0.3)); // 30% surprise ratio, minimum 1
    const availableSurprises = [...this.surpriseTopicsPool];
    
    // Add category-specific surprise topics
    selectedIssues.forEach(issue => {
      if (this.issueCategories[issue]?.surpriseTopics) {
        availableSurprises.push(...this.issueCategories[issue].surpriseTopics);
      }
    });
    
    // Randomly select surprise topics
    const selectedSurprises = [];
    for (let i = 0; i < surpriseCount && availableSurprises.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableSurprises.length);
      const surpriseTopic = availableSurprises.splice(randomIndex, 1)[0];
      
      selectedSurprises.push({
        id: surpriseTopic,
        category: 'surprise',
        weight: 0.7, // Lower weight for surprise topics
        type: 'surprise',
        reason: 'Broadening perspective'
      });
    }
    
    return selectedSurprises;
  }

  /**
   * Apply geographic weighting based on ZIP code
   * Mock implementation - would integrate with real NYC data
   */
  async applyGeographicWeighting(topics, zipCode) {
    // Mock geographic data - in production, this would query real NYC datasets
    const geoData = this.getMockGeoData(zipCode);
    
    return topics.map(topic => ({
      ...topic,
      geoWeight: geoData.relevanceScore || 1.0,
      localContext: geoData.localIssues || []
    }));
  }

  /**
   * Adjust topic selection based on preferred format
   */
  adjustForFormat(topics, format) {
    const formatMultipliers = {
      'visual': { 'housing-development': 1.2, 'infrastructure-maintenance': 1.3 },
      'articles': { 'budget-allocation': 1.2, 'government-transparency': 1.1 },
      'videos': { 'community-safety': 1.2, 'public-health': 1.1 },
      'mixed': {} // No specific adjustments for mixed format
    };
    
    const multipliers = formatMultipliers[format] || {};
    
    return topics.map(topic => ({
      ...topic,
      weight: topic.weight * (multipliers[topic.id] || 1.0)
    }));
  }

  /**
   * Distribute topics based on cadence preference
   */
  distributeForCadence(topics, cadence) {
    const cadenceConfig = {
      'daily': { maxTopics: 3, priorityWeight: 1.2 },
      'weekly': { maxTopics: 8, priorityWeight: 1.1 },
      'biweekly': { maxTopics: 12, priorityWeight: 1.0 },
      'monthly': { maxTopics: 20, priorityWeight: 0.9 }
    };
    
    const config = cadenceConfig[cadence] || cadenceConfig['weekly'];
    
    // Sort by weight and select top topics
    const sortedTopics = topics
      .map(topic => ({
        ...topic,
        finalWeight: topic.weight * (topic.geoWeight || 1.0) * config.priorityWeight
      }))
      .sort((a, b) => b.finalWeight - a.finalWeight)
      .slice(0, config.maxTopics);
    
    return sortedTopics;
  }

  /**
   * Calculate diversity score to ensure balanced content
   */
  calculateDiversityScore(baseTopics, surpriseTopics) {
    const totalTopics = baseTopics.length + surpriseTopics.length;
    const surpriseRatio = surpriseTopics.length / totalTopics;
    
    // Count unique categories
    const categories = new Set([
      ...baseTopics.map(t => t.category),
      ...surpriseTopics.map(t => t.category)
    ]);
    
    const categoryDiversity = categories.size / 8; // 8 total issue categories
    const surpriseDiversity = Math.min(surpriseRatio * 3, 1); // Cap at 1.0
    
    return Math.round((categoryDiversity * 0.7 + surpriseDiversity * 0.3) * 100) / 100;
  }

  /**
   * Mock geographic data - replace with real NYC API integration
   */
  getMockGeoData(zipCode) {
    // Mock data based on NYC ZIP codes
    const mockData = {
      '10001': { relevanceScore: 1.2, localIssues: ['housing-crisis', 'transportation'] },
      '10025': { relevanceScore: 1.1, localIssues: ['education', 'public-safety'] },
      '11201': { relevanceScore: 1.0, localIssues: ['gentrification', 'small-business'] },
      'default': { relevanceScore: 1.0, localIssues: [] }
    };
    
    return mockData[zipCode] || mockData['default'];
  }
}