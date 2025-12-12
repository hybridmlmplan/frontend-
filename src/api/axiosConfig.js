// src/api/axiosConfig.js
// Complete axios configuration for Hybrid-MLM frontend.
// Usage:
// import api, { setAuthToken, clearAuthToken, get, post } from '@/api/axiosConfig';

import axios from 'axios';

const BASE_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// ======= AUTH TOKEN HELPERS =======
/**
 * Attach token to axios default headers and save to localStorage
 * @param {string} token
 */
export function setAuthToken(token) {
  if (!token) return;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  try {
    localStorage.setItem('token', token);
  } catch (e) {
    // ignore storage errors
  }
}

/**
 * Clear auth token from axios and storage
 */
export function clearAuthToken() {
  delete api.defaults.headers.common['Authorization'];
  try {
    localStorage.removeItem('token');
  } catch (e) {
    // ignore
  }
}

/**
 * Initialize token from localStorage (call once on app start)
 */
export function initAuthFromStorage() {
  try {
    const t = localStorage.getItem('token');
    if (t) setAuthToken(t);
  } catch (e) {
    // ignore
  }
}

// Call it immediately so instance picks up token if present
initAuthFromStorage();

// ======= REQUEST INTERCEPTOR =======
// You can add additional headers (like device-id, app-version) here if required.
api.interceptors.request.use(
  (config) => {
    // Example: add custom header for environment / app
    config.headers['X-App-Name'] = 'HybridMLM-Frontend';
    return config;
  },
  (error) => Promise.reject(error)
);

// ======= RESPONSE INTERCEPTOR (basic handling) =======
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Uniform error shape
    const err = error || {};
    const status = err.response?.status;

    // Auto-signout on 401 (token expired / invalid)
    if (status === 401) {
      // Clear token and redirect to login
      clearAuthToken();
      try {
        // If using react-router, you may prefer to dispatch a logout action.
        // This fallback performs a hard redirect to /login.
        window.location.replace('/login');
      } catch (e) {
        // ignore
      }
      return Promise.reject({ message: 'Unauthorized. Redirecting to login.' });
    }

    // For network errors, provide a friendly message
    if (err.code === 'ECONNABORTED' || !err.response) {
      return Promise.reject({ message: 'Network error or server not reachable.' });
    }

    // Extract server message if available
    const serverMessage = err.response?.data?.message || err.message || 'An error occurred';
    return Promise.reject({ status, message: serverMessage, data: err.response?.data });
  }
);

// ======= SIMPLE WRAPPERS =======
export async function get(path, params = {}, config = {}) {
  const res = await api.get(path, { params, ...config });
  return res.data;
}

export async function post(path, body = {}, config = {}) {
  const res = await api.post(path, body, config);
  return res.data;
}

export async function put(path, body = {}, config = {}) {
  const res = await api.put(path, body, config);
  return res.data;
}

export async function del(path, config = {}) {
  const res = await api.delete(path, config);
  return res.data;
}

// Convenience: login helper that stores token automatically
/**
 * loginPayload: { emailOrPhone, password } or { email, password } depending on backend
 * backend should return { token, user }
 */
export async function loginAndStore(payload) {
  const data = await post('/user/login', payload);
  if (data?.token) {
    setAuthToken(data.token);
  }
  return data;
}

/**
 * Logout convenience - clears token and optionally call backend logout endpoint
 */
export async function logout(doServerCall = false) {
  try {
    if (doServerCall) {
      // best-effort, ignore errors
      await post('/user/logout');
    }
  } catch (e) {
    // ignore
  } finally {
    clearAuthToken();
    try {
      window.location.replace('/login');
    } catch (e) {
      // ignore
    }
  }
}

// Export default axios instance for advanced usage
export default api;
