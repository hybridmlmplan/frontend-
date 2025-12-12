import React, { useState, useEffect } from "react";
import axios from "axios";

const EPINGenerate = () => {
  const [packageType, setPackageType] = useState("Silver");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const [generatedPins, setGeneratedPins] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const token = localStorage.getItem("token");

  const packageList = [
    { name: "Silver", price: 35 },
    { name: "Gold", price: 155 },
    { name: "Ruby", price: 1250 },
  ];

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    if (quantity <= 0) {
      setError("Quantity must be at least 1");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/franchise/generate-epin`,
        {
          packageType,
          quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.status === true) {
        setGeneratedPins(res.data.pins || []);
        setMsg("EPIN generated successfully!");
      } else {
        setError(res.data.message || "Failed to generate EPIN");
      }
    } catch (err) {
      setError("Server error, try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Generate EPIN</h2>

      {msg && <div className="bg-green-200 text-green-800 p-2">{msg}</div>}
      {error && <div className="bg-red-200 text-red-800 p-2">{error}</div>}

      <form
        onSubmit={handleGenerate}
        className="bg-white shadow-md p-4 rounded mt-4"
      >
        <div className="mb-4">
          <label className="block mb-1 font-medium">Package Type</label>
          <select
            className="w-full border p-2 rounded"
            value={packageType}
            onChange={(e) => setPackageType(e.target.value)}
          >
            {packageList.map((pkg) => (
              <option key={pkg.name} value={pkg.name}>
                {pkg.name} — ₹{pkg.price}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Quantity</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Enter quantity"
          />
        </div>

        <button
          className="bg-blue-600 text-white w-full p-2 rounded"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate EPIN"}
        </button>
      </form>

      {/* Display Generated EPINS */}
      {generatedPins.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-3">Generated EPINs</h3>

          <div className="bg-gray-100 p-4 rounded shadow">
            {generatedPins.map((pin, idx) => (
              <div
                key={idx}
                className="border-b py-2 text-sm font-mono flex justify-between"
              >
                <span>{idx + 1}. {pin.code}</span>
                <span className="text-blue-600">{pin.packageType}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EPINGenerate;
