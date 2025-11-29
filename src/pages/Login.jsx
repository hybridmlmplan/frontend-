import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const res = await axios.post(
        "https://backend-1-1b8h.onrender.com/api/auth/login",
        { email, password }
      );
      alert(res.data.message);
    } catch (err) {
      alert("Login failed");
      console.log(err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      />

      <input
        placeholder="Password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      />

      <button onClick={login} style={{ marginBottom: 20 }}>
        Login
      </button>

      <br />

      {/* NEW SIGNUP BUTTON */}
      <Link to="/signup">
        <button>Create Account (Signup)</button>
      </Link>
    </div>
  );
}
