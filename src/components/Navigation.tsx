import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Zap, Gift, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const Navigation: React.FC = () => {
  const location = useLocation()

  const navItems = [
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/rewards', icon: Gift, label: 'Rewards' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              "flex flex-col items-center py-2 px-3 rounded-lg transition-colors",
              location.pathname === path
                ? "text-primary-600 bg-primary-50"
                : "text-secondary-500 hover:text-secondary-700"
            )}
          >
            <Icon size={20} />
            <span className="text-xs mt-1 font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

export default Navigation