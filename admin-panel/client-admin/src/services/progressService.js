import { PUBLIC_API_URL } from '../config/api';

const API_URL = PUBLIC_API_URL;

const getHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const progressService = {
  // Goals
  getGoals: async () => {
    const r = await fetch(`${API_URL}/progress/goals`, { headers: getHeaders() });
    if (!r.ok) throw new Error('Failed to fetch goals');
    return r.json();
  },
  createGoal: async (data) => {
    const r = await fetch(`${API_URL}/progress/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error('Failed to create goal');
    return r.json();
  },
  updateGoal: async (id, data) => {
    const r = await fetch(`${API_URL}/progress/goals/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error('Failed to update goal');
    return r.json();
  },
  deleteGoal: async (id) => {
    const r = await fetch(`${API_URL}/progress/goals/${id}`, { 
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!r.ok) throw new Error('Failed to delete goal');
    return r.json();
  },

  // Measurements
  getMeasurements: async () => {
    const r = await fetch(`${API_URL}/progress/measurements`, { headers: getHeaders() });
    if (!r.ok) throw new Error('Failed to fetch measurements');
    return r.json();
  },
  createMeasurement: async (data) => {
    const r = await fetch(`${API_URL}/progress/measurements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error('Failed to create measurement');
    return r.json();
  },
  updateMeasurement: async (id, data) => {
    const r = await fetch(`${API_URL}/progress/measurements/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error('Failed to update measurement');
    return r.json();
  },
  deleteMeasurement: async (id) => {
    const r = await fetch(`${API_URL}/progress/measurements/${id}`, { 
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!r.ok) throw new Error('Failed to delete measurement');
    return r.json();
  },
};
