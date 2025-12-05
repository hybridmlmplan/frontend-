// frontend/src/pages/dashboard/Home.jsx
import { useEffect, useState } from "react";
import API from "../../utils/axiosInstance";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/auth/me") // changed → match backend
      .then((res) => {
        setUser(res.data.data || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("User Fetch Error:", err);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="p-4 text-gray-600 text-lg font-medium">
        Loading dashboard...
      </div>
    );

  if (!user)
    return (
      <div className="p-4 text-red-600 text-lg font-medium">
        User not found
      </div>
    );

  return (
    <div className="p-4 space-y-4">

      {/* Heading */}
      <h1 className="text-3xl font-bold text-gray-800 tracking-wide">
        Dashboard Overview
      </h1>

      {/* User Card */}
      <div className="bg-white shadow-md rounded-lg p-4 border">
        <h2 className="text-lg font-semibold mb-2 text-gray-800">
          Welcome, {user.name}
        </h2>

        <div className="space-y-1 text-gray-700">
          <p>
            <strong>User ID:</strong> {user.userId}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Phone:</strong> {user.phone}
          </p>
        </div>
      </div>

      {/* Package Card */}
      <div className="bg-blue-50 shadow-md rounded-lg p-4 border border-blue-200">
        <h2 className="text-lg font-semibold mb-2 text-blue-700">
          Package Details
        </h2>

        <div className="space-y-1 text-gray-700">
          <p>
            <strong>Package:</strong> {user.packageName || "Not Purchased"}
          </p>
          <p>
            <strong>PV:</strong> {user.pv || 0}
          </p>
          <p>
            <strong>Rank:</strong> {user.rank || "No Rank"}
          </p>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="bg-green-50 shadow-md rounded-lg p-4 border border-green-200">
        <h2 className="text-lg font-semibold mb-2 text-green-700">
          Wallet Summary
        </h2>

        <div className="space-y-1 text-gray-700">
          <p>
            <strong>Main Wallet:</strong> ₹{user.mainWallet || 0}
          </p>
          <p>
            <strong>Income Wallet:</strong> ₹{user.incomeWallet || 0}
          </p>
          <p>
            <strong>Repurchase Wallet:</strong> ₹{user.repurchaseWallet || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
