import React, { useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";

export default function Signup(){
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"", sponsorId:"", placementId:"" });
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/signup", form);
      nav("/login");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto mt-6 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Signup</h2>
      <form onSubmit={submit} className="space-y-2">
        <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Name" className="w-full border p-2 rounded"/>
        <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Mobile" className="w-full border p-2 rounded"/>
        <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email (optional)" className="w-full border p-2 rounded"/>
        <input value={form.sponsorId} onChange={e=>setForm({...form,sponsorId:e.target.value})} placeholder="Sponsor ID (optional)" className="w-full border p-2 rounded"/>
        <input value={form.placementId} onChange={e=>setForm({...form,placementId:e.target.value})} placeholder="Placement ID (optional)" className="w-full border p-2 rounded"/>
        <input value={form.password} onChange={e=>setForm({...form,password:e.target.value})} type="password" placeholder="Password" className="w-full border p-2 rounded"/>
        <button className="w-full bg-green-600 text-white p-2 rounded">{loading ? "Please wait..." : "Signup"}</button>
      </form>
    </div>
  );
}
