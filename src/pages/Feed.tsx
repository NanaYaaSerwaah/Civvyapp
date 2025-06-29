import React from 'react'
import { Flag, Share2, MessageCircle, Heart } from 'lucide-react'

const Feed: React.FC = () => {
  // Mock data for demonstration
  const feedItems = [
    {
      id: 1,
      type: 'story',
      title: 'NYC Housing Crisis: What Candidates Are Saying',
      content: 'Recent statements from mayoral candidates reveal conflicting positions on rent control policies...',
      source: 'NYC.gov',
      timestamp: '2 hours ago',
      contradictions: 2,
      confidence: 0.85
    },
    {
      id: 2,
      type: 'video',
      title: 'Transportation Budget Debate',
      content: 'Live coverage from City Hall as council members discuss MTA funding...',
      source: 'NY1',
      timestamp: '4 hours ago',
      contradictions: 1,
      confidence: 0.72
    }
  ]

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-secondary-200 px-4 py-3 z-10">
        <h1 className="text-xl font-bold text-center">Your Feed</h1>
      </div>

      {/* Feed Items */}
      <div className="space-y-4 p-4">
        {feedItems.map(item => (
          <div key={item.id} className="bg-white border border-secondary-200 rounded-lg overflow-hidden shadow-sm">
            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-secondary-900 flex-1">{item.title}</h3>
                {item.contradictions > 0 && (
                  <div className="bg-warning-100 text-warning-800 px-2 py-1 rounded-full text-xs font-medium ml-2">
                    {item.contradictions} contradiction{item.contradictions > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              
              <p className="text-secondary-700 text-sm mb-3">{item.content}</p>
              
              <div className="flex items-center justify-between text-xs text-secondary-500 mb-3">
                <span>{item.source}</span>
                <span>{item.timestamp}</span>
              </div>

              {/* AI Confidence Indicator */}
              {item.confidence && (
                <div className="bg-secondary-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-secondary-700">AI Fact-Check Confidence</span>
                    <span className="text-xs text-secondary-600">{Math.round(item.confidence * 100)}%</span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-1.5">
                    <div 
                      className="bg-primary-600 h-1.5 rounded-full"
                      style={{ width: `${item.confidence * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-secondary-100 px-4 py-3">
              <div className="flex items-center justify-around">
                <button className="flex items-center space-x-2 text-secondary-600 hover:text-error-600 transition-colors">
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
        ))}
      </div>

      {/* Coming Soon Message */}
      <div className="text-center py-8 px-4">
        <div className="bg-primary-50 rounded-lg p-6">
          <h3 className="font-semibold text-primary-900 mb-2">More Content Coming Soon!</h3>
          <p className="text-primary-700 text-sm">
            We're working on bringing you personalized, fact-checked content based on your preferences.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Feed