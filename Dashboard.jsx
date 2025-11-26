function Dashboard() {
  const token = localStorage.getItem("token");

  if (!token) {
    // Agar token nahi hai to login page pe redirect
    window.location.href = "/login";
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome to Dashboard</h1>
      <p>You are successfully logged in.</p>

      <button
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
