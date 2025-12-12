import React, { useEffect, useState } from "react";
import axios from "axios";

// LevelControl.jsx
// Admin UI to view and edit Level System and Level BV/Bonus configuration
// Matches the Hybrid MLM plan: Level Star thresholds, Levels 1-10 BV percentages, Star bonuses
// Assumed backend endpoints (adjust if your backend differs):
// GET  /api/admin/levels        -> returns { status:true, data: { thresholds, levelPercents, starBonuses } }
// PUT  /api/admin/levels        -> body: { thresholds, levelPercents, starBonuses }
// All calls use Authorization Bearer token from localStorage.token

export default function LevelControl() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // thresholds: star1, star2, star3
  const [thresholds, setThresholds] = useState({ star1: 10, star2: 70, star3: 200 });

  // levelPercents: levels 1..10 each percent (default 0.5 for each)
  const defaultLevelPercents = Array.from({ length: 10 }, () => 0.5);
  const [levelPercents, setLevelPercents] = useState(defaultLevelPercents);

  // starBonuses: star1, star2, star3
  const [starBonuses, setStarBonuses] = useState({ star1: 1.0, star2: 1.1, star3: 1.2 });

  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getAuthHeaders() {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchConfig() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/admin/levels`, { headers: getAuthHeaders() });
      if (!res.data) throw new Error("Invalid response");
      if (!res.data.status) throw new Error(res.data.message || "Failed to fetch levels");
      const d = res.data.data || {};
      if (d.thresholds) setThresholds({ ...thresholds, ...d.thresholds });
      if (d.levelPercents && Array.isArray(d.levelPercents)) setLevelPercents(d.levelPercents.slice(0, 10).concat(defaultLevelPercents).slice(0,10));
      if (d.starBonuses) setStarBonuses({ ...starBonuses, ...d.starBonuses });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to load level config");
    } finally {
      setLoading(false);
    }
  }

  function validate() {
    if (!Number.isInteger(Number(thresholds.star1)) || Number(thresholds.star1) <= 0) return "Star 1 threshold must be positive integer";
    if (!Number.isInteger(Number(thresholds.star2)) || Number(thresholds.star2) <= 0) return "Star 2 threshold must be positive integer";
    if (!Number.isInteger(Number(thresholds.star3)) || Number(thresholds.star3) <= 0) return "Star 3 threshold must be positive integer";
    if (Number(thresholds.star1) >= Number(thresholds.star2)) return "Star1 threshold must be less than Star2";
    if (Number(thresholds.star2) >= Number(thresholds.star3)) return "Star2 threshold must be less than Star3";
    if (!Array.isArray(levelPercents) || levelPercents.length !== 10) return "Provide 10 level percents";
    for (let i=0;i<10;i++){
      const v = Number(levelPercents[i]);
      if (isNaN(v) || v < 0 || v > 100) return `Level ${i+1} percent must be between 0 and 100`;
    }
    // star bonuses realistic check
    for (const key of ["star1","star2","star3"]) {
      const v = Number(starBonuses[key]);
      if (isNaN(v) || v < 0 || v > 100) return `${key} bonus must be between 0 and 100`;
    }
    return null;
  }

  async function handleSave() {
    setMsg(null);
    const v = validate();
    if (v) return setError(v);
    setSaving(true);
    setError(null);
    try {
      const payload = { thresholds: { star1: Number(thresholds.star1), star2: Number(thresholds.star2), star3: Number(thresholds.star3) }, levelPercents: levelPercents.map((x)=>Number(x)), starBonuses: { star1: Number(starBonuses.star1), star2: Number(starBonuses.star2), star3: Number(starBonuses.star3) } };
      const res = await axios.put(`/api/admin/levels`, payload, { headers: getAuthHeaders() });
      if (!res.data || !res.data.status) throw new Error(res.data?.message || "Save failed");
      setMsg(res.data.message || "Saved successfully");
      await fetchConfig();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Save error");
    } finally {
      setSaving(false);
    }
  }

  function updateLevelPercent(idx, value) {
    setLevelPercents((s) => {
      const arr = s.slice();
      arr[idx] = value;
      return arr;
    });
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Level Control</h1>
        <div className="flex gap-2">
          <button onClick={fetchConfig} className="px-3 py-2 border rounded">Reload</button>
          <button onClick={handleSave} disabled={saving} className="px-3 py-2 bg-indigo-600 text-white rounded">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center">Loading configuration...</div>
      ) : (
        <div className="space-y-6">
          {error && <div className="p-2 bg-red-100 text-red-800 rounded">{error}</div>}
          {msg && <div className="p-2 bg-green-100 text-green-800 rounded">{msg}</div>}

          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-medium mb-3">Level thresholds (members count)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-600">Level Star 1 (directs)</label>
                <input type="number" value={thresholds.star1} onChange={(e)=>setThresholds(s=>({...s,star1: e.target.value}))} className="mt-1 block w-full border rounded p-2" />
                <div className="text-xs text-gray-500 mt-1">Default: 10 directs (gives first level view)</div>
              </div>

              <div>
                <label className="block text-sm text-gray-600">Level Star 2 (second level)</label>
                <input type="number" value={thresholds.star2} onChange={(e)=>setThresholds(s=>({...s,star2: e.target.value}))} className="mt-1 block w-full border rounded p-2" />
                <div className="text-xs text-gray-500 mt-1">Default: 70 members in second level</div>
              </div>

              <div>
                <label className="block text-sm text-gray-600">Level Star 3 (third level)</label>
                <input type="number" value={thresholds.star3} onChange={(e)=>setThresholds(s=>({...s,star3: e.target.value}))} className="mt-1 block w-full border rounded p-2" />
                <div className="text-xs text-gray-500 mt-1">Default: 200 members in third level</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-medium mb-3">Level BV Percentages (Levels 1 - 10)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {levelPercents.map((v, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-24 text-sm">Level {idx+1}</div>
                  <input type="number" step="0.01" min="0" max="100" value={v} onChange={(e)=>updateLevelPercent(idx, e.target.value)} className="flex-1 border rounded p-2" />
                  <div className="w-20 text-sm text-gray-500">% BV</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">Note: Levels 1–10 default to 0.5% BV each as per plan. Edit values in percent (e.g. 0.5).</div>
          </div>

          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-medium mb-3">Star Level CTO BV Bonuses</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm">Star 1 Bonus (CTO BV)</label>
                <input type="number" step="0.01" value={starBonuses.star1} onChange={(e)=>setStarBonuses(s=>({...s,star1: e.target.value}))} className="mt-1 block w-full border rounded p-2" />
                <div className="text-xs text-gray-500 mt-1">Default: 1%</div>
              </div>

              <div>
                <label className="block text-sm">Star 2 Bonus (CTO BV)</label>
                <input type="number" step="0.01" value={starBonuses.star2} onChange={(e)=>setStarBonuses(s=>({...s,star2: e.target.value}))} className="mt-1 block w-full border rounded p-2" />
                <div className="text-xs text-gray-500 mt-1">Default: 1.1%</div>
              </div>

              <div>
                <label className="block text-sm">Star 3 Bonus (CTO BV)</label>
                <input type="number" step="0.01" value={starBonuses.star3} onChange={(e)=>setStarBonuses(s=>({...s,star3: e.target.value}))} className="mt-1 block w-full border rounded p-2" />
                <div className="text-xs text-gray-500 mt-1">Default: 1.2%</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">These percentages are applied as CTO BV bonuses for qualifying Star ranks.</div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded">{saving ? 'Saving...' : 'Save Configuration'}</button>
          </div>

        </div>
      )}

      <div className="text-xs text-gray-500 mt-4">Tip: Level BV incomes (levels 1–10) should be calculated server-side from BV ledger and paid as percent per level. Star bonuses (CTO BV) are additional and continuous as per plan.</div>
    </div>
  );
}
