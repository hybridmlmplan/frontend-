import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export default function FundIncome() {
  const [list, setList] = useState([]);

  useEffect(() => {
    axiosInstance.get("/income/fund").then((res) => setList(res.data.data));
  }, []);

  return (
    <div className="page">
      <h2>Fund Income</h2>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {list.map((x, i) => (
            <tr key={i}>
              <td>{new Date(x.date).toLocaleDateString()}</td>
              <td>{x.desc}</td>
              <td>₹{x.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
