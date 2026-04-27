import { ADMIN_API_URL } from '../config/api';

const authHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseResponse = async (response, fallbackMessage) => {
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    throw new Error(data.error || data.message || fallbackMessage);
  }

  return data;
};

export const reportService = {
  getSummary: async () => {
    const r = await fetch(`${ADMIN_API_URL}/reports/summary`, { headers: authHeaders() });
    return parseResponse(r, 'Failed to fetch summary');
  },
  getUsersOverTime: async () => {
    const r = await fetch(`${ADMIN_API_URL}/reports/users-over-time`, { headers: authHeaders() });
    return parseResponse(r, 'Failed to fetch users over time');
  },
  getMealsCalories: async () => {
    const r = await fetch(`${ADMIN_API_URL}/reports/meals-calories`, { headers: authHeaders() });
    return parseResponse(r, 'Failed to fetch meal calories');
  },
};
