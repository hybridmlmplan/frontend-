import React, { useState } from "react";
import { PACKAGES } from "../../constants";
import { useDispatch, useSelector } from "react-redux";
import { buyPackage } from "../../redux/packageSlice";

export default function BuyPackage(){
  const [epin, setEpin] = useState("");
  const dispatch = useDispatch();
  const pkgState = useSelector(s=>s.package);

  const buy = (code) => {
    dispatch(buyPackage({ packageCode: code, epin }));
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Buy Package</h2>
      <div className="grid grid-cols-3 gap-4">
        {Object.values(PACKAGES).map(p => (
          <div key={p.code} className="bg-white p-4 rounded shadow">
            <div className="text-lg font-semibold">{p.name}</div>
            <div className="text-2xl font-bold mt-2">₹{p.price}</div>
            <div className="text-sm text-gray-500">PV: {p.pv}</div>
            <button onClick={()=>buy(p.code)} className="mt-3 bg-blue-600 text-white px-3 py-2 rounded">Buy {p.name}</button>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <label className="block mb-1">EPIN (optional)</label>
        <input value={epin} onChange={e=>setEpin(e.target.value)} className="border p-2 rounded w-1/3" placeholder="Enter EPIN to activate package"/>
      </div>

      {pkgState.error && <div className="text-red-600 mt-2">{pkgState.error}</div>}
      {pkgState.lastOrder && <div className="text-green-600 mt-2">Order placed</div>}
    </div>
  );
}
