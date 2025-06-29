import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiService, type FeatureFlags } from '../services/api'

export const useFeatureFlags = () => {
  const { user } = useAuth()
  const [features, setFeatures] = useState<FeatureFlags | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadFeatures()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadFeatures = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Get user context from localStorage
      const onboardingData = localStorage.getItem('civvy_onboarding')
      const userContext = onboardingData ? JSON.parse(onboardingData).preferences : {}
      
      const response = await apiService.getUserFeatures(user.id, {
        zipCode: userContext.zipCode,
        isEarlyAdopter: user.id === '1', // Mock early adopter check
        isAdmin: false, // Would be determined by user role
        isPilotCoordinator: false
      })

      if (response.success && response.data) {
        setFeatures(response.data)
      }
    } catch (error) {
      console.error('Feature flags loading error:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasFeature = (featureName: string): boolean => {
    return features?.features.includes(featureName) || false
  }

  const isEnabled = (flagName: string): boolean => {
    return features?.flags[flagName]?.enabled || false
  }

  const getCohort = (): string => {
    return features?.cohort || 'general'
  }

  const checkFlag = async (flagName: string): Promise<boolean> => {
    if (!user) return false

    try {
      const onboardingData = localStorage.getItem('civvy_onboarding')
      const userContext = onboardingData ? JSON.parse(onboardingData).preferences : {}
      
      const response = await apiService.checkFeatureFlag(user.id, flagName, userContext)
      
      return response.success && response.data?.enabled || false
    } catch (error) {
      console.error('Feature flag check error:', error)
      return false
    }
  }

  return {
    features,
    loading,
    hasFeature,
    isEnabled,
    getCohort,
    checkFlag,
    reload: loadFeatures
  }
}