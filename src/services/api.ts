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
}

interface VotePledge {
  userId: string;
  electionId: string;
  pledgeType: 'early-voting' | 'election-day' | 'absentee';
  scheduledDate?: string;
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
  VotePledge
};