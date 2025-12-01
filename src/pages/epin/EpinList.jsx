import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export default function EpinList() {
  const [epins, setEpins] = useState([]);

  useEffect(() => {
    axiosInstance.get("/epin/list").then((res) => {
      setEpins(res.data.epins || []);
    });
  }, []);

  return (
    <div className="page">
      <h2>My EPIN List</h2>
      <table>
        <thead>
          <tr>
            <th>PIN</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {epins.map((e, i) => (
            <tr key={i}>
              <td>{e.pin}</td>
              <td>{e.status}</td>
              <td>{new Date(e.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
