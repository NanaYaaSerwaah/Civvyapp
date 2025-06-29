import React from 'react'
import { useLocation } from 'react-router-dom'
import Navigation from './Navigation'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const hideNavigation = location.pathname === '/' || location.pathname === '/onboarding'

  return (
    <div className="min-h-screen bg-secondary-50">
      <main className="pb-16">
        {children}
      </main>
      {!hideNavigation && <Navigation />}
    </div>
  )
}

export default Layout