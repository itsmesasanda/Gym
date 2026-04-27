const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export const API_ORIGIN = trimTrailingSlash(
  process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050'
);

export const PUBLIC_API_URL = `${API_ORIGIN}/api`;
export const ADMIN_API_URL = `${API_ORIGIN}/api/admin`;

