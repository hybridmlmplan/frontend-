import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "../../redux/userSlice";
import { formatCurrency } from "../../utils";

export default function UserDashboard(){
  const dispatch = useDispatch();
  const user = useSelector(s=>s.user.profile);
  useEffect(()=>{ dispatch(fetchMe()); }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.name || user.userCode}</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Wallet Balance</div>
          <div className="text-xl font-bold">{formatCurrency(user.wallet?.balance || 0)}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">PV (Total)</div>
          <div className="text-xl font-bold">{user.totalPV || 0}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">BV (Total)</div>
          <div className="text-xl font-bold">{user.totalBV || 0}</div>
        </div>
      </div>
    </div>
  );
}
