import { useEffect, useState } from "react";
import axios from "axios";

export default function FranchiseHistory() {
  const franchiseId = localStorage.getItem("userid");
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/franchise/history/${franchiseId}?type=${filter}`
      );
      setRecords(res.data.history || []);
    } catch (err) {
      console.error("History Load Error:", err);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Franchise History
      </h1>

      {/* Filter */}
      <div className="mb-4 flex items-center gap-4">
        <label className="font-medium">Filter:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All</option>
          <option value="epin_generate">EPIN Generate</option>
          <option value="epin_transfer">EPIN Transfer</option>
          <option value="sale">Product Sale</option>
          <option value="commission">Commission Earned</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">#</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Details</th>
              <th className="border p-2">Amount / Qty</th>
              <th className="border p-2">Date</th>
            </tr>
          </thead>

          <tbody>
            {records.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2 capitalize">{row.type}</td>

                <td className="border p-2">{row.details}</td>

                <td className="border p-2">
                  {row.amount
                    ? `₹${row.amount}`
                    : row.quantity
                    ? `${row.quantity}`
                    : "-"}
                </td>

                <td className="border p-2">
                  {new Date(row.date).toLocaleString()}
                </td>
              </tr>
            ))}

            {records.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="text-center text-red-500 font-medium p-3"
                >
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
