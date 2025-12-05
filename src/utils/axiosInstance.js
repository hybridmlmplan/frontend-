import axios from "axios";

// ----------------------------------------
// AXIOS INSTANCE
// ----------------------------------------
const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`, // IMPORTANT FIX
  timeout: 20000, // 20 sec timeout
});

// ----------------------------------------
// REQUEST INTERCEPTOR → ADD TOKEN
// ----------------------------------------
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------------------
// RESPONSE INTERCEPTOR → AUTO LOGOUT
// ----------------------------------------
API.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response &&
      error.response.status === 401
    ) {
      // clear storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // redirect without infinite loop
      window.location.assign("/login");
    }

    return Promise.reject(error);
  }
);

export default API;
