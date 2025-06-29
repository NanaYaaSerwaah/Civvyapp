import React from 'react'
import { User, Settings, Bell, Shield, LogOut } from 'lucide-react'

const Profile: React.FC = () => {
  // Mock user data
  const user = {
    name: 'Alex Rivera',
    email: 'alex.rivera@email.com',
    joinDate: 'January 2025',
    totalXP: 1250,
    level: 3,
    badges: ['First Vote', 'Fact Checker', 'Community Helper']
  }

  const menuItems = [
    { icon: Bell, label: 'Notifications', action: () => {} },
    { icon: Shield, label: 'Privacy Settings', action: () => {} },
    { icon: Settings, label: 'App Settings', action: () => {} },
    { icon: LogOut, label: 'Sign Out', action: () => {}, danger: true }
  ]

  return (
    <div className="max-w-md mx-auto bg-secondary-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200 px-4 py-3">
        <h1 className="text-xl font-bold text-center">Profile</h1>
      </div>

      {/* User Info */}
      <div className="bg-white p-6 mb-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User size={32} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-secondary-600">{user.email}</p>
            <p className="text-sm text-secondary-500">Member since {user.joinDate}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary-600">{user.totalXP}</div>
            <div className="text-sm text-primary-700">Total XP</div>
          </div>
          <div className="bg-accent-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-accent-600">{user.level}</div>
            <div className="text-sm text-accent-700">Level</div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white p-6 mb-4">
        <h3 className="font-semibold mb-3">Badges Earned</h3>
        <div className="flex flex-wrap gap-2">
          {user.badges.map(badge => (
            <span 
              key={badge}
              className="bg-success-100 text-success-800 px-3 py-1 rounded-full text-sm font-medium"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white divide-y divide-secondary-100">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={index}
              onClick={item.action}
              className={`w-full flex items-center space-x-3 p-4 hover:bg-secondary-50 transition-colors ${
                item.danger ? 'text-error-600' : 'text-secondary-900'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* App Info */}
      <div className="p-4 text-center text-secondary-500 text-sm">
        <p>Civvy v1.0.0</p>
        <p>Empowering NYC Voters</p>
      </div>
    </div>
  )
}

export default Profile