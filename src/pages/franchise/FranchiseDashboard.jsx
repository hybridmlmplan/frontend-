import { useEffect, useState } from "react";
import axios from "axios";

export default function FranchiseDashboard() {
  const userId = localStorage.getItem("userid");

  const [franchise, setFranchise] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFranchiseData();
  }, []);

  const loadFranchiseData = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/franchise/details/${userId}`
      );
      setFranchise(res.data.data || null);
      setLoading(false);
    } catch (err) {
      console.error("Franchise Load Error:", err);
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-4 text-gray-600 font-medium text-lg">
        Loading franchise dashboard...
      </div>
    );

  if (!franchise)
    return (
      <div className="p-4 text-red-600 font-medium text-lg">
        Franchise details not found.
      </div>
    );

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Franchise Dashboard
      </h1>

      {/* Franchise Info */}
      <div className="bg-white p-4 rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-2 text-gray-700">
          Franchise Information
        </h2>

        <div className="space-y-1 text-gray-700">
          <p>
            <strong>Franchise Name:</strong> {franchise.name}
          </p>
          <p>
            <strong>Franchise ID:</strong> {franchise.franchiseId}
          </p>
          <p>
            <strong>Owner:</strong> {franchise.ownerName}
          </p>
          <p>
            <strong>Mobile:</strong> {franchise.mobile}
          </p>
          <p>
            <strong>Commission %:</strong> {franchise.commissionPercent}%
          </p>
        </div>
      </div>

      {/* Earnings */}
      <div className="bg-blue-50 p-4 rounded-lg shadow-md border border-blue-200">
        <h2 className="text-xl font-semibold mb-2 text-blue-700">
          Earnings Summary
        </h2>

        <div className="space-y-1 text-gray-700">
          <p>
            <strong>Total BV:</strong> {franchise.totalBV}
          </p>
          <p>
            <strong>Total Earnings:</strong> ₹{franchise.totalEarnings}
          </p>
          <p>
            <strong>Pending Payment:</strong> ₹{franchise.pendingAmount}
          </p>
        </div>
      </div>

      {/* Products */}
      <div className="bg-green-50 p-4 rounded-lg shadow-md border border-green-200">
        <h2 className="text-xl font-semibold mb-2 text-green-700">
          Products Sold
        </h2>

        {franchise.products?.length === 0 ? (
          <p className="text-gray-600">No products sold yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">Product</th>
                  <th className="border p-2 text-left">Qty</th>
                  <th className="border p-2 text-left">BV</th>
                  <th className="border p-2 text-left">Earnings</th>
                </tr>
              </thead>

              <tbody>
                {franchise.products.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border p-2">{p.name}</td>
                    <td className="border p-2">{p.qty}</td>
                    <td className="border p-2">{p.bv}</td>
                    <td className="border p-2">₹{p.earnings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
