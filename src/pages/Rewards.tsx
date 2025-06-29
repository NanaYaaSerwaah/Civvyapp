import React, { useState, useEffect } from 'react'
import { Gift, Zap, MapPin, Coffee, Utensils, Trophy, Star, Clock } from 'lucide-react'
import { apiService, type Reward, type UserProfile } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const Rewards: React.FC = () => {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const [profileResponse, rewardsResponse] = await Promise.all([
        apiService.getUserProfile(user.id),
        apiService.getRewards()
      ])

      if (profileResponse.success && profileResponse.data) {
        setUserProfile(profileResponse.data)
      }

      if (rewardsResponse.success && rewardsResponse.data) {
        setRewards(rewardsResponse.data)
      }

    } catch (err) {
      setError('Failed to load rewards data')
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async (rewardId: string) => {
    if (!user || !userProfile) return

    try {
      setRedeeming(rewardId)
      const response = await apiService.redeemReward(user.id, rewardId)

      if (response.success) {
        // Update user profile with new balance
        setUserProfile(prev => prev ? {
          ...prev,
          metroPoints: response.data.remainingPoints
        } : null)

        alert('Reward redeemed successfully!')
      } else {
        alert(response.error || 'Failed to redeem reward')
      }
    } catch (err) {
      alert('Network error. Please try again.')
    } finally {
      setRedeeming(null)
    }
  }

  const getRewardIcon = (category: string, iconName: string) => {
    const iconMap = {
      'train': MapPin,
      'coffee': Coffee,
      'utensils': Utensils,
      'zap': Zap
    }
    return iconMap[iconName as keyof typeof iconMap] || Gift
  }

  const getCategoryColor = (category: string) => {
    const colorMap = {
      'transit': 'bg-primary-100 text-primary-600',
      'local': 'bg-accent-100 text-accent-600',
      'boost': 'bg-success-100 text-success-600'
    }
    return colorMap[category as keyof typeof colorMap] || 'bg-secondary-100 text-secondary-600'
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-secondary-50 min-h-screen">
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-6">
          <h1 className="text-2xl font-bold">Rewards</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-secondary-600">Loading rewards...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-secondary-50 min-h-screen">
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-6">
          <h1 className="text-2xl font-bold">Rewards</h1>
        </div>
        <div className="p-4">
          <div className="bg-error-50 border border-error-200 rounded-lg p-4">
            <p className="text-error-700">{error}</p>
            <button 
              onClick={loadData}
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
    <div className="max-w-md mx-auto bg-secondary-50 min-h-screen">
      {/* Header with Points Display */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-6">
        <h1 className="text-2xl font-bold mb-4">Rewards</h1>
        
        {userProfile && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{userProfile.totalXP.toLocaleString()}</div>
                <div className="text-xs opacity-90">Total XP</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{userProfile.metroPoints}</div>
                <div className="text-xs opacity-90">MetroPoints</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{userProfile.level}</div>
                <div className="text-xs opacity-90">Level</div>
              </div>
            </div>
            
            {/* XP Progress to next MetroPoint */}
            <div className="mt-3">
              <div className="flex justify-between text-xs opacity-90 mb-1">
                <span>Progress to next MetroPoint</span>
                <span>{userProfile.currentXP}/100 XP</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(userProfile.currentXP / 100) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Available Rewards */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Gift className="mr-2" size={20} />
          Available Rewards
        </h2>
        
        <div className="space-y-3 mb-8">
          {rewards.map(reward => {
            const Icon = getRewardIcon(reward.category, reward.icon)
            const canAfford = userProfile ? userProfile.metroPoints >= reward.cost : false
            const isRedeeming = redeeming === reward.id
            
            return (
              <div 
                key={reward.id}
                className={`bg-white rounded-lg p-4 border transition-all ${
                  canAfford ? 'border-secondary-200 shadow-sm' : 'border-secondary-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(reward.category)}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium">{reward.title}</h3>
                      <p className="text-sm text-secondary-600">{reward.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold">{reward.cost}</div>
                    <div className="text-xs text-secondary-500">MetroPoints</div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleRedeem(reward.id)}
                  disabled={!canAfford || isRedeeming}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                    canAfford && !isRedeeming
                      ? 'bg-primary-600 text-white hover:bg-primary-700' 
                      : 'bg-secondary-200 text-secondary-500 cursor-not-allowed'
                  }`}
                >
                  {isRedeeming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Redeeming...
                    </>
                  ) : canAfford ? (
                    'Redeem Now'
                  ) : (
                    `Need ${reward.cost - (userProfile?.metroPoints || 0)} more points`
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Recent Activity */}
        {userProfile && userProfile.recentTransactions.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="mr-2" size={20} />
              Recent Activity
            </h2>
            
            <div className="bg-white rounded-lg divide-y divide-secondary-100">
              {userProfile.recentTransactions.slice(0, 5).map((transaction, index) => (
                <div key={transaction.id || index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-secondary-900">
                        {transaction.type === 'earn' ? (
                          <>
                            {transaction.action === 'quiz_completion' && '🧠 Completed Quiz'}
                            {transaction.action === 'quiz_perfect_score' && '🏆 Perfect Quiz Score'}
                            {transaction.action === 'vote_pledge' && '🗳️ Made Vote Pledge'}
                            {transaction.action === 'flag_submission' && '🚩 Flagged Content'}
                            {transaction.action === 'flag_verified' && '✅ Flag Verified'}
                            {!['quiz_completion', 'quiz_perfect_score', 'vote_pledge', 'flag_submission', 'flag_verified'].includes(transaction.action) && 
                              `📈 ${transaction.action.replace('_', ' ')}`}
                          </>
                        ) : (
                          `🎁 Redeemed ${rewards.find(r => r.id === transaction.rewardId)?.title || 'Reward'}`
                        )}
                      </p>
                      <p className="text-xs text-secondary-500">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {transaction.type === 'earn' ? (
                        <div className="text-success-600 font-semibold">
                          +{transaction.xpAmount} XP
                          {transaction.metroPointsEarned > 0 && (
                            <div className="text-xs">+{transaction.metroPointsEarned} MP</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-error-600 font-semibold">
                          -{transaction.cost} MP
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Achievements Section */}
        {userProfile && userProfile.badges.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Trophy className="mr-2" size={20} />
              Achievements
            </h2>
            
            <div className="bg-white rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                {userProfile.badges.map((badge, index) => (
                  <span 
                    key={index}
                    className="bg-success-100 text-success-800 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                  >
                    <Star size={12} className="mr-1" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Rewards