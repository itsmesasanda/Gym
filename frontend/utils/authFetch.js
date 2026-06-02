import { getUserToken } from "./session";

/**
 * Drop-in replacement for fetch() that automatically attaches the
 * Authorization: Bearer <token> header when a token is in session.
 */
export const authFetch = (url, options = {}) => {
  const token = getUserToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};
