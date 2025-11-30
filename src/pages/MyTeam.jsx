import { useEffect, useState } from "react";
import axios from "axios";

export default function MyTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/team/directs`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setTeam(res.data.directs || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">My Direct Team</h1>

      {team.length === 0 ? (
        <div className="bg-white shadow p-4 rounded-lg">
          No Direct Members Found.
        </div>
      ) : (
        <div className="space-y-3">
          {team.map((member) => (
            <div
              key={member._id}
              className="bg-white shadow rounded-lg p-4 border"
            >
              <p><strong>Name:</strong> {member.name}</p>
              <p><strong>User ID:</strong> {member.userId}</p>
              <p><strong>Mobile:</strong> {member.mobile}</p>
              <p><strong>Package:</strong> {member.packageName || "Not Purchased"}</p>
              <p><strong>PV:</strong> {member.pv}</p>
              <p><strong>Rank:</strong> {member.rank}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
