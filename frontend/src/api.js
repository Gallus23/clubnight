import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || '/api';
const api = axios.create({ baseURL: BASE });

export const playersApi = {
  list: () => api.get('/players').then(r => r.data),
  create: (data) => api.post('/players', data).then(r => r.data),
  update: (id, data) => api.put(`/players/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/players/${id}`).then(r => r.data),
};

export const courtsApi = {
  list: () => api.get('/courts').then(r => r.data),
};

export const bookingsApi = {
  list: () => api.get('/bookings').then(r => r.data),
  create: (data) => api.post('/bookings', data).then(r => r.data),
  delete: (id) => api.delete(`/bookings/${id}`).then(r => r.data),
};

export const sessionsApi = {
  list: () => api.get('/sessions').then(r => r.data),
  create: (data) => api.post('/sessions', data).then(r => r.data),
  enroll: (id, playerId) => api.post(`/sessions/${id}/enroll`, { playerId }).then(r => r.data),
  result: (id, winnerId, loserId) => api.post(`/sessions/${id}/result`, { winnerId, loserId }).then(r => r.data),
  delete: (id) => api.delete(`/sessions/${id}`).then(r => r.data),
};

export const leaderboardApi = {
  get: () => api.get('/leaderboard').then(r => r.data),
};

export const statsApi = {
  get: () => api.get('/stats').then(r => r.data),
};
