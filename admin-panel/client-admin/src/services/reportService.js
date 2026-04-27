const API_URL = 'http://localhost:5001/api';

const authHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const reportService = {
  getSummary: async () => {
    const r = await fetch(`${API_URL}/reports/summary`, { headers: authHeaders() });
    if (!r.ok) throw new Error('Failed to fetch summary');
    return r.json();
  },
  getUsersOverTime: async () => {
    const r = await fetch(`${API_URL}/reports/users-over-time`, { headers: authHeaders() });
    if (!r.ok) throw new Error('Failed to fetch users over time');
    return r.json();
  },
  getMealsCalories: async () => {
    const r = await fetch(`${API_URL}/reports/meals-calories`, { headers: authHeaders() });
    if (!r.ok) throw new Error('Failed to fetch meal calories');
    return r.json();
  },
};
