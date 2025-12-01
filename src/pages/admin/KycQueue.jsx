import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export default function KycQueue() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axiosInstance.get("/admin/kycqueue").then((res) => {
      setUsers(res.data.users);
    });
  }, []);

  return (
    <div className="page">
      <h2>KYC Queue</h2>

      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Status</th>
            <th>Aadhar</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={i}>
              <td>{u.username}</td>
              <td>{u.kycStatus}</td>
              <td>{u.aadhar}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
