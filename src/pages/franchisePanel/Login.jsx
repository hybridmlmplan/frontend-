import React, { useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
export default function FranchiseLogin(){ const [id,setId]=useState(""); const [p,setP]=useState(""); const nav=useNavigate();
const submit=async(e)=>{ e.preventDefault(); try{ const r=await api.post("/auth/login",{ identifier: id, password: p }); localStorage.setItem("token", r.data.data.token); nav("/franchise"); }catch(e){ alert(e.response?.data?.message || e.message); } };
return (<div className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow"><h2 className="text-xl font-bold mb-4">Franchise Login</h2><form onSubmit={submit}><input value={id} onChange={e=>setId(e.target.value)} placeholder="ID" className="w-full border p-2 mb-2"/><input value={p} onChange={e=>setP(e.target.value)} placeholder="Password" type="password" className="w-full border p-2 mb-2"/><button className="w-full bg-blue-600 text-white p-2 rounded">Login</button></form></div>); }
