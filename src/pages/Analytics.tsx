import React, { useState, useEffect } from 'react'
import { BarChart3, Users, TrendingUp, Clock, Target, Zap, Eye, Filter } from 'lucide-react'
import { apiService } from '../services/api'

interface DashboardMetrics {
  timeframe: string
  kpis: {
    onboardingCompletion: { started: number; completed: number; rate: number }
    contradictionsPerHundredViews: { views: number; contradictions: number; rate: number }
    metroPointsRedemption: { earned: number; redeemed: number; rate: number }
    dailyActiveUsers: number
    monthlyActiveUsers: number
    retentionRate: number
  }
  engagement: {
    totalEvents: number
    uniqueUsers: number
    averageSessionDuration: number
    topEvents: Array<{ name: string; count: number }>
  }
  content: {
    feedViews: number
    contentShares: number
    flagsSubmitted: number
    quizzesCompleted: number
    contradictionsFound: number
  }
  funnel: {
    landingPageViews: number
    onboardingStarted: number
    onboardingCompleted: number
    firstFeedView: number
    firstQuizTaken: number
    firstRewardRedeemed: number
  }
}

interface CohortAnalysis {
  cohortId: string
  userCount: number
  engagement: {
    activeUsers: number
    averageSessionsPerUser: number
    averageEventsPerUser: number
    retentionRate: number
  }
  performance: {
    onboardingCompletion: { rate: number }
    quizParticipation: { rate: number }
    rewardRedemption: { rate: number }
    contentEngagement: { rate: number }
  }
}

const Analytics: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [cohortAnalysis, setCohortAnalysis] = useState<CohortAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('24h')
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cohorts = [
    { id: 'manhattan_east', name: 'Manhattan East Pilot' },
    { id: 'brooklyn_north', name: 'Brooklyn North Pilot' },
    { id: 'queens_central', name: 'Queens Central Pilot' },
    { id: 'early_adopters', name: 'Early Adopters' },
    { id: 'general', name: 'General Users' }
  ]

  useEffect(() => {
    loadAnalytics()
  }, [timeframe, selectedCohort])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load dashboard metrics
      const metricsResponse = await apiService.getDashboardMetrics(timeframe, selectedCohort)
      
      if (metricsResponse.success && metricsResponse.data) {
        setMetrics(metricsResponse.data)
      }

      // Load cohort analysis for all cohorts
      const cohortPromises = cohorts.map(cohort => 
        apiService.getCohortAnalysis(cohort.id, timeframe)
      )
      
      const cohortResponses = await Promise.all(cohortPromises)
      const validCohorts = cohortResponses
        .filter(response => response.success && response.data)
        .map(response => response.data!)

      setCohortAnalysis(validCohorts)

    } catch (err) {
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getMetricColor = (rate: number, target: number) => {
    if (rate >= target) return 'text-success-600'
    if (rate >= target * 0.8) return 'text-warning-600'
    return 'text-error-600'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto bg-secondary-50 min-h-screen p-4">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-secondary-600">Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto bg-secondary-50 min-h-screen p-4">
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <p className="text-error-700">{error}</p>
          <button 
            onClick={loadAnalytics}
            className="mt-3 btn-primary px-4 py-2 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto bg-secondary-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 flex items-center">
              <BarChart3 className="mr-3" size={28} />
              Campaign Analytics Dashboard
            </h1>
            <p className="text-secondary-600 mt-1">
              Real-time pilot metrics and user engagement insights
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedCohort || ''}
              onChange={(e) => setSelectedCohort(e.target.value || null)}
              className="input w-48"
            >
              <option value="">All Cohorts</option>
              {cohorts.map(cohort => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </select>
            
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="input w-32"
            >
              <option value="1h">1 Hour</option>
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Performance Indicators */}
        {metrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Onboarding Completion Rate */}
              <div className="bg-white rounded-lg p-6 border border-secondary-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Target size={24} className="text-primary-600" />
                  </div>
                  <span className={`text-2xl font-bold ${getMetricColor(metrics.kpis.onboardingCompletion.rate, 80)}`}>
                    {metrics.kpis.onboardingCompletion.rate}%
                  </span>
                </div>
                <h3 className="font-semibold text-secondary-900 mb-1">Onboarding Completion</h3>
                <p className="text-sm text-secondary-600">
                  {metrics.kpis.onboardingCompletion.completed} of {metrics.kpis.onboardingCompletion.started} started
                </p>
                <div className="mt-3 text-xs text-secondary-500">
                  Target: ≥80% completion rate
                </div>
              </div>

              {/* Contradiction Detection Rate */}
              <div className="bg-white rounded-lg p-6 border border-secondary-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-warning-100 p-3 rounded-lg">
                    <Eye size={24} className="text-warning-600" />
                  </div>
                  <span className={`text-2xl font-bold ${getMetricColor(metrics.kpis.contradictionsPerHundredViews.rate, 2)}`}>
                    {metrics.kpis.contradictionsPerHundredViews.rate}
                  </span>
                </div>
                <h3 className="font-semibold text-secondary-900 mb-1">Contradictions/100 Views</h3>
                <p className="text-sm text-secondary-600">
                  {metrics.kpis.contradictionsPerHundredViews.contradictions} found in {formatNumber(metrics.kpis.contradictionsPerHundredViews.views)} views
                </p>
                <div className="mt-3 text-xs text-secondary-500">
                  Target: ≥2 contradictions per 100 views
                </div>
              </div>

              {/* MetroPoints Redemption Rate */}
              <div className="bg-white rounded-lg p-6 border border-secondary-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-success-100 p-3 rounded-lg">
                    <Zap size={24} className="text-success-600" />
                  </div>
                  <span className={`text-2xl font-bold ${getMetricColor(metrics.kpis.metroPointsRedemption.rate, 30)}`}>
                    {metrics.kpis.metroPointsRedemption.rate}%
                  </span>
                </div>
                <h3 className="font-semibold text-secondary-900 mb-1">MetroPoints Redemption</h3>
                <p className="text-sm text-secondary-600">
                  {metrics.kpis.metroPointsRedemption.redeemed} of {metrics.kpis.metroPointsRedemption.earned} earned
                </p>
                <div className="mt-3 text-xs text-secondary-500">
                  Target: ≥30% redemption within 30 days
                </div>
              </div>

              {/* Daily Active Users */}
              <div className="bg-white rounded-lg p-6 border border-secondary-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-accent-100 p-3 rounded-lg">
                    <Users size={24} className="text-accent-600" />
                  </div>
                  <span className="text-2xl font-bold text-secondary-900">
                    {formatNumber(metrics.kpis.dailyActiveUsers)}
                  </span>
                </div>
                <h3 className="font-semibold text-secondary-900 mb-1">Daily Active Users</h3>
                <p className="text-sm text-secondary-600">
                  MAU: {formatNumber(metrics.kpis.monthlyActiveUsers)}
                </p>
                <div className="mt-3 text-xs text-secondary-500">
                  Target: ≥45% DAU/MAU ratio
                </div>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Engagement */}
              <div className="bg-white rounded-lg p-6 border border-secondary-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="mr-2" size={20} />
                  User Engagement
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-600">Total Events</span>
                    <span className="font-semibold">{formatNumber(metrics.engagement.totalEvents)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-600">Unique Users</span>
                    <span className="font-semibold">{formatNumber(metrics.engagement.uniqueUsers)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-600">Avg Session Duration</span>
                    <span className="font-semibold">{formatDuration(metrics.engagement.averageSessionDuration)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-600">Events per User</span>
                    <span className="font-semibold">
                      {(metrics.engagement.totalEvents / metrics.engagement.uniqueUsers).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Metrics */}
              <div className="bg-white rounded-lg p-6 border border-secondary-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Eye className="mr-2" size={20} />
                  Content Performance
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-600">Feed Views</span>
                    <span className="font-semibold">{formatNumber(metrics.content.feedViews)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-600">Quizzes Completed</span>
                    <span className="font-semibold">{formatNumber(metrics.content.quizzesCompleted)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-600">Content Shares</span>
                    <span className="font-semibold">{formatNumber(metrics.content.contentShares)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-600">Flags Submitted</span>
                    <span className="font-semibold">{formatNumber(metrics.content.flagsSubmitted)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white rounded-lg p-6 border border-secondary-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Filter className="mr-2" size={20} />
                User Journey Funnel
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {formatNumber(metrics.funnel.landingPageViews)}
                  </div>
                  <div className="text-sm text-secondary-600">Landing Views</div>
                  <div className="text-xs text-secondary-500 mt-1">100%</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {formatNumber(metrics.funnel.onboardingStarted)}
                  </div>
                  <div className="text-sm text-secondary-600">Started Onboarding</div>
                  <div className="text-xs text-secondary-500 mt-1">
                    {metrics.funnel.landingPageViews > 0 
                      ? Math.round((metrics.funnel.onboardingStarted / metrics.funnel.landingPageViews) * 100)
                      : 0}%
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600 mb-1">
                    {formatNumber(metrics.funnel.onboardingCompleted)}
                  </div>
                  <div className="text-sm text-secondary-600">Completed Onboarding</div>
                  <div className="text-xs text-secondary-500 mt-1">
                    {metrics.funnel.onboardingStarted > 0 
                      ? Math.round((metrics.funnel.onboardingCompleted / metrics.funnel.onboardingStarted) * 100)
                      : 0}%
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent-600 mb-1">
                    {formatNumber(metrics.funnel.firstFeedView)}
                  </div>
                  <div className="text-sm text-secondary-600">First Feed View</div>
                  <div className="text-xs text-secondary-500 mt-1">
                    {metrics.funnel.onboardingCompleted > 0 
                      ? Math.round((metrics.funnel.firstFeedView / metrics.funnel.onboardingCompleted) * 100)
                      : 0}%
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning-600 mb-1">
                    {formatNumber(metrics.funnel.firstQuizTaken)}
                  </div>
                  <div className="text-sm text-secondary-600">First Quiz</div>
                  <div className="text-xs text-secondary-500 mt-1">
                    {metrics.funnel.firstFeedView > 0 
                      ? Math.round((metrics.funnel.firstQuizTaken / metrics.funnel.firstFeedView) * 100)
                      : 0}%
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600 mb-1">
                    {formatNumber(metrics.funnel.firstRewardRedeemed)}
                  </div>
                  <div className="text-sm text-secondary-600">First Reward</div>
                  <div className="text-xs text-secondary-500 mt-1">
                    {metrics.funnel.firstQuizTaken > 0 
                      ? Math.round((metrics.funnel.firstRewardRedeemed / metrics.funnel.firstQuizTaken) * 100)
                      : 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Top Events */}
            <div className="bg-white rounded-lg p-6 border border-secondary-200">
              <h3 className="text-lg font-semibold mb-4">Top User Actions</h3>
              
              <div className="space-y-3">
                {metrics.engagement.topEvents.slice(0, 8).map((event, index) => (
                  <div key={event.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-secondary-500 w-6">
                        #{index + 1}
                      </span>
                      <span className="font-medium text-secondary-900 capitalize">
                        {event.name.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-secondary-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ 
                            width: `${(event.count / metrics.engagement.topEvents[0].count) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="font-semibold text-secondary-900 w-16 text-right">
                        {formatNumber(event.count)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Cohort Analysis */}
        {cohortAnalysis.length > 0 && (
          <div className="bg-white rounded-lg p-6 border border-secondary-200">
            <h3 className="text-lg font-semibold mb-4">Pilot Cohort Performance</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 font-medium text-secondary-900">Cohort</th>
                    <th className="text-right py-3 px-4 font-medium text-secondary-900">Users</th>
                    <th className="text-right py-3 px-4 font-medium text-secondary-900">Active</th>
                    <th className="text-right py-3 px-4 font-medium text-secondary-900">Onboarding</th>
                    <th className="text-right py-3 px-4 font-medium text-secondary-900">Quiz Rate</th>
                    <th className="text-right py-3 px-4 font-medium text-secondary-900">Redemption</th>
                    <th className="text-right py-3 px-4 font-medium text-secondary-900">Retention</th>
                  </tr>
                </thead>
                <tbody>
                  {cohortAnalysis.map((cohort) => {
                    const cohortInfo = cohorts.find(c => c.id === cohort.cohortId)
                    return (
                      <tr key={cohort.cohortId} className="border-b border-secondary-100">
                        <td className="py-3 px-4 font-medium text-secondary-900">
                          {cohortInfo?.name || cohort.cohortId}
                        </td>
                        <td className="py-3 px-4 text-right text-secondary-700">
                          {cohort.userCount}
                        </td>
                        <td className="py-3 px-4 text-right text-secondary-700">
                          {cohort.engagement.activeUsers}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={getMetricColor(cohort.performance.onboardingCompletion.rate, 80)}>
                            {cohort.performance.onboardingCompletion.rate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={getMetricColor(cohort.performance.quizParticipation.rate, 50)}>
                            {cohort.performance.quizParticipation.rate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={getMetricColor(cohort.performance.rewardRedemption.rate, 30)}>
                            {cohort.performance.rewardRedemption.rate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={getMetricColor(cohort.engagement.retentionRate, 45)}>
                            {cohort.engagement.retentionRate}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-white rounded-lg p-6 border border-secondary-200 text-center">
          <p className="text-sm text-secondary-600 mb-2">
            Real-time analytics dashboard for Civvy pilot program monitoring and optimization.
          </p>
          <p className="text-xs text-secondary-500">
            Data refreshed every 5 minutes • Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Analytics