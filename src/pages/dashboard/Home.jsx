import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data.user);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!user) return <div className="p-4">User Not Found</div>;

  return (
    <div className="p-4 space-y-4">
      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* User Info Card */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Welcome, {user.name}</h2>
        <p><strong>User ID:</strong> {user.userId}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Mobile:</strong> {user.mobile}</p>
      </div>

      {/* Package Card */}
      <div className="bg-blue-50 shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Package Details</h2>
        <p><strong>Package:</strong> {user.packageName || "Not Purchased"}</p>
        <p><strong>PV:</strong> {user.pv || 0}</p>
        <p><strong>Rank:</strong> {user.rank || "No Rank"}</p>
      </div>

      {/* Wallet Card */}
      <div className="bg-green-50 shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Wallet Summary</h2>
        <p><strong>Main Wallet:</strong> ₹{user.mainWallet || 0}</p>
        <p><strong>Income Wallet:</strong> ₹{user.incomeWallet || 0}</p>
        <p><strong>Repurchase Wallet:</strong> ₹{user.repurchaseWallet || 0}</p>
      </div>
    </div>
  );
}
