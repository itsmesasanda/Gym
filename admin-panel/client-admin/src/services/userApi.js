import { PUBLIC_API_URL } from '../config/api';

const API_URL = PUBLIC_API_URL;

const parseResponse = async (res) => {
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Server is not responding correctly. Please ensure backend is running on http://127.0.0.1:5050');
  }
  return res.json();
};

const getHeaders = () => {
  const token = localStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const userApi = {
  login: async (email, phone) => {
    const r = await fetch(`${API_URL}/user-auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, phone }),
    });
    const data = await parseResponse(r);
    if (!r.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  getMe: async () => {
    const r = await fetch(`${API_URL}/user-auth/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await parseResponse(r);
    if (!r.ok) throw new Error(data.error || 'Failed to fetch profile');
    return data;
  },

  getAnnouncements: async () => {
    const r = await fetch(`${API_URL}/user/announcements`, { method: 'GET', headers: getHeaders() });
    const data = await parseResponse(r);
    if (!r.ok) throw new Error(data.error || 'Failed to fetch announcements');
    return data;
  },

  getEvents: async () => {
    const r = await fetch(`${API_URL}/user/events`, { method: 'GET', headers: getHeaders() });
    const data = await parseResponse(r);
    if (!r.ok) throw new Error(data.error || 'Failed to fetch events');
    return data;
  },

  getMeals: async () => {
    const r = await fetch(`${API_URL}/user/meals`, { method: 'GET', headers: getHeaders() });
    const data = await parseResponse(r);
    if (!r.ok) throw new Error(data.error || 'Failed to fetch meals');
    return data;
  },

  getWorkouts: async () => {
    const r = await fetch(`${API_URL}/user/workouts`, { method: 'GET', headers: getHeaders() });
    const data = await parseResponse(r);
    if (!r.ok) throw new Error(data.error || 'Failed to fetch workouts');
    return data;
  },

  getVideos: async () => {
    const r = await fetch(`${API_URL}/user/videos`, { method: 'GET', headers: getHeaders() });
    const data = await parseResponse(r);
    if (!r.ok) throw new Error(data.error || 'Failed to fetch videos');
    return data;
  },

  getMyPayments: async () => {
    const r = await fetch(`${API_URL}/user/payments`, { method: 'GET', headers: getHeaders() });
    const data = await parseResponse(r);
    if (!r.ok) throw new Error(data.error || 'Failed to fetch payments');
    return data;
  },
};
