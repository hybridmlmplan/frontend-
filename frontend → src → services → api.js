// REGISTER API
export async function register(data) {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    return { status: "error", message: "Server not reachable" };
  }
}
