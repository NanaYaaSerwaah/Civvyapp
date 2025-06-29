import React from 'react'
import { Link } from 'react-router-dom'
import { Vote, Shield, Award, Users } from 'lucide-react'

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center text-white mb-12 pt-8">
          <div className="mb-6">
            <Vote size={64} className="mx-auto mb-4 text-white" />
            <h1 className="text-4xl font-bold mb-2">Civvy</h1>
            <p className="text-xl opacity-90">Empowering NYC Voters</p>
          </div>
          <p className="text-lg opacity-80 max-w-2xl mx-auto leading-relaxed">
            Make informed, bias-safe voting decisions through AI-driven fact-checking 
            and earn rewards for civic engagement.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <Shield className="w-8 h-8 mb-4 text-accent-300" />
            <h3 className="text-lg font-semibold mb-2">Bias-Safe Feed</h3>
            <p className="text-sm opacity-80">
              AI-powered fact-checking ensures you get balanced, trustworthy information.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <Award className="w-8 h-8 mb-4 text-success-300" />
            <h3 className="text-lg font-semibold mb-2">MetroPoints Rewards</h3>
            <p className="text-sm opacity-80">
              Earn points for civic engagement and redeem for OMNY credits and local perks.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white md:col-span-2 lg:col-span-1">
            <Users className="w-8 h-8 mb-4 text-warning-300" />
            <h3 className="text-lg font-semibold mb-2">Community Driven</h3>
            <p className="text-sm opacity-80">
              Connect with fellow New Yorkers and participate in live town halls.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Link
            to="/onboarding"
            className="inline-flex items-center px-8 py-4 bg-white text-primary-700 font-semibold rounded-xl hover:bg-secondary-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-transform"
          >
            Get Started
          </Link>
          <p className="text-white/70 text-sm mt-4">
            Join thousands of engaged NYC voters
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home