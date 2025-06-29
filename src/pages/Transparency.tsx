import React, { useState, useEffect } from 'react'
import { Shield, Eye, BarChart3, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import { apiService } from '../services/api'

interface TransparencyReport {
  timeframe: string
  generatedAt: string
  summary: {
    totalEvents: number
    contentModerationActions: number
    userActions: number
    systemEvents: number
  }
  moderation: {
    flagsReceived: number
    flagsProcessed: number
    contentRemoved: number
    averageProcessingTime: number
  }
  userEngagement: {
    quizzesCompleted: number
    votePledges: number
    rewardsRedeemed: number
  }
  systemHealth: {
    uptime: string
    averageResponseTime: number
    errorRate: number
  }
}

interface AuditEvent {
  id: string
  timestamp: string
  eventType: string
  category: string
  severity: string
  summary: string
}

const Transparency: React.FC = () => {
  const [report, setReport] = useState<TransparencyReport | null>(null)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30d')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    loadTransparencyData()
  }, [timeframe])

  const loadTransparencyData = async () => {
    try {
      setLoading(true)
      
      const [reportResponse, auditResponse] = await Promise.all([
        apiService.getTransparencyReport(timeframe),
        apiService.getPublicAuditFeed(50, selectedCategory)
      ])

      if (reportResponse.success && reportResponse.data) {
        setReport(reportResponse.data)
      }

      if (auditResponse.success && auditResponse.data) {
        setAuditEvents(auditResponse.data.events)
      }

    } catch (error) {
      console.error('Failed to load transparency data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-success-100 text-success-800',
      medium: 'bg-warning-100 text-warning-800',
      high: 'bg-error-100 text-error-800',
      critical: 'bg-error-200 text-error-900'
    }
    return colors[severity as keyof typeof colors] || 'bg-secondary-100 text-secondary-800'
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      moderation: Shield,
      user_action: TrendingUp,
      system: BarChart3,
      security: AlertTriangle
    }
    return icons[category as keyof typeof icons] || Eye
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-secondary-50 min-h-screen p-4">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-secondary-600">Loading transparency report...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto bg-secondary-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200 px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 flex items-center">
              <Eye className="mr-3" size={28} />
              Transparency Center
            </h1>
            <p className="text-secondary-600 mt-1">
              Open moderation logs and platform accountability
            </p>
          </div>
          
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="input w-32"
          >
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
          </select>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Summary Cards */}
        {report && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-secondary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">Total Events</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {report.summary.totalEvents.toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="text-primary-600" size={24} />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-secondary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">Flags Processed</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {report.moderation.flagsProcessed}
                  </p>
                </div>
                <Shield className="text-success-600" size={24} />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-secondary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {Math.round(report.moderation.averageProcessingTime / 1000 / 60)}m
                  </p>
                </div>
                <Clock className="text-warning-600" size={24} />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-secondary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">System Uptime</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {report.systemHealth.uptime}
                  </p>
                </div>
                <CheckCircle className="text-success-600" size={24} />
              </div>
            </div>
          </div>
        )}

        {/* Detailed Metrics */}
        {report && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Moderation Metrics */}
            <div className="bg-white rounded-lg p-6 border border-secondary-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Shield className="mr-2" size={20} />
                Content Moderation
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Flags Received</span>
                  <span className="font-semibold">{report.moderation.flagsReceived}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Flags Processed</span>
                  <span className="font-semibold">{report.moderation.flagsProcessed}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Content Removed</span>
                  <span className="font-semibold">{report.moderation.contentRemoved}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Processing Rate</span>
                  <span className="font-semibold">
                    {report.moderation.flagsReceived > 0 
                      ? Math.round((report.moderation.flagsProcessed / report.moderation.flagsReceived) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* User Engagement */}
            <div className="bg-white rounded-lg p-6 border border-secondary-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="mr-2" size={20} />
                User Engagement
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Quizzes Completed</span>
                  <span className="font-semibold">{report.userEngagement.quizzesCompleted}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Vote Pledges</span>
                  <span className="font-semibold">{report.userEngagement.votePledges}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Rewards Redeemed</span>
                  <span className="font-semibold">{report.userEngagement.rewardsRedeemed}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Error Rate</span>
                  <span className="font-semibold">{report.systemHealth.errorRate}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Audit Events */}
        <div className="bg-white rounded-lg border border-secondary-200">
          <div className="p-6 border-b border-secondary-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center">
                <Eye className="mr-2" size={20} />
                Recent Audit Events
              </h3>
              
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="input w-40"
              >
                <option value="">All Categories</option>
                <option value="moderation">Moderation</option>
                <option value="user_action">User Actions</option>
                <option value="system">System</option>
                <option value="security">Security</option>
              </select>
            </div>
          </div>
          
          <div className="divide-y divide-secondary-100 max-h-96 overflow-y-auto">
            {auditEvents.map((event) => {
              const CategoryIcon = getCategoryIcon(event.category)
              
              return (
                <div key={event.id} className="p-4 hover:bg-secondary-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="bg-secondary-100 p-2 rounded-lg">
                        <CategoryIcon size={16} className="text-secondary-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-secondary-900 capitalize">
                            {event.eventType.replace('_', ' ')}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(event.severity)}`}>
                            {event.severity}
                          </span>
                        </div>
                        
                        <p className="text-sm text-secondary-600 mb-1">
                          {event.summary}
                        </p>
                        
                        <p className="text-xs text-secondary-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {auditEvents.length === 0 && (
            <div className="p-8 text-center text-secondary-500">
              <Eye size={48} className="mx-auto mb-4 opacity-50" />
              <p>No audit events found for the selected criteria.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white rounded-lg p-6 border border-secondary-200 text-center">
          <p className="text-sm text-secondary-600 mb-2">
            This transparency report is updated in real-time and shows all moderation actions taken on the platform.
          </p>
          <p className="text-xs text-secondary-500">
            Last updated: {report ? new Date(report.generatedAt).toLocaleString() : 'Loading...'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Transparency