import React, { useState } from "react";
import api from "../../api";
export default function WithdrawFund(){
  const [amount,setAmount]=useState("");
  const submit=async(e)=>{ e.preventDefault(); try{ await api.post("/wallet/withdraw",{ amount: Number(amount) }); alert("Withdraw request created"); }catch(e){ alert(e.response?.data?.message || e.message); } };
  return (<div className="max-w-md bg-white p-4 rounded"><h2 className="font-bold mb-2">Withdraw</h2><form onSubmit={submit}><input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount" className="w-full border p-2 mb-2"/><button className="bg-red-600 text-white px-3 py-1 rounded">Request Withdraw</button></form></div>);
}
