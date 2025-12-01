import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export default function RoyaltyIncome() {
  const [list, setList] = useState([]);

  useEffect(() => {
    axiosInstance.get("/income/royalty").then((res) => setList(res.data.data));
  }, []);

  return (
    <div className="page">
      <h2>Royalty Income</h2>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Rank</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {list.map((x, i) => (
            <tr key={i}>
              <td>{new Date(x.date).toLocaleDateString()}</td>
              <td>{x.rank}</td>
              <td>₹{x.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
