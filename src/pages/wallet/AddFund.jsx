import { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export default function AddFund() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await axiosInstance.post("/wallet/add-fund", { amount });
      setMsg(res.data.message || "Fund request submitted");
      setAmount("");
    } catch (err) {
      setMsg(err.response?.data?.message || "Error Occurred");
    }

    setLoading(false);
  };

  return (
    <div className="page">
      <h2>Add Fund</h2>

      {msg && <p className="msg">{msg}</p>}

      <form onSubmit={handleSubmit}>
        <label>Enter Amount</label>
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <button disabled={loading} type="submit">
          {loading ? "Processing..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
