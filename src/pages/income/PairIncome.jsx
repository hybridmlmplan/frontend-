import React, { useEffect, useState } from "react";
import api from "../../api";

export default function PairIncome(){
  const [data, setData] = useState([]);
  useEffect(()=>{ api.get("/income/pair").then(r=>setData(r.data.data)).catch(()=>{}); }, []);
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Pair Income</h2>
      <div className="bg-white p-4 rounded shadow">
        <table className="w-full">
          <thead><tr><th>Date</th><th>Amount</th><th>Package</th></tr></thead>
          <tbody>{data.map(d=>(
            <tr key={d._id}><td>{new Date(d.createdAt).toLocaleString()}</td><td>₹{d.amount}</td><td>{d.packageType}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
