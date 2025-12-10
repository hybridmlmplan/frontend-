// src/api/axiosConfig.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" }
});

// attach token if present
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {}
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // simple global error handling
    if (err.response && err.response.status === 401) {
      // token expired / unauthorized -> optional: redirect to login
      // window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
