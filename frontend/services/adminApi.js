import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';

const API_URL = `${BASE_URL}/api/admin`;
const VIDEO_API_URL = `${BASE_URL}/api/videos`;

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseJsonSafe = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const requestJson = async (url, options, fallbackMessage) => {
  const response = await fetch(url, options);
  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.error || data?.message || fallbackMessage);
  }

  return data;
};

const normalizeWorkoutPayload = (data) => {
  if (Array.isArray(data?.sets)) return data;

  return {
    exerciseName: data.exerciseName,
    muscleGroup: data.muscleGroup || 'Chest',
    duration: Number(data.duration || 0),
    notes: data.notes || '',
    sets: [{
      reps: Number(data.reps || 0),
      weight: Number(data.weight || 0),
    }],
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
      return requestJson(
        `${API_URL}/workouts`,
        { headers: await getHeaders() },
        'Failed to fetch workouts'
      );
    },
    create: async (data) => {
      return requestJson(
        `${API_URL}/workouts`,
        { method: 'POST', headers: await getHeaders(), body: JSON.stringify(normalizeWorkoutPayload(data)) },
        'Failed to create workout'
      );
    },
    update: async (id, data) => {
      return requestJson(
        `${API_URL}/workouts/${id}`,
        { method: 'PUT', headers: await getHeaders(), body: JSON.stringify(normalizeWorkoutPayload(data)) },
        'Failed to update workout'
      );
    },
    delete: async (id) => {
      return requestJson(
        `${API_URL}/workouts/${id}`,
        { method: 'DELETE', headers: await getHeaders() },
        'Failed to delete workout'
      );
    },
  },
  videos: {
    getAll: async () => {
      return requestJson(
        VIDEO_API_URL,
        { headers: await getHeaders() },
        'Failed to fetch videos'
      );
    },
    create: async (data) => {
      return requestJson(
        VIDEO_API_URL,
        { method: 'POST', headers: await getHeaders(), body: JSON.stringify(data) },
        'Failed to create video'
      );
    },
    update: async (id, data) => {
      return requestJson(
        `${VIDEO_API_URL}/${id}`,
        { method: 'PUT', headers: await getHeaders(), body: JSON.stringify(data) },
        'Failed to update video'
      );
    },
    delete: async (id) => {
      return requestJson(
        `${VIDEO_API_URL}/${id}`,
        { method: 'DELETE', headers: await getHeaders() },
        'Failed to delete video'
      );
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
