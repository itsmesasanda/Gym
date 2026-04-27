import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:5050/api/admin';

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  users: {
    getAll: async () => {
      const r = await fetch(`${API_URL}/users`, { headers: await getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch users');
      return r.json();
    },
    create: async (data) => {
      const r = await fetch(`${API_URL}/users`, { method: 'POST', headers: await getHeaders(), body: JSON.stringify(data) });
      if (!r.ok) throw new Error('Failed to create user');
      return r.json();
    },
    update: async (id, data) => {
      const r = await fetch(`${API_URL}/users/${id}`, { method: 'PUT', headers: await getHeaders(), body: JSON.stringify(data) });
      if (!r.ok) throw new Error('Failed to update user');
      return r.json();
    },
    delete: async (id) => {
      const r = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: await getHeaders() });
      if (!r.ok) throw new Error('Failed to delete user');
      return r.json();
    },
  },
  workouts: {
    getAll: async () => {
      const r = await fetch(`${API_URL}/workouts`, { headers: await getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch workouts');
      return r.json();
    },
    create: async (data) => {
      const r = await fetch(`${API_URL}/workouts`, { method: 'POST', headers: await getHeaders(), body: JSON.stringify(data) });
      if (!r.ok) throw new Error('Failed to create workout');
      return r.json();
    },
    update: async (id, data) => {
      const r = await fetch(`${API_URL}/workouts/${id}`, { method: 'PUT', headers: await getHeaders(), body: JSON.stringify(data) });
      if (!r.ok) throw new Error('Failed to update workout');
      return r.json();
    },
    delete: async (id) => {
      const r = await fetch(`${API_URL}/workouts/${id}`, { method: 'DELETE', headers: await getHeaders() });
      if (!r.ok) throw new Error('Failed to delete workout');
      return r.json();
    },
  },
  videos: {
    getAll: async () => {
      const r = await fetch(`${API_URL}/videos`, { headers: await getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch videos');
      return r.json();
    },
    create: async (data) => {
      const r = await fetch(`${API_URL}/videos`, { method: 'POST', headers: await getHeaders(), body: JSON.stringify(data) });
      if (!r.ok) throw new Error('Failed to create video');
      return r.json();
    },
    update: async (id, data) => {
      const r = await fetch(`${API_URL}/videos/${id}`, { method: 'PUT', headers: await getHeaders(), body: JSON.stringify(data) });
      if (!r.ok) throw new Error('Failed to update video');
      return r.json();
    },
    delete: async (id) => {
      const r = await fetch(`${API_URL}/videos/${id}`, { method: 'DELETE', headers: await getHeaders() });
      if (!r.ok) throw new Error('Failed to delete video');
      return r.json();
    },
  },
  meals: {
    getAll: async () => {
      const r = await fetch(`${API_URL}/meals`, { headers: await getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch meals');
      return r.json();
    },
    create: async (data) => {
      const r = await fetch(`${API_URL}/meals`, { method: 'POST', headers: await getHeaders(), body: JSON.stringify(data) });
      if (!r.ok) throw new Error('Failed to create meal');
      return r.json();
    },
    update: async (id, data) => {
      const r = await fetch(`${API_URL}/meals/${id}`, { method: 'PUT', headers: await getHeaders(), body: JSON.stringify(data) });
      if (!r.ok) throw new Error('Failed to update meal');
      return r.json();
    },
    delete: async (id) => {
      const r = await fetch(`${API_URL}/meals/${id}`, { method: 'DELETE', headers: await getHeaders() });
      if (!r.ok) throw new Error('Failed to delete meal');
      return r.json();
    },
  },
  mealLogs: {
    getAll: async () => {
      const r = await fetch(`${API_URL}/meal-logs`, { headers: await getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch meal logs');
      return r.json();
    },
    getSummary: async () => {
      const r = await fetch(`${API_URL}/meal-logs/summary`, { headers: await getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch meal log summary');
      return r.json();
    },
    delete: async (id) => {
      const r = await fetch(`${API_URL}/meal-logs/${id}`, { method: 'DELETE', headers: await getHeaders() });
      if (!r.ok) throw new Error('Failed to delete meal log');
      return r.json();
    },
  },
  reports: {
    getSummary: async () => {
      const r = await fetch(`${API_URL}/reports/summary`, { headers: await getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch summary');
      return r.json();
    },
    getUsersOverTime: async () => {
      const r = await fetch(`${API_URL}/reports/users-over-time`, { headers: await getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch users over time');
      return r.json();
    },
    getMealsCalories: async () => {
      const r = await fetch(`${API_URL}/reports/meals-calories`, { headers: await getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch meal calories');
      return r.json();
    },
  },
};
