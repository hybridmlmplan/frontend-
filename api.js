const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Login API Error:", error);
    return { success: false, message: "Server error!" };
  }
};
