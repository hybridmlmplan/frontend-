import { useState } from "react";
import { loginUser } from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async () => {
    const res = await loginUser(email, password);

    if (res.success) {
      setMsg("Login Success!");
      localStorage.setItem("token", res.token);
      window.location.href = "/dashboard";
    } else {
      setMsg(res.message || "Invalid credentials");
    }
  };

  return (
    <div className="login-box">
      <h2>Login</h2>

      <input
        type="text"
        placeholder="Enter Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>

      <p>{msg}</p>
    </div>
  );
}

export default Login;
