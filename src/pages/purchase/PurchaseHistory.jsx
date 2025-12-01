import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export default function PurchaseHistory() {
  const [list, setList] = useState([]);

  useEffect(() => {
    axiosInstance.get("/purchase/history").then((res) => {
      setList(res.data.data);
    });
  }, []);

  return (
    <div className="page">
      <h2>Purchase History</h2>

      <table>
        <thead>
          <tr>
            <th>Package</th>
            <th>Amount</th>
            <th>PV</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {list.map((x, i) => (
            <tr key={i}>
              <td>{x.packageName}</td>
              <td>₹{x.amount}</td>
              <td>{x.pv}</td>
              <td>{new Date(x.date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
