import React, { useState, useEffect } from 'react'
import { X, Clock, Trophy, Zap } from 'lucide-react'
import { apiService, type Quiz, type QuizQuestion } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: (result: any) => void
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, onComplete }) => {
  const { user } = useAuth()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [startTime, setStartTime] = useState<number>(0)

  useEffect(() => {
    if (isOpen && user) {
      generateQuiz()
    }
  }, [isOpen, user])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (quiz && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [quiz, timeLeft])

  const generateQuiz = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Get user preferences from localStorage
      const onboardingData = localStorage.getItem('civvy_onboarding')
      const preferences = onboardingData ? JSON.parse(onboardingData).preferences : {}

      const response = await apiService.generateQuiz(user.id, {
        issues: preferences.issues || [],
        difficulty: 'mixed',
        questionCount: 5
      })

      if (response.success && response.data) {
        setQuiz(response.data)
        setAnswers(new Array(response.data.questions.length).fill(-1))
        setTimeLeft(response.data.estimatedTime)
        setStartTime(Date.now())
        setCurrentQuestion(0)
        setResult(null)
      } else {
        alert('Failed to generate quiz. Please try again.')
        onClose()
      }
    } catch (err) {
      alert('Network error. Please try again.')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answerIndex
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      submitQuiz()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const submitQuiz = async () => {
    if (!user || !quiz) return

    try {
      setSubmitting(true)
      
      const response = await apiService.submitQuiz(quiz.quizId, answers, user.id)

      if (response.success && response.data) {
        setResult(response.data)
        if (onComplete) {
          onComplete(response.data)
        }
      } else {
        alert('Failed to submit quiz. Please try again.')
      }
    } catch (err) {
      alert('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-600'
    if (score >= 60) return 'text-warning-600'
    return 'text-error-600'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Civic Knowledge Quiz</h3>
            {quiz && !result && (
              <div className="flex items-center space-x-4 text-sm opacity-90">
                <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
                <div className="flex items-center">
                  <Clock size={14} className="mr-1" />
                  {formatTime(timeLeft)}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-secondary-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-secondary-600">Generating your personalized quiz...</p>
            </div>
          )}

          {quiz && !result && (
            <>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-secondary-900 mb-4">
                  {quiz.questions[currentQuestion].question}
                </h4>

                <div className="space-y-3">
                  {quiz.questions[currentQuestion].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                        answers[currentQuestion] === index
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50'
                      }`}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="btn-outline px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <button
                  onClick={handleNext}
                  disabled={answers[currentQuestion] === -1 || submitting}
                  className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                  {currentQuestion === quiz.questions.length - 1 ? 'Submit Quiz' : 'Next'}
                </button>
              </div>
            </>
          )}

          {result && (
            <div className="text-center">
              {/* Score Display */}
              <div className="mb-6">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(result.score)}`}>
                  {result.score}%
                </div>
                <p className="text-secondary-600">
                  {result.correctAnswers} out of {result.totalQuestions} correct
                </p>
                
                {result.isPerfectScore && (
                  <div className="bg-success-50 border border-success-200 rounded-lg p-3 mt-4">
                    <div className="flex items-center justify-center text-success-700">
                      <Trophy size={20} className="mr-2" />
                      Perfect Score! Bonus XP Awarded!
                    </div>
                  </div>
                )}
              </div>

              {/* Rewards Earned */}
              {result.rewards && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-primary-900 mb-2 flex items-center justify-center">
                    <Zap size={16} className="mr-2" />
                    Rewards Earned
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base XP:</span>
                      <span className="font-medium">+{result.rewards.baseReward?.xpEarned || 0} XP</span>
                    </div>
                    {result.rewards.bonusReward && (
                      <div className="flex justify-between">
                        <span>Perfect Score Bonus:</span>
                        <span className="font-medium">+{result.rewards.bonusReward.xpEarned} XP</span>
                      </div>
                    )}
                    {result.rewards.baseReward?.metroPointsEarned > 0 && (
                      <div className="flex justify-between border-t border-primary-200 pt-2">
                        <span>MetroPoints Earned:</span>
                        <span className="font-bold text-primary-600">
                          +{result.rewards.baseReward.metroPointsEarned} MP
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Results Summary */}
              <div className="text-left space-y-3 mb-6">
                {result.results.slice(0, 3).map((item: any, index: number) => (
                  <div key={index} className="border border-secondary-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium">Q{index + 1}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.isCorrect ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800'
                      }`}>
                        {item.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    <p className="text-xs text-secondary-600 mb-2">{item.question}</p>
                    {!item.isCorrect && (
                      <p className="text-xs text-secondary-500">
                        <strong>Correct:</strong> {item.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="btn-primary px-6 py-2 w-full"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuizModal