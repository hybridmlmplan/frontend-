// src/api.js
const API_BASE_URL = "https://backend-1lby.onrender.com"; // Your Render backend URL

export async function loginUser(username, password) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  return response.json();
}
