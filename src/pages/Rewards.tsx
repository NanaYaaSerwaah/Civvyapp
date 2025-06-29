import React from 'react'
import { Gift, Zap, MapPin, Coffee } from 'lucide-react'

const Rewards: React.FC = () => {
  const userPoints = 1250 // Mock user points
  const metroPoints = Math.floor(userPoints / 100) // 100 XP = 1 MetroPoint

  const rewards = [
    {
      id: 1,
      title: 'OMNY Credit',
      description: '$5 MetroCard credit',
      cost: 5,
      icon: MapPin,
      category: 'transit'
    },
    {
      id: 2,
      title: 'Coffee Shop Discount',
      description: '20% off at local cafes',
      cost: 3,
      icon: Coffee,
      category: 'local'
    },
    {
      id: 3,
      title: 'Bonus XP Weekend',
      description: 'Double XP for 48 hours',
      cost: 2,
      icon: Zap,
      category: 'boost'
    }
  ]

  const recentActivity = [
    { action: 'Completed quiz on Housing Policy', points: 50, time: '2 hours ago' },
    { action: 'Flagged contradiction', points: 25, time: '1 day ago' },
    { action: 'Made vote pledge', points: 100, time: '3 days ago' }
  ]

  return (
    <div className="max-w-md mx-auto bg-secondary-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-6">
        <h1 className="text-2xl font-bold mb-4">Rewards</h1>
        
        {/* Points Display */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Your XP</span>
            <span className="text-2xl font-bold">{userPoints.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-90">MetroPoints</span>
            <span className="text-xl font-semibold">{metroPoints}</span>
          </div>
        </div>
      </div>

      {/* Available Rewards */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Available Rewards</h2>
        
        <div className="space-y-3 mb-8">
          {rewards.map(reward => {
            const Icon = reward.icon
            const canAfford = metroPoints >= reward.cost
            
            return (
              <div 
                key={reward.id}
                className={`bg-white rounded-lg p-4 border ${
                  canAfford ? 'border-secondary-200' : 'border-secondary-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      reward.category === 'transit' ? 'bg-primary-100 text-primary-600' :
                      reward.category === 'local' ? 'bg-accent-100 text-accent-600' :
                      'bg-success-100 text-success-600'
                    }`}>
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
                  disabled={!canAfford}
                  className={`w-full mt-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    canAfford 
                      ? 'bg-primary-600 text-white hover:bg-primary-700' 
                      : 'bg-secondary-200 text-secondary-500 cursor-not-allowed'
                  }`}
                >
                  {canAfford ? 'Redeem' : 'Not enough points'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Recent Activity */}
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        
        <div className="bg-white rounded-lg divide-y divide-secondary-100">
          {recentActivity.map((activity, index) => (
            <div key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary-900">{activity.action}</p>
                  <p className="text-xs text-secondary-500">{activity.time}</p>
                </div>
                <div className="text-right">
                  <span className="text-success-600 font-semibold">+{activity.points} XP</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Rewards