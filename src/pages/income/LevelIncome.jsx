import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import PropTypes from "prop-types";

/**
 * LevelIncome.jsx
 * ----------------
 * 100% complete React component for the Hybrid MLM project.
 * - Tailwind CSS based UI (no external colors hard-coded)
 * - Fetches user's network / level / BV data from API endpoints (fallbacks included)
 * - Calculates level incomes (levels 1-10 at 0.5% each by default)
 * - Shows Level Star progress (Star1/Star2/Star3) and Rank related summaries
 * - Exposes a simple CSV export of the shown level incomes
 *
 * Notes for integration (please confirm these endpoints exist in your backend):
 *  - GET /api/user/network     -> expected: { directs: number, levelCounts: [n1,n2,...], ctoBV: number }
 *  - GET /api/user/bv-ledger   -> expected: { totalBVByLevel: [bv1,bv2,...], bvSummary: { repurchaseBV, productBV, serviceBV } }
 *  - If endpoints differ, change the axios URLs in fetchNetwork() / fetchBVLedger().
 *
 * How the component works briefly:
 *  - It fetches network stats and BV ledger.
 *  - Calculates level incomes using a configurable levelPct (default 0.5% -> 0.005).
 *  - Displays per-level BV, income amounts, and totals.
 *  - Shows Level Star progress (Star1 requires 10 directs on level1, Star2 requires 70 members in level2, Star3 requires 200 in level3)
 *
 * Drop-in: copy this file to src/pages/income/LevelIncome.jsx
 */

const DEFAULT_LEVEL_PCT = 0.005; // 0.5% as decimal
const LEVELS_TO_SHOW = 10;

export default function LevelIncome({ apiBase = "" }) {
  // apiBase can be provided like: process.env.REACT_APP_API || "https://backend-24ch.onrender.com"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // network: directs count and level counts
  const [network, setNetwork] = useState({ directs: 0, levelCounts: Array(LEVELS_TO_SHOW).fill(0), ctoBV: 0 });

  // bvLedger: BV per level (index 0 -> level1 BV sum, ...)
  const [bvLedger, setBvLedger] = useState({ totalBVByLevel: Array(LEVELS_TO_SHOW).fill(0), bvSummary: {} });

  // config
  const [levelPct, setLevelPct] = useState(DEFAULT_LEVEL_PCT); // decimal

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [netRes, bvRes] = await Promise.all([fetchNetwork(), fetchBVLedger()]);
        if (!mounted) return;
        setNetwork(netRes);
        setBvLedger(bvRes);
      } catch (err) {
        console.error("LevelIncome fetch error:", err);
        if (!mounted) return;
        // fallback to mock data so UI remains fully usable even without backend
        setError("Failed to fetch from API. Showing demo data — replace endpoints as needed.");
        setNetwork({
          directs: 12,
          levelCounts: [10, 45, 160, 50, 20, 5, 2, 0, 0, 0],
          ctoBV: 12345.67,
        });
        setBvLedger({
          totalBVByLevel: [10000, 8000, 25000, 3000, 1200, 400, 200, 0, 0, 0],
          bvSummary: { repurchaseBV: 50000, productBV: 15000, serviceBV: 5000 },
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helpers: fetchers
  async function fetchNetwork() {
    const url = `${apiBase}/api/user/network`;
    const res = await axios.get(url);
    // Expected shape: { directs, levelCounts: [...], ctoBV }
    return res.data;
  }

  async function fetchBVLedger() {
    const url = `${apiBase}/api/user/bv-ledger`;
    const res = await axios.get(url);
    // Expected shape: { totalBVByLevel: [...], bvSummary: {...} }
    return res.data;
  }

  // Memoized calculations
  const levelRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < LEVELS_TO_SHOW; i++) {
      const lvl = i + 1;
      const bv = bvLedger.totalBVByLevel[i] || 0;
      const income = bv * levelPct;
      const members = network.levelCounts[i] || 0;
      rows.push({ level: lvl, members, bv, income });
    }
    return rows;
  }, [bvLedger, network, levelPct]);

  const totalBV = useMemo(() => levelRows.reduce((s, r) => s + r.bv, 0), [levelRows]);
  const totalIncome = useMemo(() => levelRows.reduce((s, r) => s + r.income, 0), [levelRows]);

  // Level Star progress logic (based on user's business rules)
  function getLevelStarProgress() {
    // Star1: 10 directs in level1 OR 10 direct members
    const star1Reached = (network.levelCounts[0] || 0) >= 10 || (network.directs || 0) >= 10;
    // Star2: 70 members in second level
    const star2Reached = (network.levelCounts[1] || 0) >= 70;
    // Star3: 200 members in third level
    const star3Reached = (network.levelCounts[2] || 0) >= 200;
    return { star1Reached, star2Reached, star3Reached };
  }

  const stars = getLevelStarProgress();

  // CSV export
  function exportCSV() {
    const header = ["Level", "Members", "BV", "Income (at 0.5%)"].join(",");
    const lines = levelRows.map((r) => [r.level, r.members, r.bv, r.income.toFixed(2)].join(","));
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "level_income_summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="inline-block animate-pulse text-lg">Loading level income...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-start gap-4 mb-4">
        <h1 className="text-2xl font-semibold">Level Income — Network View</h1>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-2 rounded shadow-sm border text-sm"
            title="Refresh data"
          >
            Refresh
          </button>
          <button onClick={exportCSV} className="px-3 py-2 rounded shadow-sm border text-sm">
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-300 text-sm">{error}</div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded shadow-sm border">
          <div className="text-sm text-slate-500">Directs</div>
          <div className="text-3xl font-bold">{network.directs}</div>
          <div className="text-xs mt-2 text-slate-500">Direct members count</div>
        </div>

        <div className="p-4 rounded shadow-sm border">
          <div className="text-sm text-slate-500">Total Level BV</div>
          <div className="text-3xl font-bold">{totalBV.toLocaleString()}</div>
          <div className="text-xs mt-2 text-slate-500">Sum of BV across levels 1–10</div>
        </div>

        <div className="p-4 rounded shadow-sm border">
          <div className="text-sm text-slate-500">Estimated Level Income</div>
          <div className="text-3xl font-bold">₹ {totalIncome.toFixed(2)}</div>
          <div className="text-xs mt-2 text-slate-500">At {parseFloat(levelPct) * 100}% per level (configurable)</div>
        </div>
      </section>

      <section className="mb-6 p-4 rounded shadow-sm border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Level Details</h2>
          <div className="text-sm text-slate-500">Adjust percent: (e.g. 0.005 for 0.5%)</div>
        </div>
        <div className="mb-3">
          <input
            type="number"
            step="0.0001"
            min="0"
            className="border p-2 rounded w-40"
            value={levelPct}
            onChange={(e) => setLevelPct(Number(e.target.value))}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="text-left">
                <th className="p-2 border-b">Level</th>
                <th className="p-2 border-b">Members</th>
                <th className="p-2 border-b">BV</th>
                <th className="p-2 border-b">Income</th>
              </tr>
            </thead>
            <tbody>
              {levelRows.map((r) => (
                <tr key={r.level} className="odd:bg-white even:bg-slate-50">
                  <td className="p-2 border-b">Level {r.level}</td>
                  <td className="p-2 border-b">{r.members}</td>
                  <td className="p-2 border-b">{r.bv.toLocaleString()}</td>
                  <td className="p-2 border-b">₹ {r.income.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="p-2 border-t">Total</td>
                <td className="p-2 border-t">{network.levelCounts.reduce((s, n) => s + n, 0)}</td>
                <td className="p-2 border-t">{totalBV.toLocaleString()}</td>
                <td className="p-2 border-t">₹ {totalIncome.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded shadow-sm border">
          <h3 className="font-medium mb-2">Level Star Progress</h3>
          <ul className="text-sm space-y-2">
            <li>
              <span className="font-semibold">Star 1:</span> Requires 10 directs in level 1 or 10 direct members —{' '}
              <span className={stars.star1Reached ? "text-green-600 font-semibold" : "text-slate-500"}>
                {stars.star1Reached ? "Reached" : "Not reached"}
              </span>
            </li>
            <li>
              <span className="font-semibold">Star 2:</span> Requires 70 members in level 2 —{' '}
              <span className={stars.star2Reached ? "text-green-600 font-semibold" : "text-slate-500"}>
                {stars.star2Reached ? "Reached" : `Not reached (${network.levelCounts[1] || 0}/70)`}
              </span>
            </li>
            <li>
              <span className="font-semibold">Star 3:</span> Requires 200 members in level 3 —{' '}
              <span className={stars.star3Reached ? "text-green-600 font-semibold" : "text-slate-500"}>
                {stars.star3Reached ? "Reached" : `Not reached (${network.levelCounts[2] || 0}/200)`}
              </span>
            </li>
          </ul>
        </div>

        <div className="p-4 rounded shadow-sm border">
          <h3 className="font-medium mb-2">Royalty / CTO BV Summary</h3>
          <div className="text-sm mb-2">CTO BV: <span className="font-semibold">₹ {network.ctoBV?.toLocaleString?.() ?? 0}</span></div>
          <div className="text-sm">Royalty rules (Silver ranks):</div>
          <ol className="text-sm list-decimal pl-5 mt-2 space-y-1">
            <li>3% continuous until ₹35</li>
            <li>After that, rank-wise 1%–8% continuously (configured server-side)</li>
            <li>Royalty distribution is based on CTO BV snapshots (server should provide details)</li>
          </ol>
        </div>
      </section>

      <section className="p-4 rounded shadow-sm border">
        <h3 className="font-medium mb-3">Developer Notes / Integration</h3>
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>
            This component expects two GET endpoints: <code>/api/user/network</code> and <code>/api/user/bv-ledger</code>.
            If your backend uses other routes, update <code>fetchNetwork()</code> and <code>fetchBVLedger()</code>.
          </li>
          <li>
            <strong>Session timings / capping / pair logic</strong> are not simulated here. The session engine should live on the
            backend (a scheduled job) and populate the BV / ledger endpoints consumed by this UI.
          </li>
          <li>
            If you want the component to show per-package pair capping (silver/gold/ruby), extend the BV payload to include
            package-wise PV/BV and render additional tables — easy to add.
          </li>
          <li>
            For large networks, consider server-side pagination and aggregated BV per level to keep UI snappy.
          </li>
        </ul>
      </section>
    </div>
  );
}

LevelIncome.propTypes = {
  apiBase: PropTypes.string,
};
