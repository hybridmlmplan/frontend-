import React, { useEffect, useState } from "react";
import axios from "axios";

const LevelTree = () => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userid");

  const fetchLevels = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/genealogy/levels/${userId}`
      );
      setLevels(res.data.levels || []);
    } catch (err) {
      console.error("Level Tree Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Level Team View</h2>

      {loading && (
        <p className="text-center text-gray-600 text-lg">Loading Levels...</p>
      )}

      {!loading && levels.length === 0 && (
        <p className="text-center text-red-600">No Members Found</p>
      )}

      {!loading && levels.length > 0 && (
        <div className="space-y-6">

          {levels.map((level, index) => (
            <div key={index} className="border p-4 rounded shadow bg-white">
              <h3 className="text-lg font-semibold mb-2">
                Level {index + 1} — ({level.length} Members)
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {level.map((member) => (
                  <div
                    key={member.userid}
                    className="border p-3 rounded bg-gray-50 text-sm shadow"
                  >
                    <p className="font-bold">{member.username}</p>
                    <p className="text-gray-600">Package: {member.package}</p>
                    <p className="text-blue-600">PV: {member.pv}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
};

export default LevelTree;
