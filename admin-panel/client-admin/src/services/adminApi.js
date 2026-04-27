import { ADMIN_API_URL } from '../config/api';

const API_URL = ADMIN_API_URL;

const getHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const clearStaleAdminSession = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
};

/**
 * Helper function to safely parse JSON responses
 * Provides better error messages if server is not running
 */
const parseResponse = async (res, endpoint) => {
  const contentType = res.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(
      'Server is not responding correctly. Please ensure backend is running on http://127.0.0.1:5050'
    );
  }
  
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      clearStaleAdminSession();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    throw new Error(data.error || data.message || `Request failed for ${endpoint}`);
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
      const r = await fetch(`${API_URL}/users`, { headers: getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch users');
      return parseResponse(r, '/users');
    },
    create: async (data) => {
      const r = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('Failed to create user');
      return parseResponse(r, '/users');
    },
    update: async (id, data) => {
      const r = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('Failed to update user');
      return parseResponse(r, `/users/${id}`);
    },
    delete: async (id) => {
      const r = await fetch(`${API_URL}/users/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!r.ok) throw new Error('Failed to delete user');
      return parseResponse(r, `/users/${id}`);
    },
  },
  workouts: {
    getAll: async () => {
      const r = await fetch(`${API_URL}/workouts`, { headers: getHeaders() });
      return parseResponse(r, '/workouts');
    },
    create: async (data) => {
      const r = await fetch(`${API_URL}/workouts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(normalizeWorkoutPayload(data)),
      });
      return parseResponse(r, '/workouts');
    },
    update: async (id, data) => {
      const r = await fetch(`${API_URL}/workouts/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(normalizeWorkoutPayload(data)),
      });
      return parseResponse(r, `/workouts/${id}`);
    },
    delete: async (id) => {
      const r = await fetch(`${API_URL}/workouts/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
      return parseResponse(r, `/workouts/${id}`);
    },
  },
  announcements: {
    getAll: async () => {
      const r = await fetch(`${API_URL}/announcements`, { headers: getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch announcements');
      return parseResponse(r, '/announcements');
    },
    create: async (data) => {
      const r = await fetch(`${API_URL}/announcements`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('Failed to create announcement');
      return parseResponse(r, '/announcements');
    },
    update: async (id, data) => {
      const r = await fetch(`${API_URL}/announcements/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('Failed to update announcement');
      return parseResponse(r, `/announcements/${id}`);
    },
    delete: async (id) => {
      const r = await fetch(`${API_URL}/announcements/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!r.ok) throw new Error('Failed to delete announcement');
      return parseResponse(r, `/announcements/${id}`);
    },
  },
  events: {
    getAll: async () => {
      const r = await fetch(`${API_URL}/events`, { headers: getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch events');
      return parseResponse(r, '/events');
    },
    create: async (data) => {
      const r = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('Failed to create event');
      return parseResponse(r, '/events');
    },
    update: async (id, data) => {
      const r = await fetch(`${API_URL}/events/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('Failed to update event');
      return parseResponse(r, `/events/${id}`);
    },
    delete: async (id) => {
      const r = await fetch(`${API_URL}/events/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!r.ok) throw new Error('Failed to delete event');
      return parseResponse(r, `/events/${id}`);
    },
  },
  meals: {
    getAll: async () => {
      const r = await fetch(`${API_URL}/meals`, { headers: getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch meals');
      return parseResponse(r, '/meals');
    },
    create: async (data) => {
      const r = await fetch(`${API_URL}/meals`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('Failed to create meal');
      return parseResponse(r, '/meals');
    },
    update: async (id, data) => {
      const r = await fetch(`${API_URL}/meals/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('Failed to update meal');
      return parseResponse(r, `/meals/${id}`);
    },
    delete: async (id) => {
      const r = await fetch(`${API_URL}/meals/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!r.ok) throw new Error('Failed to delete meal');
      return parseResponse(r, `/meals/${id}`);
    },
  },
  videos: {
    getAll: async () => {
      const r = await fetch(`${API_URL}/videos`, { headers: getHeaders() });
      const data = await parseResponse(r, '/videos');
      return Array.isArray(data.videos) ? data.videos : data;
    },
    create: async (data) => {
      const r = await fetch(`${API_URL}/videos`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return parseResponse(r, '/videos');
    },
    update: async (id, data) => {
      const r = await fetch(`${API_URL}/videos/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return parseResponse(r, `/videos/${id}`);
    },
    delete: async (id) => {
      const r = await fetch(`${API_URL}/videos/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
      return parseResponse(r, `/videos/${id}`);
    },
  },
  payments: {
    getAll: async () => {
      const r = await fetch(`${API_URL}/payments`, { headers: getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch payments');
      return parseResponse(r, '/payments');
    },
    getByUserId: async (userId, userEmail = '') => {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      if (userEmail) params.set('userEmail', userEmail);

      const r = await fetch(`${API_URL}/payments${params.toString() ? `?${params.toString()}` : ''}`, { headers: getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch user payment history');
      return parseResponse(r, `/payments${params.toString() ? `?${params.toString()}` : ''}`);
    },
    create: async (data) => {
      const r = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('Failed to create payment');
      return parseResponse(r, '/payments');
    },
    update: async (id, data) => {
      const r = await fetch(`${API_URL}/payments/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('Failed to update payment');
      return parseResponse(r, `/payments/${id}`);
    },
    updateStatus: async (id, status) => {
      const r = await fetch(`${API_URL}/payments/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error('Failed to update payment status');
      return parseResponse(r, `/payments/${id}`);
    },
    delete: async (id) => {
      const r = await fetch(`${API_URL}/payments/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!r.ok) throw new Error('Failed to delete payment');
      return parseResponse(r, `/payments/${id}`);
    },
  },
  // Generic fetch method for custom endpoints
  get: async (endpoint) => {
    const r = await fetch(`${API_URL}${endpoint}`, { headers: getHeaders() });
    if (!r.ok) throw new Error(`Failed to fetch ${endpoint}`);
    return parseResponse(r, endpoint);
  },
  patch: async (endpoint, data) => {
    const r = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(`Failed to patch ${endpoint}`);
    return parseResponse(r, endpoint);
  }
};
