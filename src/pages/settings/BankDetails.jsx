import React, { useState } from "react";

export default function BankDetails() {
  const [bank, setBank] = useState("");

  return (
    <div className="container card">
      <h2>Bank Details</h2>
      <input
        placeholder="Bank Name"
        className="input"
        value={bank}
        onChange={(e) => setBank(e.target.value)}
      />
      <button>Save</button>
    </div>
  );
}
