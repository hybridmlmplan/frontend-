: "https://mlmplan-backend.onrender.com",  // Backend ka render link
});

// Signup API
export const signup = (userData) => {
  return api.post("/api/auth/signup", userData);
};

// Login API
export const login = (userData) => {
  return api.post("/api/auth/login", userData);
};

// Verify User Token
export const verifyUser = (token) => {
  return api.get("/api/auth/verify", {
    headers: { Authorization: `Bearer ${token}` }
  });
