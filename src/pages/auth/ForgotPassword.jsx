import React, { useState } from "react";
import api from "../../api";

export default function ForgotPassword(){
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/forgot", { email });
      setMsg("If account exists, reset link sent.");
    } catch (err) { setMsg(err.response?.data?.message || err.message); }
  };
  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-lg font-bold mb-3">Forgot Password</h2>
      <form onSubmit={submit}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full border p-2 rounded mb-3"/>
        <button className="w-full bg-blue-600 text-white p-2 rounded">Send Reset Link</button>
      </form>
      {msg && <div className="mt-3 text-sm">{msg}</div>}
    </div>
  );
}
