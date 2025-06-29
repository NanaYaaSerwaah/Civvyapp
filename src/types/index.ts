export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Issue {
  id: string
  name: string
  category: string
  description?: string
}

export interface OnboardingPreferences {
  issues: string[]
  format: 'visual' | 'articles' | 'videos' | 'mixed'
  reminders: boolean
  cadence: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  zipCode: string
}

export interface ContentItem {
  id: string
  title: string
  content: string
  source: string
  type: 'story' | 'video' | 'article'
  timestamp: string
  contradictions?: number
  confidence?: number
}

export interface Reward {
  id: string
  title: string
  description: string
  cost: number
  category: 'transit' | 'local' | 'boost'
  icon: string
}

export interface UserActivity {
  id: string
  userId: string
  action: string
  points: number
  timestamp: string
}