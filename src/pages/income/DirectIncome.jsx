import React, { useEffect, useState } from "react";
import axios from "axios";

export default function DirectIncome() {
  const userId = localStorage.getItem("userid");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDirectIncome();
  }, []);

  const fetchDirectIncome = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/income/direct/${userId}`
      );
      setRecords(res.data.income || []);
      setLoading(false);
    } catch (err) {
      console.error("Income Fetch Error:", err);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Direct Income</h1>

      {loading ? (
        <div className="text-gray-600">Loading income...</div>
      ) : records.length === 0 ? (
        <div className="text-red-500 font-medium">No Direct Income Found</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">#</th>
                <th className="border p-2 text-left">From User</th>
                <th className="border p-2 text-left">Amount</th>
                <th className="border p-2 text-left">Date</th>
              </tr>
            </thead>

            <tbody>
              {records.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border p-2">{index + 1}</td>
                  <td className="border p-2">{row.fromUser}</td>
                  <td className="border p-2">₹{row.amount}</td>
                  <td className="border p-2">
                    {new Date(row.date).toLocaleDateString()}
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
