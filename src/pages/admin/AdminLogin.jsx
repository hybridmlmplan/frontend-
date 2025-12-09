import React, { useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
export default function AdminLogin(){
  const [id,setId]=useState(""); const [pass,setPass]=useState(""); const nav=useNavigate();
  const submit=async(e)=>{ e.preventDefault(); try{ const r=await api.post("/auth/login",{ identifier: id, password: pass }); if(r.data?.data?.user?.role === "admin"){ localStorage.setItem("token", r.data.data.token); nav("/admin"); } else alert("Not admin"); }catch(e){ alert(e.response?.data?.message || e.message); } };
  return (<div className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow"><h2 className="text-xl font-bold mb-4">Admin Login</h2><form onSubmit={submit}><input value={id} onChange={e=>setId(e.target.value)} placeholder="Admin ID" className="w-full border p-2 mb-2"/><input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" className="w-full border p-2 mb-2" type="password"/><button className="w-full bg-blue-600 text-white p-2 rounded">Login</button></form></div>);
}
