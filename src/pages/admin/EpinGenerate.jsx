import { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export default function EpinGenerate() {
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");

  const generate = () => {
    axiosInstance
      .post("/epin/generate", { quantity: qty })
      .then((res) => setMsg(res.data.message))
      .catch(() => setMsg("Failed"));
  };

  return (
    <div className="page">
      <h2>Generate EPIN</h2>

      <input
        type="number"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
      />

      <button onClick={generate}>Generate</button>

      {msg && <p>{msg}</p>}
    </div>
  );
}
