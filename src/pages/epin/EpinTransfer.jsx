import { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export default function EpinTransfer() {
  const [pin, setPin] = useState("");
  const [toUser, setToUser] = useState("");
  const [msg, setMsg] = useState("");

  const transfer = () => {
    axiosInstance
      .post("/epin/transfer", { pin, toUser })
      .then((res) => setMsg(res.data.message))
      .catch((e) => setMsg("Transfer failed"));
  };

  return (
    <div className="page">
      <h2>Transfer EPIN</h2>

      <input
        placeholder="EPIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
      />

      <input
        placeholder="Transfer to User ID"
        value={toUser}
        onChange={(e) => setToUser(e.target.value)}
      />

      <button onClick={transfer}>Transfer</button>

      {msg && <p>{msg}</p>}
    </div>
  );
}
