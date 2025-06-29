import React, { useState, useEffect } from 'react'
import { Flag, Share2, MessageCircle, Heart, AlertTriangle, CheckCircle, Info, Brain, Vote } from 'lucide-react'
import { apiService, type FeedItem } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import QuizModal from '../components/QuizModal'

const Feed: React.FC = () => {
  const { user } = useAuth()
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flaggingItem, setFlaggingItem] = useState<string | null>(null)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [showPledgeModal, setShowPledgeModal] = useState(false)

  useEffect(() => {
    loadFeed()
  }, [user])

  const loadFeed = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get user preferences from localStorage
      const onboardingData = localStorage.getItem('civvy_onboarding')
      const preferences = onboardingData ? JSON.parse(onboardingData).preferences : {}
      
      const response = await apiService.getFeed(user?.id, preferences)
      
      if (response.success && response.data) {
        setFeedItems(response.data)
      } else {
        setError(response.error || 'Failed to load feed')
      }
    } catch (err) {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleFlag = async (contentId: string, reason: string, description?: string) => {
    if (!user) return

    try {
      const response = await apiService.submitFlag({
        contentId,
        userId: user.id,
        reason,
        description
      })

      if (response.success) {
        // Show success feedback
        alert('Content flagged successfully. Thank you for helping maintain quality!')
        setFlaggingItem(null)
      } else {
        alert('Failed to flag content. Please try again.')
      }
    } catch (err) {
      alert('Network error. Please try again.')
    }
  }

  const handleVotePledge = async (pledgeType: 'early-voting' | 'election-day' | 'absentee') => {
    if (!user) return

    try {
      const response = await apiService.submitVotePledge({
        userId: user.id,
        electionId: 'nyc-2024-general',
        pledgeType,
        scheduledDate: pledgeType === 'early-voting' ? '2024-10-26' : '2024-11-05'
      })

      if (response.success) {
        alert(`Vote pledge submitted! You've earned XP for your civic commitment.`)
        setShowPledgeModal(false)
      } else {
        alert(response.error || 'Failed to submit vote pledge')
      }
    } catch (err) {
      alert('Network error. Please try again.')
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success-600 bg-success-100'
    if (confidence >= 0.6) return 'text-warning-600 bg-warning-100'
    return 'text-error-600 bg-error-100'
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle
    if (confidence >= 0.6) return AlertTriangle
    return Info
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <div className="sticky top-0 bg-white border-b border-secondary-200 px-4 py-3 z-10">
          <h1 className="text-xl font-bold text-center">Your Feed</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-secondary-600">Loading your personalized feed...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <div className="sticky top-0 bg-white border-b border-secondary-200 px-4 py-3 z-10">
          <h1 className="text-xl font-bold text-center">Your Feed</h1>
        </div>
        <div className="p-4">
          <div className="bg-error-50 border border-error-200 rounded-lg p-4">
            <p className="text-error-700">{error}</p>
            <button 
              onClick={loadFeed}
              className="mt-3 btn-primary px-4 py-2 text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-secondary-200 px-4 py-3 z-10">
        <h1 className="text-xl font-bold text-center">Your Feed</h1>
        <p className="text-xs text-center text-secondary-500 mt-1">
          AI-powered fact-checking enabled
        </p>
      </div>

      {/* Action Cards */}
      <div className="p-4 space-y-3">
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 p-2 rounded-lg">
                <Brain size={20} className="text-primary-600" />
              </div>
              <div>
                <h3 className="font-medium text-primary-900">Test Your Knowledge</h3>
                <p className="text-sm text-primary-700">Take a civic quiz and earn XP</p>
              </div>
            </div>
            <button
              onClick={() => setShowQuizModal(true)}
              className="btn-primary px-4 py-2 text-sm"
            >
              Start Quiz
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-success-50 to-accent-50 border border-success-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-success-100 p-2 rounded-lg">
                <Vote size={20} className="text-success-600" />
              </div>
              <div>
                <h3 className="font-medium text-success-900">Make a Vote Pledge</h3>
                <p className="text-sm text-success-700">Commit to voting and earn rewards</p>
              </div>
            </div>
            <button
              onClick={() => setShowPledgeModal(true)}
              className="bg-success-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-success-700 transition-colors"
            >
              Pledge
            </button>
          </div>
        </div>
      </div>

      {/* Feed Items */}
      <div className="space-y-4 p-4">
        {feedItems.map(item => {
          const ConfidenceIcon = getConfidenceIcon(item.confidence || 0)
          
          return (
            <div key={item.id} className="bg-white border border-secondary-200 rounded-lg overflow-hidden shadow-sm">
              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-secondary-900 flex-1">{item.title}</h3>
                  {(item.contradictions || 0) > 0 && (
                    <div className="bg-warning-100 text-warning-800 px-2 py-1 rounded-full text-xs font-medium ml-2 flex items-center">
                      <AlertTriangle size={12} className="mr-1" />
                      {item.contradictions} contradiction{(item.contradictions || 0) > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                
                <p className="text-secondary-700 text-sm mb-3">{item.content}</p>
                
                <div className="flex items-center justify-between text-xs text-secondary-500 mb-3">
                  <span className="flex items-center">
                    {item.verified && <CheckCircle size={12} className="mr-1 text-success-500" />}
                    {item.source}
                  </span>
                  <span>{new Date(item.timestamp).toLocaleString()}</span>
                </div>

                {/* AI Analysis Section */}
                {item.confidence && (
                  <div className="bg-secondary-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <ConfidenceIcon size={14} className={`mr-1 ${getConfidenceColor(item.confidence).split(' ')[0]}`} />
                        <span className="text-xs font-medium text-secondary-700">AI Fact-Check</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(item.confidence)}`}>
                        {Math.round(item.confidence * 100)}% confidence
                      </span>
                    </div>
                    
                    <div className="w-full bg-secondary-200 rounded-full h-1.5 mb-2">
                      <div 
                        className={`h-1.5 rounded-full ${
                          item.confidence >= 0.8 ? 'bg-success-500' :
                          item.confidence >= 0.6 ? 'bg-warning-500' : 'bg-error-500'
                        }`}
                        style={{ width: `${item.confidence * 100}%` }}
                      />
                    </div>
                    
                    {item.biasScore && item.biasScore > 0.3 && (
                      <div className="text-xs text-secondary-600 mt-1">
                        ⚠️ Potential bias detected - consider multiple sources
                      </div>
                    )}
                  </div>
                )}

                {/* Contradiction Details */}
                {item.analysis && item.analysis.contradictions.length > 0 && (
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 mb-3">
                    <h4 className="text-sm font-medium text-warning-800 mb-2">Contradictions Found:</h4>
                    {item.analysis.contradictions.slice(0, 2).map((contradiction, index) => (
                      <div key={index} className="text-xs text-warning-700 mb-1">
                        • {contradiction.description || 'Conflicting information detected'}
                      </div>
                    ))}
                    {item.analysis.contradictions.length > 2 && (
                      <div className="text-xs text-warning-600">
                        +{item.analysis.contradictions.length - 2} more contradictions
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-secondary-100 px-4 py-3">
                <div className="flex items-center justify-around">
                  <button 
                    onClick={() => setFlaggingItem(item.id)}
                    className="flex items-center space-x-2 text-secondary-600 hover:text-error-600 transition-colors"
                  >
                    <Flag size={18} />
                    <span className="text-sm">Flag</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 text-secondary-600 hover:text-primary-600 transition-colors">
                    <Heart size={18} />
                    <span className="text-sm">Like</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 text-secondary-600 hover:text-primary-600 transition-colors">
                    <MessageCircle size={18} />
                    <span className="text-sm">Discuss</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 text-secondary-600 hover:text-primary-600 transition-colors">
                    <Share2 size={18} />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Flag Modal */}
      {flaggingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Flag Content</h3>
            <p className="text-sm text-secondary-600 mb-4">
              Help us maintain quality by reporting problematic content.
            </p>
            
            <div className="space-y-2 mb-4">
              {[
                { value: 'misinformation', label: 'Misinformation' },
                { value: 'bias', label: 'Bias' },
                { value: 'inaccuracy', label: 'Inaccuracy' },
                { value: 'inappropriate', label: 'Inappropriate' },
                { value: 'other', label: 'Other' }
              ].map(reason => (
                <button
                  key={reason.value}
                  onClick={() => handleFlag(flaggingItem, reason.value)}
                  className="w-full text-left p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors"
                >
                  {reason.label}
                </button>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setFlaggingItem(null)}
                className="flex-1 btn-outline py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vote Pledge Modal */}
      {showPledgeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Make Your Vote Pledge</h3>
            <p className="text-sm text-secondary-600 mb-4">
              Commit to voting in the upcoming election and earn 100 XP!
            </p>
            
            <div className="space-y-3 mb-4">
              <button
                onClick={() => handleVotePledge('early-voting')}
                className="w-full text-left p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors"
              >
                <div className="font-medium">Early Voting</div>
                <div className="text-sm text-secondary-600">October 26 - November 3</div>
              </button>
              
              <button
                onClick={() => handleVotePledge('election-day')}
                className="w-full text-left p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors"
              >
                <div className="font-medium">Election Day</div>
                <div className="text-sm text-secondary-600">November 5, 2024</div>
              </button>
              
              <button
                onClick={() => handleVotePledge('absentee')}
                className="w-full text-left p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors"
              >
                <div className="font-medium">Absentee Ballot</div>
                <div className="text-sm text-secondary-600">Mail-in voting</div>
              </button>
            </div>
            
            <button
              onClick={() => setShowPledgeModal(false)}
              className="w-full btn-outline py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      <QuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onComplete={(result) => {
          console.log('Quiz completed:', result)
          // Could show a success toast or update UI
        }}
      />

      {/* Empty State */}
      {feedItems.length === 0 && !loading && (
        <div className="text-center py-8 px-4">
          <div className="bg-primary-50 rounded-lg p-6">
            <h3 className="font-semibold text-primary-900 mb-2">Your Feed is Ready!</h3>
            <p className="text-primary-700 text-sm mb-4">
              We're analyzing the latest content with AI-powered fact-checking. 
              Check back soon for personalized updates.
            </p>
            <button 
              onClick={loadFeed}
              className="btn-primary px-4 py-2"
            >
              Refresh Feed
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Feed