/**
 * QuizService - Manages civic knowledge quizzes
 * Generates questions based on user interests and local issues
 */
export class QuizService {
  constructor() {
    // Quiz question database organized by topic
    this.questionBank = {
      'housing': [
        {
          id: 'housing_1',
          question: 'What is the current goal for affordable housing units in NYC by 2030?',
          options: ['150,000 units', '200,000 units', '250,000 units', '300,000 units'],
          correct: 2,
          explanation: 'NYC Housing Plan aims to create 250,000 affordable units by 2030.',
          difficulty: 'medium',
          source: 'NYC Housing Authority'
        },
        {
          id: 'housing_2',
          question: 'What percentage of income should rent ideally not exceed?',
          options: ['25%', '30%', '35%', '40%'],
          correct: 1,
          explanation: 'Housing experts recommend spending no more than 30% of income on rent.',
          difficulty: 'easy',
          source: 'Housing Guidelines'
        }
      ],
      'transportation': [
        {
          id: 'transport_1',
          question: 'What is the current base fare for NYC subway and bus?',
          options: ['$2.75', '$2.90', '$3.00', '$3.25'],
          correct: 1,
          explanation: 'As of 2024, the base fare for subway and bus is $2.90.',
          difficulty: 'easy',
          source: 'MTA'
        },
        {
          id: 'transport_2',
          question: 'Which borough has the highest subway ridership?',
          options: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx'],
          correct: 0,
          explanation: 'Manhattan has the highest subway ridership due to its density and business district.',
          difficulty: 'medium',
          source: 'MTA Statistics'
        }
      ],
      'education': [
        {
          id: 'education_1',
          question: 'How many students are enrolled in NYC public schools?',
          options: ['800,000', '1 million', '1.1 million', '1.3 million'],
          correct: 2,
          explanation: 'NYC public schools serve approximately 1.1 million students.',
          difficulty: 'medium',
          source: 'NYC Department of Education'
        }
      ],
      'safety': [
        {
          id: 'safety_1',
          question: 'What is the non-emergency number for NYPD?',
          options: ['211', '311', '411', '511'],
          correct: 1,
          explanation: '311 is NYC\'s non-emergency number for city services including police.',
          difficulty: 'easy',
          source: 'NYPD'
        }
      ],
      'environment': [
        {
          id: 'environment_1',
          question: 'What is NYC\'s goal for carbon neutrality?',
          options: ['2030', '2040', '2050', '2060'],
          correct: 2,
          explanation: 'NYC aims to achieve carbon neutrality by 2050.',
          difficulty: 'medium',
          source: 'NYC Climate Plan'
        }
      ]
    };

    // Active quiz sessions
    this.activeSessions = new Map();
  }

  /**
   * Generate personalized quiz based on user preferences
   */
  async generateQuiz(userId, preferences = {}) {
    try {
      const { issues = [], difficulty = 'mixed', questionCount = 5 } = preferences;
      
      // Map user issues to question topics
      const relevantTopics = this.mapIssuesToTopics(issues);
      
      // Select questions from relevant topics
      const selectedQuestions = this.selectQuestions(relevantTopics, questionCount, difficulty);
      
      if (selectedQuestions.length === 0) {
        return {
          success: false,
          error: 'No questions available for selected topics'
        };
      }

      // Create quiz session
      const quizSession = {
        id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        questions: selectedQuestions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          difficulty: q.difficulty
          // Don't include correct answer or explanation in session
        })),
        correctAnswers: selectedQuestions.map(q => q.correct),
        explanations: selectedQuestions.map(q => ({
          explanation: q.explanation,
          source: q.source
        })),
        startTime: new Date().toISOString(),
        status: 'active',
        preferences
      };

      // Store session
      this.activeSessions.set(quizSession.id, quizSession);

      return {
        success: true,
        data: {
          quizId: quizSession.id,
          questions: quizSession.questions,
          totalQuestions: quizSession.questions.length,
          estimatedTime: quizSession.questions.length * 30 // 30 seconds per question
        }
      };

    } catch (error) {
      console.error('Quiz generation error:', error);
      return {
        success: false,
        error: 'Failed to generate quiz'
      };
    }
  }

  /**
   * Submit quiz answers and calculate score
   */
  async submitQuiz(quizId, userAnswers) {
    try {
      const session = this.activeSessions.get(quizId);
      
      if (!session) {
        return {
          success: false,
          error: 'Quiz session not found or expired'
        };
      }

      if (session.status !== 'active') {
        return {
          success: false,
          error: 'Quiz session already completed'
        };
      }

      // Calculate score
      let correctCount = 0;
      const results = [];

      for (let i = 0; i < session.correctAnswers.length; i++) {
        const isCorrect = userAnswers[i] === session.correctAnswers[i];
        if (isCorrect) correctCount++;

        results.push({
          questionId: session.questions[i].id,
          question: session.questions[i].question,
          userAnswer: userAnswers[i],
          correctAnswer: session.correctAnswers[i],
          isCorrect,
          explanation: session.explanations[i].explanation,
          source: session.explanations[i].source
        });
      }

      const score = Math.round((correctCount / session.correctAnswers.length) * 100);
      const timeSpent = Date.now() - new Date(session.startTime).getTime();

      // Update session
      session.status = 'completed';
      session.endTime = new Date().toISOString();
      session.userAnswers = userAnswers;
      session.score = score;
      session.timeSpent = timeSpent;

      // Store completed session
      this.activeSessions.set(quizId, session);

      return {
        success: true,
        data: {
          quizId,
          score,
          correctAnswers: correctCount,
          totalQuestions: session.questions.length,
          timeSpent,
          results,
          isPerfectScore: score === 100
        }
      };

    } catch (error) {
      console.error('Quiz submission error:', error);
      return {
        success: false,
        error: 'Failed to submit quiz'
      };
    }
  }

  /**
   * Get quiz leaderboard
   */
  getLeaderboard(limit = 10) {
    const completedQuizzes = Array.from(this.activeSessions.values())
      .filter(session => session.status === 'completed')
      .sort((a, b) => b.score - a.score || (a.timeSpent - b.timeSpent))
      .slice(0, limit);

    return {
      success: true,
      data: completedQuizzes.map(session => ({
        userId: session.userId,
        score: session.score,
        timeSpent: session.timeSpent,
        questionsCount: session.questions.length,
        completedAt: session.endTime
      }))
    };
  }

  /**
   * Helper methods
   */
  mapIssuesToTopics(issues) {
    const topicMap = {
      'Housing & Rent Control': ['housing'],
      'Public Transportation': ['transportation'],
      'Education & Schools': ['education'],
      'Public Safety': ['safety'],
      'Climate & Environment': ['environment'],
      'Healthcare Access': ['healthcare'],
      'Economic Development': ['economy'],
      'Immigration': ['immigration']
    };

    const topics = new Set();
    issues.forEach(issue => {
      const mappedTopics = topicMap[issue] || [];
      mappedTopics.forEach(topic => topics.add(topic));
    });

    return Array.from(topics);
  }

  selectQuestions(topics, count, difficulty) {
    let availableQuestions = [];

    // Collect questions from relevant topics
    topics.forEach(topic => {
      if (this.questionBank[topic]) {
        availableQuestions.push(...this.questionBank[topic]);
      }
    });

    // If no specific topics, use all questions
    if (availableQuestions.length === 0) {
      availableQuestions = Object.values(this.questionBank).flat();
    }

    // Filter by difficulty if specified
    if (difficulty !== 'mixed') {
      availableQuestions = availableQuestions.filter(q => q.difficulty === difficulty);
    }

    // Shuffle and select questions
    const shuffled = availableQuestions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }
}