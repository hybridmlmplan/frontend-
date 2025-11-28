import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// signup
export const signup = (data) => API.post("/api/auth/signup", data);

// login
export const login = (data) => API.post("/api/auth/login", data);

// verify token
export const verifyUser = (token) =>
  API.get("/api/auth/verify", {
    headers: { Authorization: `Bearer ${token}` }
  });
