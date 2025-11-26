const API_URL = "https://mlmplan-backend.onrender.com";   // Your backend URL

// LOGIN API
export async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    return await response.json();
  } catch (error) {
    return { status: "error", message: "Server not reachable" };
  }
}
