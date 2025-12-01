import { useEffect, useState } from "react";
import axios from "axios";

export default function EpinTransfer() {
  const userId = localStorage.getItem("userid");

  const [pins, setPins] = useState([]);
  const [receiverId, setReceiverId] = useState("");
  const [selectedPin, setSelectedPin] = useState("");
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
      console.error("EPIN Fetch Error:", err);
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedPin || !receiverId) {
      alert("Please select EPIN and enter Receiver UserID");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/epin/transfer`,
        {
          fromUser: userId,
          toUser: receiverId,
          pin: selectedPin,
        }
      );

      alert(res.data.message || "Transfer Successful");
      fetchPins();
    } catch (err) {
      alert(err?.response?.data?.message || "Transfer Failed");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">EPIN Transfer</h1>

      {loading ? (
        <div>Loading pins...</div>
      ) : (
        <div className="space-y-4">
          {/* Receiver Input */}
          <div>
            <label className="block font-semibold mb-1">
              Receiver UserID
            </label>
            <input
              type="text"
              className="border p-2 rounded w-full"
              placeholder="Enter UserID"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
            />
          </div>

          {/* Select Pin */}
          <div>
            <label className="block font-semibold mb-1">Select EPIN</label>
            <select
              className="border p-2 rounded w-full"
              value={selectedPin}
              onChange={(e) => setSelectedPin(e.target.value)}
            >
              <option value="">-- Select EPIN --</option>
              {pins
                .filter((x) => !x.used)
                .map((pin, index) => (
                  <option key={index} value={pin.pin}>
                    {pin.pin} — {pin.packageName}
                  </option>
                ))}
            </select>
          </div>

          {/* Transfer Button */}
          <button
            onClick={handleTransfer}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            Transfer EPIN
          </button>
        </div>
      )}
    </div>
  );
}
