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

  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const apiService = new ApiService();
export type { OnboardingData, OnboardingResult, ApiResponse, FeedItem, FlagData };