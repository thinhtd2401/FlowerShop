/**
 * api/index.js - Centralized API client using axios
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Orders API
export const ordersApi = {
  getAll: () => api.get('/orders').then(r => r.data),
  getById: (id) => api.get(`/orders/${id}`).then(r => r.data),
  create: (data) => api.post('/orders', data).then(r => r.data),
  update: (id, data) => api.put(`/orders/${id}`, data).then(r => r.data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }).then(r => r.data),
  updateImages: (id, images) => api.patch(`/orders/${id}/images`, { images }).then(r => r.data),
  delete: (id) => api.delete(`/orders/${id}`).then(r => r.data),
};

// Upload API
export const uploadApi = {
  uploadImages: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data),
};

// Expenses API
export const expensesApi = {
  getAll: () => api.get('/expenses').then(r => r.data),
  getById: (id) => api.get(`/expenses/${id}`).then(r => r.data),
  create: (data) => api.post('/expenses', data).then(r => r.data),
  update: (id, data) => api.put(`/expenses/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/expenses/${id}`).then(r => r.data),
};

// Metrics API
export const metricsApi = {
  get: () => api.get('/metrics').then(r => r.data),
};

export default api;
