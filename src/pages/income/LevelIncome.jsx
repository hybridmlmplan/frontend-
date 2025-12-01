import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export default function LevelIncome() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    axiosInstance.get("/income/level").then((res) => setRows(res.data.data));
  }, []);

  return (
    <div className="page">
      <h2>Level Income</h2>

      <table>
        <thead>
          <tr>
            <th>Level</th>
            <th>Members</th>
            <th>Income</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x, i) => (
            <tr key={i}>
              <td>{x.level}</td>
              <td>{x.count}</td>
              <td>₹{x.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
