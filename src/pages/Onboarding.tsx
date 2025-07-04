import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { apiService, type OnboardingData } from '../services/api'

interface OnboardingState extends OnboardingData {
  // Additional UI state can be added here
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<OnboardingState>({
    issues: [],
    format: '',
    reminders: false,
    cadence: '',
    zipCode: ''
  })

  const issues = [
    'Housing & Rent Control',
    'Public Transportation',
    'Education & Schools',
    'Public Safety',
    'Climate & Environment',
    'Healthcare Access',
    'Economic Development',
    'Immigration'
  ]

  const formats = [
    { id: 'visual', label: 'Visual Stories', description: 'Instagram-style content' },
    { id: 'articles', label: 'Articles', description: 'In-depth written content' },
    { id: 'videos', label: 'Video Content', description: 'Short video explanations' },
    { id: 'mixed', label: 'Mixed Format', description: 'Variety of content types' }
  ]

  const cadences = [
    { id: 'daily', label: 'Daily', description: 'Stay updated every day' },
    { id: 'weekly', label: 'Weekly', description: 'Weekly digest' },
    { id: 'biweekly', label: 'Bi-weekly', description: 'Every two weeks' },
    { id: 'monthly', label: 'Monthly', description: 'Monthly summary' }
  ]

  const handleIssueToggle = (issue: string) => {
    setData(prev => ({
      ...prev,
      issues: prev.issues.includes(issue)
        ? prev.issues.filter(i => i !== issue)
        : [...prev.issues, issue]
    }))
  }

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      await handleComplete()
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiService.submitOnboarding(data)
      
      if (response.success && response.data) {
        // Store onboarding result locally
        localStorage.setItem('civvy_onboarding', JSON.stringify(response.data))
        
        // Navigate to feed
        navigate('/feed')
      } else {
        setError(response.error || 'Failed to complete onboarding')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
    setError(null) // Clear any errors when going back
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return data.issues.length > 0
      case 1: return data.format !== ''
      case 2: return true // reminders is optional
      case 3: return data.cadence !== ''
      case 4: return data.zipCode.length === 5
      default: return false
    }
  }

  const steps = [
    {
      title: "What issues matter most to you?",
      subtitle: "Select all that apply - we'll personalize your feed",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {issues.map(issue => (
            <button
              key={issue}
              onClick={() => handleIssueToggle(issue)}
              className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
                data.issues.includes(issue)
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-secondary-200 hover:border-secondary-300'
              }`}
            >
              <span className="text-sm font-medium">{issue}</span>
            </button>
          ))}
        </div>
      )
    },
    {
      title: "How do you prefer to consume content?",
      subtitle: "Choose your preferred format for maximum engagement",
      content: (
        <div className="space-y-3">
          {formats.map(format => (
            <button
              key={format.id}
              onClick={() => setData(prev => ({ ...prev, format: format.id }))}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
                data.format === format.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-secondary-200 hover:border-secondary-300'
              }`}
            >
              <div className="font-medium">{format.label}</div>
              <div className="text-sm text-secondary-600">{format.description}</div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Would you like election reminders?",
      subtitle: "We'll notify you about upcoming elections and voting deadlines",
      content: (
        <div className="space-y-4">
          <button
            onClick={() => setData(prev => ({ ...prev, reminders: true }))}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
              data.reminders
                ? 'border-primary-500 bg-primary-50'
                : 'border-secondary-200 hover:border-secondary-300'
            }`}
          >
            <div className="font-medium">Yes, keep me informed</div>
            <div className="text-sm text-secondary-600">Get timely election notifications</div>
          </button>
          <button
            onClick={() => setData(prev => ({ ...prev, reminders: false }))}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
              !data.reminders
                ? 'border-primary-500 bg-primary-50'
                : 'border-secondary-200 hover:border-secondary-300'
            }`}
          >
            <div className="font-medium">No thanks</div>
            <div className="text-sm text-secondary-600">I'll check the app regularly</div>
          </button>
        </div>
      )
    },
    {
      title: "How often would you like updates?",
      subtitle: "Choose your preferred cadence for personalized content",
      content: (
        <div className="space-y-3">
          {cadences.map(cadence => (
            <button
              key={cadence.id}
              onClick={() => setData(prev => ({ ...prev, cadence: cadence.id }))}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
                data.cadence === cadence.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-secondary-200 hover:border-secondary-300'
              }`}
            >
              <div className="font-medium">{cadence.label}</div>
              <div className="text-sm text-secondary-600">{cadence.description}</div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: "What's your ZIP code?",
      subtitle: "We'll personalize content for your local elections and issues",
      content: (
        <div className="max-w-xs mx-auto">
          <input
            type="text"
            placeholder="Enter ZIP code"
            value={data.zipCode}
            onChange={(e) => setData(prev => ({ ...prev, zipCode: e.target.value.replace(/\D/g, '').slice(0, 5) }))}
            className="input text-center text-lg"
            maxLength={5}
          />
          <p className="text-xs text-secondary-500 mt-2 text-center">
            Your ZIP code helps us show relevant local candidates and issues
          </p>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-secondary-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-secondary-600 mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-secondary-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-secondary-900 mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-secondary-600">
              {steps[currentStep].subtitle}
            </p>
          </div>
          
          {steps[currentStep].content}
          
          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-error-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0 || loading}
            className="btn-outline px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} className="mr-2" />
            Back
          </button>
          
          <button
            onClick={handleNext}
            disabled={!canProceed() || loading}
            className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && <Loader2 size={20} className="mr-2 animate-spin" />}
            {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
            {currentStep < steps.length - 1 && !loading && <ChevronRight size={20} className="ml-2" />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Onboarding