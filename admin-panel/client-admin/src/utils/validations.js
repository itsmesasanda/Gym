/**
 * Validation utilities for form fields
 */

/**
 * Validate phone number - must be exactly 10 digits
 * @param {string} phone
 * @returns {object} { isValid, error, digitCount }
 */
export const validatePhone = (phone) => {
  const cleaned = String(phone || '').replace(/\D/g, '');
  const digitCount = cleaned.length;
  const isValid = /^\d{10}$/.test(cleaned);
  
  return {
    isValid,
    digitCount,
    error: isValid ? null : `Phone must be exactly 10 digits (${digitCount}/10)`,
  };
};

/**
 * Validate email - must be from allowed domains
 * @param {string} email
 * @returns {object} { isValid, error }
 */
export const validateEmail = (email) => {
  const allowedDomains = ['@gmail.com', '@email.com', '@yahoo.com', '@outlook.com', '@icloud.com'];
  const value = String(email || '').trim();
  const domain = value.substring(value.lastIndexOf('@')).toLowerCase();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && allowedDomains.includes(domain);
  
  return {
    isValid,
    error: isValid ? null : `Email must be from: ${allowedDomains.join(', ')}`,
  };
};

/**
 * Validate date - only today or future dates allowed
 * @param {string} dateStr
 * @returns {object} { isValid, error }
 */
export const validateDate = (dateStr) => {
  if (!dateStr) {
    return { isValid: false, error: 'Date is required' };
  }
  
  const selectedDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  
  const isValid = selectedDate >= today;
  
  return {
    isValid,
    error: isValid ? null : 'Date must be today or in the future',
  };
};

/**
 * Validate that a field is not empty
 * @param {string} value
 * @param {string} fieldName
 * @returns {object} { isValid, error }
 */
export const validateRequired = (value, fieldName = 'This field') => {
  const isValid = value && String(value).trim() !== '';
  
  return {
    isValid,
    error: isValid ? null : `${fieldName} is required`,
  };
};

/**
 * Validate user form - all required fields
 * @param {object} user
 * @returns {object} { isValid, errors }
 */
export const validateUserForm = (user) => {
  const errors = {};
  
  // Check required fields
  const nameCheck = validateRequired(user.name, 'Member Name');
  if (!nameCheck.isValid) errors.name = nameCheck.error;
  
  const emailCheck = validateRequired(user.email, 'Email');
  if (!emailCheck.isValid) errors.email = emailCheck.error;
  else {
    const emailDomainCheck = validateEmail(user.email);
    if (!emailDomainCheck.isValid) errors.email = emailDomainCheck.error;
  }
  
  const phoneCheck = validateRequired(user.phone, 'Phone');
  if (!phoneCheck.isValid) errors.phone = phoneCheck.error;
  else {
    const phoneDigitCheck = validatePhone(user.phone);
    if (!phoneDigitCheck.isValid) errors.phone = phoneDigitCheck.error;
  }
  
  const dateCheck = validateRequired(user.joinDate, 'Join Date');
  if (!dateCheck.isValid) errors.joinDate = dateCheck.error;
  else {
    const dateRangeCheck = validateDate(user.joinDate);
    if (!dateRangeCheck.isValid) errors.joinDate = dateRangeCheck.error;
  }
  
  const planCheck = validateRequired(user.plan, 'Plan');
  if (!planCheck.isValid) errors.plan = planCheck.error;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate announcement form - required fields
 * @param {object} announcement
 * @returns {object} { isValid, errors }
 */
export const validateAnnouncementForm = (announcement) => {
  const errors = {};
  
  const titleCheck = validateRequired(announcement.title, 'Title');
  if (!titleCheck.isValid) errors.title = titleCheck.error;
  
  const dateCheck = validateRequired(announcement.date, 'Date');
  if (!dateCheck.isValid) errors.date = dateCheck.error;
  else {
    const dateRangeCheck = validateDate(announcement.date);
    if (!dateRangeCheck.isValid) errors.date = dateRangeCheck.error;
  }
  
  const priorityCheck = validateRequired(announcement.priority, 'Priority');
  if (!priorityCheck.isValid) errors.priority = priorityCheck.error;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate event form - required fields
 * @param {object} event
 * @returns {object} { isValid, errors }
 */
export const validateEventForm = (event) => {
  const errors = {};
  
  const titleCheck = validateRequired(event.title, 'Title');
  if (!titleCheck.isValid) errors.title = titleCheck.error;
  
  const locationCheck = validateRequired(event.location, 'Location');
  if (!locationCheck.isValid) errors.location = locationCheck.error;
  
  const dateCheck = validateRequired(event.date, 'Date');
  if (!dateCheck.isValid) errors.date = dateCheck.error;
  else {
    const dateRangeCheck = validateDate(event.date);
    if (!dateRangeCheck.isValid) errors.date = dateRangeCheck.error;
  }
  
  const timeCheck = validateRequired(event.time, 'Time');
  if (!timeCheck.isValid) errors.time = timeCheck.error;
  
  const typeCheck = validateRequired(event.type, 'Type');
  if (!typeCheck.isValid) errors.type = typeCheck.error;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
