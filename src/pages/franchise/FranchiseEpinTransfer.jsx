import React, { useState } from "react";
import api from "../../api";
export default function FranchiseEpinTransfer(){
  const [to, setTo] = useState(""); const [epin, setEpin] = useState("");
  const submit=async(e)=>{ e.preventDefault(); try{ await api.post("/epin/transfer",{ to, epin }); alert("EPIN transferred"); }catch(e){ alert(e.response?.data?.message || e.message); } };
  return (<div className="max-w-md bg-white p-4 rounded"><h2 className="font-bold mb-2">EPIN Transfer</h2><form onSubmit={submit}><input value={to} onChange={e=>setTo(e.target.value)} placeholder="To UserID" className="w-full border p-2 mb-2"/><input value={epin} onChange={e=>setEpin(e.target.value)} placeholder="EPIN" className="w-full border p-2 mb-2"/><button className="bg-blue-600 text-white px-3 py-1 rounded">Transfer</button></form></div>);
}
