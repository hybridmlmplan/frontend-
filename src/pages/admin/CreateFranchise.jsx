import React, { useState } from "react";
import api from "../../api";
export default function CreateFranchise(){
  const [userId,setUserId]=useState(""); const [comm,setComm]=useState(5);
  const submit=async(e)=>{ e.preventDefault(); try{ await api.post("/franchise/create",{ userId, commissionPercent: Number(comm) }); alert("Franchise created"); }catch(e){ alert(e.response?.data?.message || e.message); } };
  return (<div className="max-w-md bg-white p-4 rounded"><h2 className="font-bold mb-2">Create Franchise</h2><form onSubmit={submit}><input value={userId} onChange={e=>setUserId(e.target.value)} placeholder="User ID" className="w-full border p-2 mb-2"/><input value={comm} onChange={e=>setComm(e.target.value)} placeholder="Commission %" className="w-full border p-2 mb-2"/><button className="bg-green-600 text-white px-3 py-1 rounded">Create</button></form></div>);
}
