import { useEffect, useState } from "react";
import axios from "axios";

export default function LevelTeam() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/team/levels`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setLevels(res.data.levels || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Level Team</h1>

      {levels.length === 0 ? (
        <p>No Members Found</p>
      ) : (
        <div className="space-y-4">
          {levels.map((lvl, i) => (
            <div key={i} className="bg-white shadow rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">
                Level {lvl.level}
              </h2>

              <p>
                <strong>Total Members:</strong> {lvl.members.length}
              </p>

              <div className="mt-2 space-y-1">
                {lvl.members.map((m, idx) => (
                  <div
                    key={idx}
                    className="border-b py-1 text-sm flex justify-between"
                  >
                    <span>{m.name} ({m.userId})</span>
                    <span className="text-gray-600">{m.packageName}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
