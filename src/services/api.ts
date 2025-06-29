/**
 * API service for frontend-backend communication
 * Handles all HTTP requests with proper error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string[];
}

interface OnboardingData {
  issues: string[];
  format: string;
  reminders: boolean;
  cadence: string;
  zipCode: string;
  userId?: string;
}

interface OnboardingResult {
  id: string;
  userId: string;
  preferences: OnboardingData;
  personalizedTopics: {
    baseTopics: any[];
    surpriseTopics: any[];
    totalTopics: number;
    diversityScore: number;
    lastUpdated: string;
  };
  createdAt: string;
  status: string;
}

interface FeedItem {
  id: string;
  type: 'story' | 'video' | 'article';
  title: string;
  content: string;
  source: string;
  author: string;
  timestamp: string;
  tags: string[];
  verified: boolean;
  analysis?: {
    contradictions: any[];
    confidence: number;
    biasScore: number;
    factChecks: any[];
  };
  contradictions?: number;
  confidence?: number;
  biasScore?: number;
}

interface FlagData {
  contentId: string;
  userId: string;
  reason: string;
  description?: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
}

interface Quiz {
  quizId: string;
  questions: QuizQuestion[];
  totalQuestions: number;
  estimatedTime: number;
}

interface QuizResult {
  quizId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  results: any[];
  isPerfectScore: boolean;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  value: number;
  category: 'transit' | 'local' | 'boost';
  icon: string;
  available: boolean;
}

interface UserProfile {
  userId: string;
  totalXP: number;
  currentXP: number;
  metroPoints: number;
  level: number;
  transactions: any[];
  redemptions: any[];
  badges: string[];
  recentTransactions: any[];
  trustMetrics?: {
    reputation: number;
    trustLevel: string;
    flagWeight: number;
    canModerate: boolean;
    restrictions: string[];
  };
}

interface VotePledge {
  userId: string;
  electionId: string;
  pledgeType: 'early-voting' | 'election-day' | 'absentee';
  scheduledDate?: string;
}

interface TransparencyReport {
  timeframe: string;
  generatedAt: string;
  summary: {
    totalEvents: number;
    contentModerationActions: number;
    userActions: number;
    systemEvents: number;
  };
  moderation: {
    flagsReceived: number;
    flagsProcessed: number;
    contentRemoved: number;
    averageProcessingTime: number;
  };
  userEngagement: {
    quizzesCompleted: number;
    votePledges: number;
    rewardsRedeemed: number;
  };
  systemHealth: {
    uptime: string;
    averageResponseTime: number;
    errorRate: number;
  };
}

interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: string;
  category: string;
  severity: string;
  summary: string;
}

interface DashboardMetrics {
  timeframe: string;
  cohort?: string;
  kpis: {
    onboardingCompletion: { started: number; completed: number; rate: number };
    contradictionsPerHundredViews: { views: number; contradictions: number; rate: number };
    metroPointsRedemption: { earned: number; redeemed: number; rate: number };
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    retentionRate: number;
  };
  engagement: {
    totalEvents: number;
    uniqueUsers: number;
    averageSessionDuration: number;
    topEvents: Array<{ name: string; count: number }>;
  };
  content: {
    feedViews: number;
    contentShares: number;
    flagsSubmitted: number;
    quizzesCompleted: number;
    contradictionsFound: number;
  };
  funnel: {
    landingPageViews: number;
    onboardingStarted: number;
    onboardingCompleted: number;
    firstFeedView: number;
    firstQuizTaken: number;
    firstRewardRedeemed: number;
  };
}

interface CohortAnalysis {
  cohortId: string;
  userCount: number;
  engagement: {
    activeUsers: number;
    averageSessionsPerUser: number;
    averageEventsPerUser: number;
    retentionRate: number;
  };
  performance: {
    onboardingCompletion: { rate: number };
    quizParticipation: { rate: number };
    rewardRedemption: { rate: number };
    contentEngagement: { rate: number };
  };
}

interface FeatureFlags {
  features: string[];
  flags: Record<string, any>;
  cohort: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Analytics tracking
  async trackEvent(eventName: string, userId: string, properties?: any, metadata?: any): Promise<ApiResponse<any>> {
    return this.request<any>('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ eventName, userId, properties, metadata }),
    });
  }

  async getDashboardMetrics(timeframe = '24h', cohort?: string | null): Promise<ApiResponse<DashboardMetrics>> {
    const params = new URLSearchParams();
    params.append('timeframe', timeframe);
    if (cohort) params.append('cohort', cohort);
    
    return this.request<DashboardMetrics>(`/api/analytics/dashboard?${params.toString()}`);
  }

  async getCampaignAnalytics(campaignId: string, timeframe = '30d'): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/analytics/campaign/${campaignId}?timeframe=${timeframe}`);
  }

  async getCohortAnalysis(cohortId: string, timeframe = '30d'): Promise<ApiResponse<CohortAnalysis>> {
    return this.request<CohortAnalysis>(`/api/analytics/cohort/${cohortId}?timeframe=${timeframe}`);
  }

  // Feature flags
  async getUserFeatures(userId: string, userContext?: any): Promise<ApiResponse<FeatureFlags>> {
    const params = new URLSearchParams();
    if (userContext) {
      Object.entries(userContext).forEach(([key, value]) => {
        params.append(key, String(value));
      });
    }
    
    return this.request<FeatureFlags>(`/api/features/${userId}?${params.toString()}`);
  }

  async checkFeatureFlag(userId: string, flagName: string, userContext?: any): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (userContext) {
      Object.entries(userContext).forEach(([key, value]) => {
        params.append(key, String(value));
      });
    }
    
    return this.request<any>(`/api/features/${userId}/${flagName}?${params.toString()}`);
  }

  async getFeatureFlagAnalytics(timeframe = '24h'): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/analytics/feature-flags?timeframe=${timeframe}`);
  }

  // Feedback collection
  async submitFeedback(userId: string, type: string, data: any, metadata?: any): Promise<ApiResponse<any>> {
    return this.request<any>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ userId, type, data, metadata }),
    });
  }

  // Existing methods...
  async submitOnboarding(data: OnboardingData): Promise<ApiResponse<OnboardingResult>> {
    return this.request<OnboardingResult>('/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFeed(userId?: string, preferences?: any): Promise<ApiResponse<FeedItem[]>> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (preferences) params.append('preferences', JSON.stringify(preferences));
    
    const queryString = params.toString();
    const endpoint = `/api/feed${queryString ? `?${queryString}` : ''}`;
    
    return this.request<FeedItem[]>(endpoint);
  }

  async submitFlag(flagData: FlagData): Promise<ApiResponse<any>> {
    return this.request<any>('/api/flag', {
      method: 'POST',
      body: JSON.stringify(flagData),
    });
  }

  async generateQuiz(userId: string, preferences?: any): Promise<ApiResponse<Quiz>> {
    return this.request<Quiz>('/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({ userId, preferences }),
    });
  }

  async submitQuiz(quizId: string, answers: number[], userId: string): Promise<ApiResponse<QuizResult & { rewards?: any }>> {
    return this.request<QuizResult & { rewards?: any }>('/api/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ quizId, answers, userId }),
    });
  }

  async submitVotePledge(pledgeData: VotePledge): Promise<ApiResponse<any>> {
    return this.request<any>('/api/vote-pledge', {
      method: 'POST',
      body: JSON.stringify(pledgeData),
    });
  }

  async getRewards(): Promise<ApiResponse<Reward[]>> {
    return this.request<Reward[]>('/api/rewards');
  }

  async redeemReward(userId: string, rewardId: string, quantity = 1): Promise<ApiResponse<any>> {
    return this.request<any>('/api/rewards/redeem', {
      method: 'POST',
      body: JSON.stringify({ userId, rewardId, quantity }),
    });
  }

  async getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>(`/api/user/${userId}/profile`);
  }

  async getUserReputation(userId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/user/${userId}/reputation`);
  }

  async getTransparencyReport(timeframe = '30d'): Promise<ApiResponse<TransparencyReport>> {
    return this.request<TransparencyReport>(`/api/transparency/report?timeframe=${timeframe}`);
  }

  async getPublicAuditFeed(limit = 50, category?: string | null): Promise<ApiResponse<{ events: AuditEvent[] }>> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (category) params.append('category', category);
    
    return this.request<{ events: AuditEvent[] }>(`/api/audit/public?${params.toString()}`);
  }

  async getLeaderboard(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/leaderboard');
  }

  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const apiService = new ApiService();
export type { 
  OnboardingData, 
  OnboardingResult, 
  ApiResponse, 
  FeedItem, 
  FlagData, 
  Quiz,
  QuizQuestion,
  QuizResult,
  Reward,
  UserProfile,
  VotePledge,
  TransparencyReport,
  AuditEvent,
  DashboardMetrics,
  CohortAnalysis,
  FeatureFlags
};