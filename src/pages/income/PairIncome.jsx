import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export default function PairIncome() {
  const [list, setList] = useState([]);

  useEffect(() => {
    axiosInstance.get("/income/pair").then((res) => setList(res.data.data));
  }, []);

  return (
    <div className="page">
      <h2>Pair Income</h2>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Left</th>
            <th>Right</th>
            <th>Income</th>
          </tr>
        </thead>
        <tbody>
          {list.map((x, i) => (
            <tr key={i}>
              <td>{new Date(x.date).toLocaleDateString()}</td>
              <td>{x.left}</td>
              <td>{x.right}</td>
              <td>₹{x.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
