import { useEffect, useState } from "react";
import axios from "axios";

export default function Team() {
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

      <div className="bg-white shadow rounded-lg divide-y">
        {team.length === 0 && (
          <p className="p-4 text-gray-500">No direct members found.</p>
        )}

        {team.map((member, index) => (
          <div key={index} className="p-4">
            <p><strong>Name:</strong> {member.name}</p>
            <p><strong>User ID:</strong> {member.userId}</p>
            <p><strong>Mobile:</strong> {member.mobile}</p>
            <p><strong>Package:</strong> {member.packageName}</p>
            <p><strong>Join Date:</strong> {member.joinDate}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
