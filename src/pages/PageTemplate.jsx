// src/pages/PageTemplate.jsx
import React, { useEffect, useState } from "react";

/**
 * PageTemplate.jsx
 * A reusable admin/user page template for the Hybrid MLM plan.
 * - Shows session clock, package cards (Silver/Gold/Ruby), royalty summary, and a generic table.
 * - Fetches data from placeholder API endpoints. Replace with real endpoints as needed.
 *
 * Usage: import PageTemplate from "src/pages/PageTemplate.jsx" and render in router.
 */

/* -------------------------
   Small helper components
   ------------------------- */

function SessionClock({ sessions = [] }) {
  // sessions: [{ id, start: "06:00", end: "08:15", label }]
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // find current session index
  const currentIndex = sessions.findIndex((s) => {
    // compare times (HH:MM)
    const [sh, sm] = s.start.split(":").map(Number);
    const [eh, em] = s.end.split(":").map(Number);
    const start = new Date(now);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(now);
    end.setHours(eh, em, 0, 0);
    // handle midnight-crossing (if end <= start)
    if (end <= start) end.setDate(end.getDate() + 1);
    return now >= start && now <= end;
  });

  const active = sessions[currentIndex] || null;

  // helper to format remaining time
  function remaining(endTimeStr) {
    if (!endTimeStr) return "00:00:00";
    const [eh, em] = endTimeStr.split(":").map(Number);
    const end = new Date(now);
    end.setHours(eh, em, 0, 0);
    if (end <= now) end.setDate(end.getDate() + 1);
    const diff = Math.max(0, end - now);
    const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
    const m = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
    const s = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  return (
    <div className="card session-clock">
      <div className="left">
        <div className="session-label">
          {active ? `Current Session: ${active.label}` : "Next Session"}
        </div>
        <div className="session-time text-muted">
          {active ? `${active.start} — ${active.end}` : (sessions[0] ? `${sessions[0].start} — ${sessions[0].end}` : "")}
        </div>
      </div>
      <div className="right flex items-center gap-4">
        <div>
          <div className="digit text-strong">{active ? remaining(active.end) : "00:00:00"}</div>
          <div className="text-muted small mt-1">Time remaining</div>
        </div>
        <div className="pill text-muted">Sessions / day: {sessions.length}</div>
      </div>
    </div>
  );
}

function PackageCard({ pkg }) {
  // pkg: { key: "silver", title, price, pv, pairIncome, colorClass }
  const colorBadge =
    pkg.key === "silver" ? "badge-silver" : pkg.key === "gold" ? "badge-gold" : "badge-ruby";
  return (
    <div className="card package-card">
      <div className="package-left">
        <div>
          <div className="kicker">{pkg.title}</div>
          <div className="title mt-1">₹{pkg.price} • {pkg.pv} PV</div>
          <div className="small text-muted mt-1">Pair income: ₹{pkg.pairIncome} | Capping: 1 pair/session</div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className={`badge ${colorBadge}`}>{pkg.title}</div>
        <button className="btn btn-primary mt-2">Activate (EPIN)</button>
      </div>
    </div>
  );
}

function RankRow({ rank }) {
  // rank: {name, income}
  return (
    <div className="rank-row mb-2">
      <div>
        <div className="cell-strong">{rank.name}</div>
        <div className="cell-muted small">{rank.tier}</div>
      </div>
      <div className="text-strong">₹{rank.income}</div>
    </div>
  );
}

function DataTable({ columns = [], rows = [] }) {
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------
   PageTemplate main component
   ------------------------- */

export default function PageTemplate() {
  const [sessions, setSessions] = useState([
    // default 8 sessions (from your plan)
    { id: 1, label: "Session 1", start: "06:00", end: "08:15" },
    { id: 2, label: "Session 2", start: "08:15", end: "10:30" },
    { id: 3, label: "Session 3", start: "10:30", end: "12:45" },
    { id: 4, label: "Session 4", start: "12:45", end: "15:00" },
    { id: 5, label: "Session 5", start: "15:00", end: "17:15" },
    { id: 6, label: "Session 6", start: "17:15", end: "19:30" },
    { id: 7, label: "Session 7", start: "19:30", end: "21:45" },
    { id: 8, label: "Session 8", start: "21:45", end: "00:00" },
  ]);

  const [packages, setPackages] = useState([
    { key: "silver", title: "Silver", price: 35, pv: 35, pairIncome: 10 },
    { key: "gold", title: "Gold", price: 155, pv: 155, pairIncome: 50 },
    { key: "ruby", title: "Ruby", price: 1250, pv: 1250, pairIncome: 500 },
  ]);

  const [royalty, setRoyalty] = useState({
    monthlyRelease: true,
    cumulative: true,
    details: [
      { name: "Star", tier: "Joining", pct: 3, note: "3% until ₹35 refund" },
      { name: "Silver Star", tier: "Silver", pct: 1 },
      { name: "Gold Star", tier: "Gold", pct: 2 },
      // ... add rest as needed
    ],
  });

  const [recentPairs, setRecentPairs] = useState([]);
  const [loading, setLoading] = useState(false);

  // example fetch functions: replace endpoints with real ones
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Example: fetch sessions (if backend provides dynamic session config)
        // const resSessions = await fetch("/api/sessions");
        // if (resSessions.ok) setSessions(await resSessions.json());

        // Example: fetch recent pair events for table
        // const resPairs = await fetch("/api/pairs/recent");
        // if (resPairs.ok) setRecentPairs(await resPairs.json());

        // For now use mocked recentPairs:
        setRecentPairs([
          { id: "P-001", user: "U1001", package: "Silver", side: "Left", amount: 35, state: "RED" },
          { id: "P-002", user: "U1002", package: "Gold", side: "Right", amount: 155, state: "GREEN" },
        ]);
      } catch (err) {
        console.error("fetch error", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const columns = [
    { key: "id", title: "Pair ID" },
    { key: "user", title: "User" },
    { key: "package", title: "Package" },
    { key: "amount", title: "Amount" },
    {
      key: "state",
      title: "State",
      render: (r) => (
        <span className={`badge ${r.state === "GREEN" ? "badge-green" : "badge-red"}`}>{r.state}</span>
      ),
    },
  ];

  return (
    <div className="container">
      <div className="grid-3 mb-4">
        {/* Page header card */}
        <div className="card">
          <div className="title">Hybrid MLM Dashboard</div>
          <div className="subtitle mt-1">PV = Binary, BV = Other incomes (Royalty / Rank / Funds)</div>

          <div className="mt-3">
            <div className="kicker">Daily Sessions</div>
            <div className="text-muted small mt-1">8 sessions — each 2h 15m (capping applies)</div>
            <div className="mt-2">
              <SessionClock sessions={sessions} />
            </div>
          </div>
        </div>

        {/* Packages card */}
        <div className="card">
          <div className="title">Packages</div>
          <div className="subtitle mt-1">One-time purchase. Activate via EPIN.</div>

          <div className="mt-3 flex flex-col gap-3">
            {packages.map((p) => (
              <PackageCard key={p.key} pkg={p} />
            ))}
          </div>
        </div>

        {/* Royalty / Rank summary */}
        <div className="card">
          <div className="title">Royalty (Monthly)</div>
          <div className="subtitle mt-1">Cumulative & lifetime (as per plan)</div>
          <div className="mt-3">
            <div className="small text-muted">Notes:</div>
            <ul className="mt-2 small text-muted">
              <li>Star joining: 3% until ₹35 refund is cleared.</li>
              <li>Other ranks get cumulative royalty monthly (1% to 8% as configured).</li>
            </ul>

            <div className="mt-3">
              {royalty.details.map((r) => (
                <RankRow key={r.name} rank={{ name: r.name, income: `${r.pct}%`, tier: r.tier || "" }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Middle section: recent pairs and stats */}
      <div className="grid-2 mb-4">
        <div>
          <div className="card">
            <div className="title">Recent Pair Events</div>
            <div className="subtitle mt-1">Latest red/green pair changes</div>
            <div className="mt-3">
              {loading ? (
                <div className="inline-loader">
                  <div className="loader" /> <div className="text-muted small">Loading...</div>
                </div>
              ) : (
                <DataTable columns={columns} rows={recentPairs} />
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="title">Quick Actions</div>
            <div className="subtitle mt-1">Admin tools</div>

            <div className="mt-3 flex flex-col gap-3">
              <button className="btn btn-primary">Run Session Engine</button>
              <button className="btn btn-ghost">Generate EPIN</button>
              <button className="btn btn-ghost">Distribute Royalty</button>
              <div className="alert alert-warning mt-2">
                <div className="kicker">Reminder</div>
                <div className="small text-muted">Make sure to run session engine after each session window closes.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer area: more tables / graphs */}
      <div className="card mb-4">
        <div className="title">System Summary</div>
        <div className="subtitle mt-1">Quick metrics</div>
        <div className="grid-3 mt-3">
          <div className="card">
            <div className="kicker">Daily Max Pairs</div>
            <div className="title mt-1">Silver 8 | Gold 8 | Ruby 8</div>
            <div className="small text-muted mt-2">1 pair per package per session</div>
          </div>

          <div className="card">
            <div className="kicker">Binary Core</div>
            <div className="title mt-1">Red → Green cycle</div>
            <div className="small text-muted mt-2">Pairs start RED and turn GREEN when opposite leg matches.</div>
          </div>

          <div className="card">
            <div className="kicker">EPIN System</div>
            <div className="title mt-1">Token ON / OFF</div>
            <div className="small text-muted mt-2">Unlimited epin transfer, no expiry</div>
          </div>
        </div>
      </div>
    </div>
  );
}
