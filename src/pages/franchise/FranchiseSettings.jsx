import { useState, useEffect } from "react";
import axios from "axios";

export default function FranchiseSettings() {
  const franchiseId = localStorage.getItem("userid");

  const [details, setDetails] = useState({
    shopName: "",
    ownerName: "",
    mobile: "",
    address: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    loadDetails();
  }, []);

  const loadDetails = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/franchise/settings/${franchiseId}`
      );
      if (res.data.settings) setDetails(res.data.settings);
    } catch (err) {
      console.error("Settings Load Error:", err);
    }
  };

  const handleChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const saveSettings = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/franchise/settings/update`,
        { franchiseId, ...details }
      );
      setMessage("Settings updated successfully!");
      setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      console.error("Settings Save Error:", err);
      setMessage("Failed to update settings!");
      setTimeout(() => setMessage(""), 2500);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Franchise Settings
      </h1>

      {message && (
        <div className="mb-4 text-green-600 font-medium">{message}</div>
      )}

      {/* Form */}
      <div className="grid gap-4">
        <input
          type="text"
          name="shopName"
          placeholder="Shop Name"
          value={details.shopName}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />

        <input
          type="text"
          name="ownerName"
          placeholder="Owner Name"
          value={details.ownerName}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />

        <input
          type="text"
          name="mobile"
          placeholder="Mobile Number"
          value={details.mobile}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />

        <textarea
          name="address"
          placeholder="Full Address"
          value={details.address}
          onChange={handleChange}
          className="border p-2 rounded w-full h-24"
        ></textarea>

        <button
          onClick={saveSettings}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
