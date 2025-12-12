import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import axios from "@/utils/axiosInstance";

const LevelView = () => {
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const res = await axios.get("/genealogy/levels");
      setLevels(res.data.levels);
      setSummary(res.data.summary);
      setLoading(false);
    } catch (error) {
      console.error("Error loading levels:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center py-20">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <h2 className="text-2xl font-semibold mb-6">Level View (1–10 Network)</h2>

      {/* ---------------- SUMMARY CARD ---------------- */}
      {summary && (
        <Card className="mb-6 shadow-md rounded-2xl">
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-500 text-sm">Total Members</p>
              <p className="text-xl font-bold">{summary.totalMembers}</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Total BV</p>
              <p className="text-xl font-bold">{summary.totalBV}</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Level Income (0.5%)</p>
              <p className="text-xl font-bold">₹{summary.totalLevelIncome}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---------------- LEVEL WISE LIST ---------------- */}
      <div className="grid gap-5">
        {levels.map((lv) => (
          <Card key={lv.level} className="shadow-md rounded-2xl">
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold">
                  Level {lv.level}
                </h3>

                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {lv.members.length} Members
                </span>
              </div>

              {/* BV + Level Income */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-gray-500 text-sm">Level BV</p>
                  <p className="text-lg font-semibold">{lv.levelBV}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">Level Income (0.5%)</p>
                  <p className="text-lg font-semibold">₹{lv.levelIncome}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">Bonus %</p>
                  <p className="text-lg font-semibold">{lv.bonusPercent}%</p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">Bonus Income</p>
                  <p className="text-lg font-semibold">₹{lv.bonusIncome}</p>
                </div>
              </div>

              {/* Members List */}
              {lv.members.length > 0 ? (
                <div className="border rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {lv.members.map((m) => (
                      <div
                        key={m.userId}
                        className="p-3 bg-gray-50 rounded-xl border"
                      >
                        <p className="font-semibold">{m.name}</p>
                        <p className="text-sm text-gray-500">ID: {m.userId}</p>
                        <p className="text-sm text-gray-700">
                          Package: {m.package}
                        </p>
                        <p className="text-sm text-gray-700">
                          BV: {m.bv}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center italic">
                  No members in this level
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LevelView;
