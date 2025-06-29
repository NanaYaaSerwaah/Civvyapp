/**
 * FactHunter - AI-powered contradiction detection service
 * Analyzes content for factual inconsistencies and bias detection
 */
import natural from 'natural';
import nlp from 'compromise';

export class FactHunter {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.analyzer = natural.SentimentAnalyzer;
    
    // Initialize contradiction patterns
    this.contradictionPatterns = [
      // Numerical contradictions
      { pattern: /(\d+(?:\.\d+)?)\s*(million|billion|thousand|percent|%)/gi, type: 'numerical' },
      // Policy contradictions
      { pattern: /(support|oppose|against|for)\s+(.*?)(but|however|although)/gi, type: 'policy' },
      // Timeline contradictions
      { pattern: /(will|plans to|intends to)\s+(.*?)(by|before|after)\s+(\d{4})/gi, type: 'timeline' },
      // Funding contradictions
      { pattern: /(increase|decrease|cut|boost)\s+(funding|budget|spending)/gi, type: 'funding' }
    ];
    
    // Known fact database (mock - would be real database in production)
    this.factDatabase = {
      'nyc-budget-2024': { amount: 106.7, unit: 'billion', source: 'NYC.gov' },
      'mta-ridership-2023': { amount: 4.3, unit: 'million', period: 'daily', source: 'MTA' },
      'affordable-housing-goal': { amount: 250000, unit: 'units', timeline: '2030', source: 'Housing Plan' }
    };
  }

  /**
   * Analyze content for contradictions
   * @param {Object} contentItem - Content to analyze
   * @param {Array} relatedContent - Related content for comparison
   * @returns {Object} Analysis result with confidence score
   */
  async analyzeContent(contentItem, relatedContent = []) {
    try {
      const analysis = {
        contentId: contentItem.id,
        contradictions: [],
        confidence: 0,
        factChecks: [],
        biasScore: 0,
        timestamp: new Date().toISOString()
      };

      // Extract claims from content
      const claims = this.extractClaims(contentItem.content);
      
      // Check for internal contradictions
      const internalContradictions = this.findInternalContradictions(claims);
      
      // Check against related content
      const externalContradictions = this.findExternalContradictions(claims, relatedContent);
      
      // Fact-check against known database
      const factChecks = await this.performFactChecks(claims);
      
      // Calculate bias score
      const biasScore = this.calculateBiasScore(contentItem.content);
      
      // Combine all contradictions
      analysis.contradictions = [...internalContradictions, ...externalContradictions];
      analysis.factChecks = factChecks;
      analysis.biasScore = biasScore;
      
      // Calculate overall confidence score
      analysis.confidence = this.calculateConfidenceScore(analysis);
      
      return analysis;
      
    } catch (error) {
      console.error('FactHunter analysis error:', error);
      return {
        contentId: contentItem.id,
        contradictions: [],
        confidence: 0,
        error: 'Analysis failed'
      };
    }
  }

  /**
   * Extract factual claims from content
   */
  extractClaims(content) {
    const doc = nlp(content);
    const claims = [];
    
    // Extract numerical claims
    const numbers = doc.match('#Value').out('array');
    numbers.forEach(num => {
      const context = this.getContext(content, num);
      claims.push({
        type: 'numerical',
        value: num,
        context,
        confidence: 0.8
      });
    });
    
    // Extract policy statements
    const policies = doc.match('(will|plans to|intends to) #Verb').out('array');
    policies.forEach(policy => {
      claims.push({
        type: 'policy',
        statement: policy,
        confidence: 0.7
      });
    });
    
    // Extract timeline claims
    const timelines = doc.match('(by|before|after) #Date').out('array');
    timelines.forEach(timeline => {
      claims.push({
        type: 'timeline',
        statement: timeline,
        confidence: 0.75
      });
    });
    
    return claims;
  }

  /**
   * Find contradictions within the same content
   */
  findInternalContradictions(claims) {
    const contradictions = [];
    
    // Check numerical contradictions
    const numericalClaims = claims.filter(c => c.type === 'numerical');
    for (let i = 0; i < numericalClaims.length; i++) {
      for (let j = i + 1; j < numericalClaims.length; j++) {
        const contradiction = this.compareNumericalClaims(numericalClaims[i], numericalClaims[j]);
        if (contradiction) {
          contradictions.push(contradiction);
        }
      }
    }
    
    // Check policy contradictions
    const policyClaims = claims.filter(c => c.type === 'policy');
    const policyContradictions = this.findPolicyContradictions(policyClaims);
    contradictions.push(...policyContradictions);
    
    return contradictions;
  }

  /**
   * Find contradictions with external content
   */
  findExternalContradictions(claims, relatedContent) {
    const contradictions = [];
    
    relatedContent.forEach(content => {
      const externalClaims = this.extractClaims(content.content);
      
      claims.forEach(claim => {
        externalClaims.forEach(externalClaim => {
          if (claim.type === externalClaim.type) {
            const contradiction = this.compareClaims(claim, externalClaim, content);
            if (contradiction) {
              contradictions.push(contradiction);
            }
          }
        });
      });
    });
    
    return contradictions;
  }

  /**
   * Perform fact-checks against known database
   */
  async performFactChecks(claims) {
    const factChecks = [];
    
    for (const claim of claims) {
      if (claim.type === 'numerical') {
        const factCheck = await this.checkAgainstDatabase(claim);
        if (factCheck) {
          factChecks.push(factCheck);
        }
      }
    }
    
    return factChecks;
  }

  /**
   * Calculate bias score using sentiment analysis
   */
  calculateBiasScore(content) {
    const tokens = this.tokenizer.tokenize(content.toLowerCase());
    const stemmedTokens = tokens.map(token => this.stemmer.stem(token));
    
    // Bias indicators
    const biasWords = {
      extreme: ['always', 'never', 'all', 'none', 'every', 'completely'],
      emotional: ['terrible', 'amazing', 'disaster', 'perfect', 'horrible', 'wonderful'],
      absolute: ['definitely', 'certainly', 'obviously', 'clearly', 'undoubtedly']
    };
    
    let biasScore = 0;
    let totalWords = stemmedTokens.length;
    
    Object.values(biasWords).flat().forEach(biasWord => {
      const count = stemmedTokens.filter(token => token.includes(biasWord)).length;
      biasScore += count;
    });
    
    return Math.min(biasScore / totalWords * 10, 1); // Normalize to 0-1
  }

  /**
   * Calculate overall confidence score
   */
  calculateConfidenceScore(analysis) {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on number of contradictions found
    if (analysis.contradictions.length > 0) {
      confidence += Math.min(analysis.contradictions.length * 0.1, 0.3);
    }
    
    // Increase confidence based on fact-checks
    if (analysis.factChecks.length > 0) {
      confidence += Math.min(analysis.factChecks.length * 0.05, 0.2);
    }
    
    // Adjust based on bias score
    confidence += analysis.biasScore * 0.1;
    
    return Math.min(Math.round(confidence * 100) / 100, 1.0);
  }

  /**
   * Helper methods
   */
  getContext(content, term) {
    const index = content.indexOf(term);
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + term.length + 50);
    return content.substring(start, end);
  }

  compareNumericalClaims(claim1, claim2) {
    // Simple numerical contradiction detection
    const num1 = parseFloat(claim1.value);
    const num2 = parseFloat(claim2.value);
    
    if (!isNaN(num1) && !isNaN(num2) && Math.abs(num1 - num2) > num1 * 0.1) {
      return {
        type: 'numerical_contradiction',
        claim1: claim1.value,
        claim2: claim2.value,
        confidence: 0.8,
        description: `Conflicting numbers: ${claim1.value} vs ${claim2.value}`
      };
    }
    
    return null;
  }

  findPolicyContradictions(claims) {
    // Policy contradiction detection logic
    const contradictions = [];
    
    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        const statement1 = claims[i].statement.toLowerCase();
        const statement2 = claims[j].statement.toLowerCase();
        
        // Check for opposing keywords
        if ((statement1.includes('support') && statement2.includes('oppose')) ||
            (statement1.includes('increase') && statement2.includes('decrease'))) {
          contradictions.push({
            type: 'policy_contradiction',
            statement1: claims[i].statement,
            statement2: claims[j].statement,
            confidence: 0.75,
            description: 'Conflicting policy positions detected'
          });
        }
      }
    }
    
    return contradictions;
  }

  compareClaims(claim1, claim2, sourceContent) {
    // Compare claims from different sources
    if (claim1.type === 'numerical' && claim2.type === 'numerical') {
      const num1 = parseFloat(claim1.value);
      const num2 = parseFloat(claim2.value);
      
      if (!isNaN(num1) && !isNaN(num2) && Math.abs(num1 - num2) > Math.max(num1, num2) * 0.15) {
        return {
          type: 'external_contradiction',
          claim1: claim1.value,
          claim2: claim2.value,
          source: sourceContent.source,
          confidence: 0.7,
          description: `Different sources report conflicting numbers`
        };
      }
    }
    
    return null;
  }

  async checkAgainstDatabase(claim) {
    // Mock fact-checking against database
    const value = parseFloat(claim.value);
    
    // Check NYC budget claims
    if (claim.context && claim.context.toLowerCase().includes('budget')) {
      const budgetFact = this.factDatabase['nyc-budget-2024'];
      if (Math.abs(value - budgetFact.amount) > budgetFact.amount * 0.05) {
        return {
          type: 'fact_check',
          claim: claim.value,
          factValue: budgetFact.amount,
          source: budgetFact.source,
          accuracy: 'disputed',
          confidence: 0.9
        };
      }
    }
    
    return null;
  }
}