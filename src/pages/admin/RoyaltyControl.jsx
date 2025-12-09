import React, { useState } from "react";
import api from "../../api";
export default function RoyaltyControl(){
  const [bv,setBv] = useState("");
  const distribute = async () => {
    try { await api.post("/royalty/distribute", { bv: Number(bv) }); alert("Royalty distributed"); } catch(e){ alert(e.response?.data?.message || e.message); }
  };
  return (<div className="max-w-md bg-white p-4 rounded"><h2 className="font-bold mb-2">Royalty Control</h2><input value={bv} onChange={e=>setBv(e.target.value)} placeholder="BV amount" className="w-full border p-2 mb-2"/><button onClick={distribute} className="bg-blue-600 text-white px-3 py-1 rounded">Distribute</button></div>);
}
