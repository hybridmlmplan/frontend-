import { useEffect, useState } from "react";
import axios from "axios";

export default function EpinList() {
  const userId = localStorage.getItem("userid");
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPins();
  }, []);

  const fetchPins = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/epin/list/${userId}`
      );
      setPins(res.data.pins || []);
      setLoading(false);
    } catch (err) {
      console.error("EPIN List Error:", err);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">EPIN List</h1>

      {loading ? (
        <div className="text-gray-600">Loading pins...</div>
      ) : pins.length === 0 ? (
        <div className="text-red-500 font-medium">No EPIN Found</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">#</th>
                <th className="border p-2 text-left">EPIN</th>
                <th className="border p-2 text-left">Package</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Date</th>
              </tr>
            </thead>

            <tbody>
              {pins.map((pin, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border p-2">{index + 1}</td>
                  <td className="border p-2">{pin.pin}</td>
                  <td className="border p-2">{pin.packageName}</td>
                  <td className="border p-2">
                    {pin.used ? (
                      <span className="text-red-600 font-medium">Used</span>
                    ) : (
                      <span className="text-green-600 font-medium">Unused</span>
                    )}
                  </td>
                  <td className="border p-2">
                    {new Date(pin.createdAt).toLocaleDateString()}
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
