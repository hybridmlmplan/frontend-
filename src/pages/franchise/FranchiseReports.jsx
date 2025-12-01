import { useEffect, useState } from "react";
import axios from "axios";

export default function FranchiseReports() {
  const franchiseId = localStorage.getItem("userid");

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/franchise/reports/${franchiseId}`
      );
      setReports(res.data.reports || []);
    } catch (err) {
      console.error("Franchise Reports Error:", err);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Franchise Reports</h1>

      {loading ? (
        <div className="text-gray-600">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="text-red-500 font-semibold">No Reports Found</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">#</th>
                <th className="border p-2">Report Type</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">BV</th>
                <th className="border p-2">Generated On</th>
              </tr>
            </thead>

            <tbody>
              {reports.map((r, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border p-2">{index + 1}</td>
                  <td className="border p-2">{r.type}</td>
                  <td className="border p-2">₹{r.amount}</td>
                  <td className="border p-2">{r.bv}</td>
                  <td className="border p-2">
                    {new Date(r.date).toLocaleString()}
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
