import React, { useState } from "react";
import api from "../../api";
export default function KYC(){
  const [file, setFile] = useState(null);
  const submit=async(e)=>{ e.preventDefault(); try{ const fd=new FormData(); fd.append("kyc", file); await api.post("/user/kyc", fd); alert("KYC uploaded"); }catch(e){ alert(e.response?.data?.message || e.message); } };
  return (<div className="max-w-md bg-white p-4 rounded"><h2 className="font-bold mb-2">KYC</h2><form onSubmit={submit}><input type="file" onChange={e=>setFile(e.target.files[0])} className="mb-2"/><button className="bg-blue-600 text-white px-3 py-1 rounded">Upload</button></form></div>);
}
