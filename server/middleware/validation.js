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