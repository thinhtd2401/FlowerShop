/**
 * api/index.js - Centralized API client using axios with JWT interceptor
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('flowershop_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/login') && !error.config.url?.includes('/auth/google')) {
      // Clear token if expired
      localStorage.removeItem('flowershop_token');
      localStorage.removeItem('flowershop_user');
      window.dispatchEvent(new CustomEvent('flowershop:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data) => api.post('/auth/login', data).then(r => r.data),
  googleLogin: (data) => api.post('/auth/google', data).then(r => r.data),
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  getMe: () => api.get('/auth/me').then(r => r.data),
  changePassword: (data) => api.put('/auth/change-password', data).then(r => r.data),
};

// Users API (Admin / Manager only)
export const usersApi = {
  getAll: () => api.get('/users').then(r => r.data),
  create: (data) => api.post('/users', data).then(r => r.data),
  update: (id, data) => api.put(`/users/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/users/${id}`).then(r => r.data),
};

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
