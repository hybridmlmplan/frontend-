import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../redux/authSlice";
import { Navigate } from "react-router-dom";

export default function Login(){
  const dispatch = useDispatch();
  const auth = useSelector(s=>s.auth);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  if (auth.token) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    dispatch(login({ emailOrId: identifier, password }));
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={submit} className="space-y-3">
        <input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="User ID / Email" className="w-full border p-2 rounded"/>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full border p-2 rounded"/>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Login</button>
      </form>
      {auth.error && <div className="text-red-600 mt-2">{auth.error}</div>}
    </div>
  );
}
