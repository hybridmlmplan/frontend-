import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";

/**
 * PercentageIncome.jsx
 * --------------------
 * Complete React component for showing percentage-based incomes
 * (royalty, rank income, funds) according to the Hybrid MLM business plan.
 *
 * Features:
 * - Fetches /api/user/profile, /api/user/network, /api/user/bv-ledger
 * - Calculates royalty based on CTO BV and rank rules (3% until ₹35 then rank-wise 1%-8%)
 * - Shows level-based BV income (levels 1-10 at configurable percent)
 * - Calculates fund contributions (Car Fund / House Fund eligibility)
 * - CSV export and client-side config for testing
 * - Friendly fallbacks and clear developer notes for backend contract
 *
 * Integration endpoints expected (change URLs if your backend differs):
 *  - GET {apiBase}/api/user/profile    -> { name, uid, rank, package }
 *  - GET {apiBase}/api/user/network    -> { directs, levelCounts: [], ctoBV }
 *  - GET {apiBase}/api/user/bv-ledger  -> { totalBVByLevel: [], bvSummary: { repurchaseBV, productBV, serviceBV } }
 */

const LEVELS = 10;
const DEFAULT_LEVEL_PCT = 0.005; // 0.5%

// default royalty map after ₹35 (1% - 8%) — adjust server-side for true values
const DEFAULT_RANK_ROYALTY = {
  "Star": 0.01,
  "Silver Star": 0.02,
  "Gold Star": 0.03,
  "Ruby Star": 0.04,
  "Emerald Star": 0.05,
  "Diamond Star": 0.06,
  "Crown Star": 0.07,
  "Ambassador Star": 0.08,
  "Company Star": 0.08,
};

export default function PercentageIncome({ apiBase = "" }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [profile, setProfile] = useState({ name: "", uid: "", rank: "", package: "Silver" });
  const [network, setNetwork] = useState({ directs: 0, levelCounts: Array(LEVELS).fill(0), ctoBV: 0 });
  const [bvLedger, setBvLedger] = useState({ totalBVByLevel: Array(LEVELS).fill(0), bvSummary: {} });

  // client-side configurable params for testing
  const [levelPct, setLevelPct] = useState(DEFAULT_LEVEL_PCT);
  const [royaltyMap, setRoyaltyMap] = useState(DEFAULT_RANK_ROYALTY);

  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        const [prof, net, bv] = await Promise.all([fetchProfile(), fetchNetwork(), fetchBVLedger()]);
        if (!mounted) return;
        setProfile(prof);
        setNetwork(net);
        setBvLedger(bv);
      } catch (err) {
        console.error("PercentageIncome fetch error:", err);
        if (!mounted) return;
        setError("Failed to fetch from API. Showing demo data — replace endpoints as needed.");
        setProfile({ name: "Demo User", uid: "GSM0001", rank: "Silver Star", package: "Silver" });
        setNetwork({ directs: 12, levelCounts: [10, 45, 160, 50, 20, 5, 2, 0, 0, 0], ctoBV: 12345.67 });
        setBvLedger({ totalBVByLevel: [10000, 8000, 25000, 3000, 1200, 400, 200, 0, 0, 0], bvSummary: { repurchaseBV: 50000, productBV: 15000, serviceBV: 5000 } });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfile() {
    const url = `${apiBase}/api/user/profile`;
    const res = await axios.get(url);
    return res.data;
  }

  async function fetchNetwork() {
    const url = `${apiBase}/api/user/network`;
    const res = await axios.get(url);
    return res.data;
  }

  async function fetchBVLedger() {
    const url = `${apiBase}/api/user/bv-ledger`;
    const res = await axios.get(url);
    return res.data;
  }

  // Calculations
  const levelRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < LEVELS; i++) {
      const lvl = i + 1;
      const bv = bvLedger.totalBVByLevel[i] || 0;
      const income = bv * levelPct;
      const members = network.levelCounts[i] || 0;
      rows.push({ level: lvl, members, bv, income });
    }
    return rows;
  }, [bvLedger, network, levelPct]);

  const totalBV = useMemo(() => levelRows.reduce((s, r) => s + r.bv, 0), [levelRows]);
  const totalLevelIncome = useMemo(() => levelRows.reduce((s, r) => s + r.income, 0), [levelRows]);

  // Royalty percentage logic
  function getRoyaltyPercent() {
    const ctoBV = network.ctoBV || 0;
    // rule: 3% until ₹35; after that, rank-wise mapping
    if (ctoBV <= 35) return 0.03;
    const rank = profile.rank || "Star";
    return royaltyMap[rank] ?? 0.01;
  }

  const royaltyPercent = getRoyaltyPercent();
  const royaltyAmount = (network.ctoBV || 0) * royaltyPercent;

  // Fund eligibility and amounts (monthly car/house funds from BV)
  const repurchaseBV = bvLedger.bvSummary?.repurchaseBV ?? 0;
  const carFundPool = repurchaseBV * 0.02; // monthly 2% pool
  const houseFundPool = repurchaseBV * 0.02; // monthly 2% pool

  // Eligibility
  const rankEligibility = useMemo(() => {
    const r = profile.rank || "";
    const order = ["Star","Silver Star","Gold Star","Ruby Star","Emerald Star","Diamond Star","Crown Star","Ambassador Star","Company Star"];
    const idx = order.indexOf(r);
    return {
      carFundEligible: idx >= order.indexOf("Ruby Star"),
      houseFundEligible: idx >= order.indexOf("Diamond Star"),
    };
  }, [profile.rank]);

  const carFundShare = rankEligibility.carFundEligible ? carFundPool : 0;
  const houseFundShare = rankEligibility.houseFundEligible ? houseFundPool : 0;

  // Export CSV of percentage incomes
  function exportCSV() {
    const header = ["Type", "Reference", "Amount"].join(",");
    const lines = [];

    // level rows
    levelRows.forEach((r) => lines.push(["LevelIncome", `Level ${r.level}`, r.income.toFixed(2)].join(",")));
    // royalty
    lines.push(["Royalty", profile.rank || "-", royaltyAmount.toFixed(2)].join(","));
    // funds
    lines.push(["CarFundPool", rankEligibility.carFundEligible ? "Eligible" : "Not Eligible", carFundShare.toFixed(2)].join(","));
    lines.push(["HouseFundPool", rankEligibility.houseFundEligible ? "Eligible" : "Not Eligible", houseFundShare.toFixed(2)].join(","));

    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "percentage_income_summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="inline-block animate-pulse text-lg">Loading percentage income...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-start gap-4 mb-4">
        <h1 className="text-2xl font-semibold">Percentage Income — Royalty & Funds</h1>
        <div className="flex gap-2">
          <button onClick={() => window.location.reload()} className="px-3 py-2 rounded shadow-sm border text-sm">
            Refresh
          </button>
          <button onClick={exportCSV} className="px-3 py-2 rounded shadow-sm border text-sm">
            Export CSV
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-300 text-sm">{error}</div>}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded shadow-sm border">
          <div className="text-sm text-slate-500">User</div>
          <div className="text-xl font-bold">{profile.name} ({profile.uid})</div>
          <div className="text-xs mt-2 text-slate-500">Rank: <span className="font-semibold">{profile.rank || "-"}</span></div>
        </div>

        <div className="p-4 rounded shadow-sm border">
          <div className="text-sm text-slate-500">CTO BV</div>
          <div className="text-2xl font-bold">₹ {Number(network.ctoBV || 0).toLocaleString()}</div>
          <div className="text-xs mt-2 text-slate-500">Used for royalty calculations</div>
        </div>

        <div className="p-4 rounded shadow-sm border">
          <div className="text-sm text-slate-500">Estimated Royalty</div>
          <div className="text-2xl font-bold">₹ {royaltyAmount.toFixed(2)}</div>
          <div className="text-xs mt-2 text-slate-500">Rate: {(royaltyPercent * 100).toFixed(2)}%</div>
        </div>
      </section>

      <section className="mb-6 p-4 rounded shadow-sm border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Level Income (Levels 1–10)</h2>
          <div className="text-sm text-slate-500">Adjust percent (e.g. 0.005 for 0.5%)</div>
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
                <td className="p-2 border-t">₹ {totalLevelIncome.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded shadow-sm border">
          <h3 className="font-medium mb-2">Funds Summary (from Repurchase BV)</h3>
          <div className="text-sm mb-2">Repurchase BV: <span className="font-semibold">₹ {repurchaseBV.toLocaleString()}</span></div>
          <div className="text-sm">Car Fund (monthly 2%): <span className="font-semibold">₹ {carFundPool.toFixed(2)}</span></div>
          <div className="text-sm">House Fund (monthly 2%): <span className="font-semibold">₹ {houseFundPool.toFixed(2)}</span></div>

          <div className="mt-3 text-sm">
            Eligibility:
            <ul className="list-disc pl-5 mt-2">
              <li>Car Fund: Ruby Star & above — {rankEligibility.carFundEligible ? (<span className="font-semibold">Eligible</span>) : (<span className="text-slate-500">Not eligible</span>)}</li>
              <li>House Fund: Diamond Star & above — {rankEligibility.houseFundEligible ? (<span className="font-semibold">Eligible</span>) : (<span className="text-slate-500">Not eligible</span>)}</li>
            </ul>
          </div>
        </div>

        <div className="p-4 rounded shadow-sm border">
          <h3 className="font-medium mb-2">Developer Notes / Integration</h3>
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>Royalty rules and exact rank percentages must be authoritative server-side. This UI uses a default map for demo/testing.</li>
            <li>CTO BV snapshots should be provided by the backend (this component assumes <code>network.ctoBV</code> exists).</li>
            <li>Fund pools are calculated from <code>bvLedger.bvSummary.repurchaseBV</code>. Backend must expose exact pool allocation and user share logic.</li>
            <li>Server should run the continuous royalty distribution and fund distribution — UI only displays computed results for the current snapshot.</li>
            <li>If you want per-rank royalty percentages different from the UI defaults, send them from <code>/api/user/profile</code> or a config endpoint.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

PercentageIncome.propTypes = {
  apiBase: PropTypes.string,
};
