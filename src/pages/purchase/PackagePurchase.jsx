// src/pages/purchase/PackagePurchase.jsx
import { useEffect, useState } from "react";
import API from "../../utils/axiosInstance";

export default function PackagePurchase() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    API.get("/packages")
      .then((res) => {
        setPackages(res.data.packages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleBuy = () => {
    if (!selected) return alert("Please select a package");

    API.post("/packages/buy", { packageId: selected })
      .then((res) => {
        alert("Package Purchased Successfully!");
      })
      .catch((err) => {
        alert(err?.response?.data?.message || "Purchase Failed");
      });
  };

  if (loading) return <div className="p-4">Loading Packages...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Purchase Package</h1>

      {packages.length === 0 ? (
        <p>No packages available.</p>
      ) : (
        <div className="grid gap-4">
          {packages.map((pkg, i) => (
            <div
              key={i}
              className={`border p-4 rounded-lg shadow cursor-pointer ${
                selected === pkg._id ? "border-blue-600" : "border-gray-300"
              }`}
              onClick={() => setSelected(pkg._id)}
            >
              <h2 className="text-xl font-semibold text-gray-800">
                {pkg.name}
              </h2>
              <p><strong>Price:</strong> ₹{pkg.price}</p>
              <p><strong>PV:</strong> {pkg.pv}</p>
              <p><strong>Pair Income:</strong> ₹{pkg.pairIncome}</p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleBuy}
        className="bg-blue-600 text-white px-5 py-2 rounded"
      >
        Buy Selected Package
      </button>
    </div>
  );
}
