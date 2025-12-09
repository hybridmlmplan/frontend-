import React, { useEffect, useState } from "react";
import api from "../../api";
import { formatCurrency } from "../../utils";

export default function WalletSummary(){
  const [data, setData] = useState(null);
  useEffect(()=>{ api.get("/wallet/me").then(r=>setData(r.data.data)).catch(()=>{}); }, []);
  if(!data) return <div>Loading...</div>;
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Wallet</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div>Balance</div>
          <div className="text-2xl font-bold">{formatCurrency(data.wallet.balance || 0)}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div>Pending</div>
          <div className="text-2xl font-bold">{formatCurrency(data.wallet.pending || 0)}</div>
        </div>
      </div>
    </div>
  );
}
