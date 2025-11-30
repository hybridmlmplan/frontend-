import axios from "axios";

// ----------------------------------------
// BASE URL (Render backend)
// ----------------------------------------
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // example: https://backend-1.onrender.com/api
  withCredentials: false,
});

// ----------------------------------------
// ATTACH TOKEN AUTOMATICALLY
// ----------------------------------------
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------------------
// RESPONSE INTERCEPTOR → AUTO LOGOUT ON 401
// ----------------------------------------
API.interceptors.response.use(
  (response) => response,

  (error) => {
    // If token expired or invalid
    if (
      error.response &&
      error.response.status === 401 &&
      !error.config.__isRetryRequest
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login page
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default API;
