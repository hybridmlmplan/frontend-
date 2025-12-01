import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaWallet } from "react-icons/fa";

const FranchiseTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const franchiseId = localStorage.getItem("franchiseId");
  const token = localStorage.getItem("franchiseToken");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/franchise/transactions/${franchiseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTransactions(res.data.transactions || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto p-6">
      <div className="bg-white shadow-md rounded-xl p-6 border">
        <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4">
          <FaWallet className="text-blue-600" />
          Franchise Transactions
        </h2>

        {/* Loader */}
        {loading ? (
          <p className="text-gray-600 text-center py-6">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-600 text-center py-6">
            No transactions found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">User</th>
                  <th className="p-3 text-left">Date</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((t, index) => (
                  <tr
                    key={t._id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 capitalize">{t.type}</td>
                    <td className="p-3 font-semibold text-green-600">₹{t.amount}</td>
                    <td className="p-3">{t.userName || "N/A"}</td>
                    <td className="p-3">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FranchiseTransactions;
