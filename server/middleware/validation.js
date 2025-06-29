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