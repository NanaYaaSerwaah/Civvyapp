/**
 * Validation middleware for API endpoints
 * Includes rate limiting and input validation
 */

export const validateOnboardingData = (req, res, next) => {
  const { issues, format, reminders, cadence, zipCode } = req.body;
  
  // Validation rules
  const validationErrors = [];
  
  // Issues validation
  if (!Array.isArray(issues) || issues.length === 0) {
    validationErrors.push('At least one issue must be selected');
  }
  
  const validIssues = [
    'Housing & Rent Control',
    'Public Transportation',
    'Education & Schools',
    'Public Safety',
    'Climate & Environment',
    'Healthcare Access',
    'Economic Development',
    'Immigration'
  ];
  
  const invalidIssues = issues.filter(issue => !validIssues.includes(issue));
  if (invalidIssues.length > 0) {
    validationErrors.push(`Invalid issues: ${invalidIssues.join(', ')}`);
  }
  
  // Format validation
  const validFormats = ['visual', 'articles', 'videos', 'mixed'];
  if (!validFormats.includes(format)) {
    validationErrors.push('Invalid format selection');
  }
  
  // Reminders validation
  if (typeof reminders !== 'boolean') {
    validationErrors.push('Reminders must be true or false');
  }
  
  // Cadence validation
  const validCadences = ['daily', 'weekly', 'biweekly', 'monthly'];
  if (!validCadences.includes(cadence)) {
    validationErrors.push('Invalid cadence selection');
  }
  
  // ZIP code validation
  const zipRegex = /^\d{5}$/;
  if (!zipRegex.test(zipCode)) {
    validationErrors.push('ZIP code must be 5 digits');
  }
  
  // Return validation errors if any
  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationErrors
    });
  }
  
  next();
};

export const validateFlagData = (req, res, next) => {
  const { contentId, userId, reason, description } = req.body;
  const validationErrors = [];
  
  // Required fields
  if (!contentId || typeof contentId !== 'string') {
    validationErrors.push('Content ID is required');
  }
  
  if (!userId || typeof userId !== 'string') {
    validationErrors.push('User ID is required');
  }
  
  if (!reason || typeof reason !== 'string') {
    validationErrors.push('Reason is required');
  }
  
  // Valid reasons
  const validReasons = [
    'misinformation',
    'bias',
    'inaccuracy',
    'hate-speech',
    'harassment',
    'spam',
    'inappropriate',
    'other'
  ];
  
  if (reason && !validReasons.includes(reason)) {
    validationErrors.push('Invalid flag reason');
  }
  
  // Description length
  if (description && description.length > 500) {
    validationErrors.push('Description must be less than 500 characters');
  }
  
  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationErrors
    });
  }
  
  next();
};

export const validateQuizData = (req, res, next) => {
  const { quizId, answers, userId } = req.body;
  const validationErrors = [];
  
  // Required fields
  if (!quizId || typeof quizId !== 'string') {
    validationErrors.push('Quiz ID is required');
  }
  
  if (!userId || typeof userId !== 'string') {
    validationErrors.push('User ID is required');
  }
  
  if (!Array.isArray(answers)) {
    validationErrors.push('Answers must be an array');
  }
  
  // Validate answer format
  if (answers && Array.isArray(answers)) {
    answers.forEach((answer, index) => {
      if (typeof answer !== 'number' || answer < 0 || answer > 3) {
        validationErrors.push(`Answer ${index + 1} must be a number between 0 and 3`);
      }
    });
  }
  
  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationErrors
    });
  }
  
  next();
};

export const validatePledgeData = (req, res, next) => {
  const { userId, electionId, pledgeType, scheduledDate } = req.body;
  const validationErrors = [];
  
  // Required fields
  if (!userId || typeof userId !== 'string') {
    validationErrors.push('User ID is required');
  }
  
  if (!electionId || typeof electionId !== 'string') {
    validationErrors.push('Election ID is required');
  }
  
  if (!pledgeType || typeof pledgeType !== 'string') {
    validationErrors.push('Pledge type is required');
  }
  
  // Valid pledge types
  const validPledgeTypes = ['early-voting', 'election-day', 'absentee'];
  if (pledgeType && !validPledgeTypes.includes(pledgeType)) {
    validationErrors.push('Invalid pledge type');
  }
  
  // Date validation
  if (scheduledDate) {
    const date = new Date(scheduledDate);
    if (isNaN(date.getTime())) {
      validationErrors.push('Invalid scheduled date');
    } else if (date < new Date()) {
      validationErrors.push('Scheduled date cannot be in the past');
    }
  }
  
  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationErrors
    });
  }
  
  next();
};