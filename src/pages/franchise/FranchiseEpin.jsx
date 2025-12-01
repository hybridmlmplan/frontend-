import { useEffect, useState } from "react";
import axios from "axios";

export default function FranchiseEpin() {
  const franchiseId = localStorage.getItem("userid");

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pins, setPins] = useState([]);

  useEffect(() => {
    loadPins();
  }, []);

  const loadPins = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/franchise/epin/list/${franchiseId}`
      );
      setPins(res.data.pins || []);
    } catch (err) {
      console.error("EPIN Load Error:", err);
    }
  };

  const generatePins = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/franchise/epin/generate`,
        {
          franchiseId,
          quantity: Number(quantity),
        }
      );
      await loadPins();
      alert("EPIN generated successfully!");
      setLoading(false);
    } catch (err) {
      console.error("Generate Error:", err);
      alert("Generation failed");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Franchise EPIN Generate
      </h1>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">Generate New EPIN</h2>

        <div className="flex items-center gap-4">
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="border p-2 rounded w-40"
          />

          <button
            onClick={generatePins}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3">EPIN List</h2>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">#</th>
              <th className="border p-2">EPIN</th>
              <th className="border p-2">Package</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Generated On</th>
            </tr>
          </thead>

          <tbody>
            {pins.map((pin, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border p-2">{i + 1}</td>
                <td className="border p-2">{pin.code}</td>
                <td className="border p-2">{pin.package}</td>
                <td className="border p-2">
                  {pin.used ? (
                    <span className="text-red-500">Used</span>
                  ) : (
                    <span className="text-green-600">Unused</span>
                  )}
                </td>
                <td className="border p-2">
                  {new Date(pin.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
