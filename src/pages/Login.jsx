import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        "https://backend-1-1b8h.onrender.com/api/auth/login",
        { email, password }
      );

      alert("Login Successful!");
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard"); // add dashboard later
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }

    setLoading(false);
  };

  return (
    <div style={{ width: "90%", margin: "40px auto", maxWidth: "400px" }}>
      <h2 style={{ textAlign: "center" }}>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            background: "blue",
            color: "white",
            border: "none",
          }}
        >
          {loading ? "Please wait..." : "Login"}
        </button>

        <p style={{ textAlign: "center", marginTop: "10px" }}>
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            style={{ color: "blue", cursor: "pointer" }}
          >
            Signup
          </span>
        </p>
      </form>
    </div>
  );
}
