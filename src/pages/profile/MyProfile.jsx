import React, { useEffect, useState } from "react";
import api from "../../api";
export default function MyProfile(){
  const [profile, setProfile] = useState(null);
  useEffect(()=>{ api.get("/auth/me").then(r=>setProfile(r.data.data)).catch(()=>{}); }, []);
  if(!profile) return <div>Loading...</div>;
  return (<div className="bg-white p-4 rounded"><h2 className="text-lg font-bold">My Profile</h2><div className="mt-2">Name: {profile.name}</div><div>Mobile: {profile.phone}</div><div>UserID: {profile.userCode}</div></div>);
}
