import React, { useState } from "react";
import api from "../../api";
export default function ChangePassword(){
  const [oldP, setOldP] = useState(""); const [newP, setNewP] = useState("");
  const submit=async(e)=>{ e.preventDefault(); try{ await api.post("/auth/change-password",{ oldPassword: oldP, newPassword: newP }); alert("Password changed"); }catch(e){ alert(e.response?.data?.message || e.message); } };
  return (<div className="max-w-md bg-white p-4 rounded"><h2 className="font-bold mb-2">Change Password</h2><form onSubmit={submit}><input value={oldP} onChange={e=>setOldP(e.target.value)} placeholder="Old password" className="w-full border p-2 mb-2" type="password"/><input value={newP} onChange={e=>setNewP(e.target.value)} placeholder="New password" className="w-full border p-2 mb-2" type="password"/><button className="bg-green-600 text-white px-3 py-1 rounded">Change</button></form></div>);
}
