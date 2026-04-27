/**
 * Format an ISO date string to a readable date.
 * @param {string} dateStr
 * @returns {string}
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

/**
 * Format a number as Sri Lankan Rupees.
 * @param {number|string} amount
 * @returns {string}
 */
export const formatCurrencyLKR = (amount) => {
  const value = Number(amount || 0);
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Truncate a string to `maxLen` characters.
 */
export const truncate = (str, maxLen = 50) => {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
};

/**
 * Return initials from a full name.
 */
export const getInitials = (name = '') =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

/**
 * Simple field-present validator. Returns an error message or null.
 */
export const required = (value, label = 'This field') =>
  value && String(value).trim() !== '' ? null : `${label} is required.`;

/**
 * Deep-clone a plain JS object.
 */
export const clone = (obj) => JSON.parse(JSON.stringify(obj));
