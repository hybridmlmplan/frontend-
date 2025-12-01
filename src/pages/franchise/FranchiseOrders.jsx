import { useEffect, useState } from "react";
import axios from "axios";

export default function FranchiseOrders() {
  const franchiseId = localStorage.getItem("userid");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/franchise/orders/${franchiseId}`
      );
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Franchise Orders Error:", err);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Franchise Orders</h1>

      {loading ? (
        <div className="text-gray-600">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-red-500 font-semibold">No Orders Found</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">#</th>
                <th className="border p-2">Order ID</th>
                <th className="border p-2">User ID</th>
                <th className="border p-2">Amount</th>
                <th className="border p-2">BV</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Date</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border p-2">{index + 1}</td>
                  <td className="border p-2">{order.orderId}</td>
                  <td className="border p-2">{order.userId}</td>
                  <td className="border p-2">₹{order.amount}</td>
                  <td className="border p-2">{order.bv}</td>
                  <td className="border p-2 text-blue-600 font-medium">
                    {order.status}
                  </td>
                  <td className="border p-2">
                    {new Date(order.date).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
