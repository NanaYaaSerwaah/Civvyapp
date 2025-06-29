import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'

interface AnalyticsEvent {
  eventName: string
  properties?: Record<string, any>
  metadata?: Record<string, any>
}

export const useAnalytics = () => {
  const { user } = useAuth()

  const track = async (eventName: string, properties?: Record<string, any>, metadata?: Record<string, any>) => {
    if (!user) return

    try {
      await apiService.trackEvent(eventName, user.id, properties, {
        ...metadata,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer
      })
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }

  const trackPageView = (pageName: string, additionalProperties?: Record<string, any>) => {
    track('page_viewed', {
      page: pageName,
      ...additionalProperties
    })
  }

  const trackUserAction = (action: string, target: string, additionalProperties?: Record<string, any>) => {
    track('user_action', {
      action,
      target,
      ...additionalProperties
    })
  }

  const trackEngagement = (type: string, duration?: number, additionalProperties?: Record<string, any>) => {
    track('engagement', {
      type,
      duration,
      ...additionalProperties
    })
  }

  const trackConversion = (funnel: string, step: string, additionalProperties?: Record<string, any>) => {
    track('conversion', {
      funnel,
      step,
      ...additionalProperties
    })
  }

  const trackError = (error: string, context?: string, additionalProperties?: Record<string, any>) => {
    track('error_occurred', {
      error,
      context,
      ...additionalProperties
    })
  }

  // Auto-track page views
  useEffect(() => {
    const pathname = window.location.pathname
    const pageName = pathname === '/' ? 'home' : pathname.slice(1)
    trackPageView(pageName)
  }, [window.location.pathname])

  return {
    track,
    trackPageView,
    trackUserAction,
    trackEngagement,
    trackConversion,
    trackError
  }
}