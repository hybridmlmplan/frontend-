// src/pages/income/DailyClosingView.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { useStore } from "../../store";

/**
 * DailyClosingView.jsx
 * Shows daily session-wise closing (8 sessions) and totals.
 *
 * Backend endpoint expected:
 *  GET /income/daily-closing?date=YYYY-MM-DD
 *
 * Copy-paste ready. Tailwind CSS.
 */

const SESSION_LABELS = [
  "06:00 – 08:15",
  "08:15 – 10:30",
  "10:30 – 12:45",
  "12:45 – 15:00",
  "15:00 – 17:15",
  "17:15 – 19:30",
  "19:30 – 21:45",
  "21:45 – 00:00",
];

function toISODateLocal(d = new Date()) {
  const tzOffset = d.getTimezoneOffset() * 60000;
  const localISOTime = new Date(d - tzOffset).toISOString().slice(0, 10);
  return localISOTime;
}

export default function DailyClosingView() {
  const { actions } = useStore();

  const [date, setDate] = useState(() => toISODateLocal(new Date()));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ sessions: [], totals: {} });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDailyClosing(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function fetchDailyClosing(d) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/income/daily-closing", { params: { date: d } });
      const payload = res.data || res;
      if (payload?.status === false) {
        throw new Error(payload?.message || "Failed to load data");
      }
      // Normalize: ensure sessions array length 8
      const sessions = (payload.sessions || []).slice(0, 8);
      // fill missing sessions with zeros and labels
      const filled = SESSION_LABELS.map((label, i) => {
        const s = sessions[i] || {};
        return {
          sessionId: s.sessionId ?? i + 1,
          label,
          pairsCount: s.pairsCount ?? 0,
          paidPairs: s.paidPairs ?? 0,
          pendingPairs: s.pendingPairs ?? ( (s.pairsCount ?? 0) - (s.paidPairs ?? 0) ),
          pv: s.pv ?? 0,
          bv: s.bv ?? 0,
          amountPaid: s.amountPaid ?? 0,
          breakdown: s.breakdown ?? null,
        };
      });

      const totals = payload.totals || filled.reduce((acc, s) => {
        acc.pairs = (acc.pairs || 0) + (s.pairsCount || 0);
        acc.paidPairs = (acc.paidPairs || 0) + (s.paidPairs || 0);
        acc.pendingPairs = (acc.pendingPairs || 0) + (s.pendingPairs || 0);
        acc.pv = (acc.pv || 0) + (s.pv || 0);
        acc.bv = (acc.bv || 0) + (s.bv || 0);
        acc.amountPaid = (acc.amountPaid || 0) + (s.amountPaid || 0);
        return acc;
      }, {});

      setData({ sessions: filled, totals });
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Unable to fetch daily closing";
      setError(msg);
      actions.addNotification({ type: "error", message: msg });
      setData({ sessions: [], totals: {} });
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const rows = [];
    rows.push(["Date", date]);
    rows.push([]);
    rows.push(["Session", "Pairs", "Paid Pairs", "Pending Pairs", "PV", "BV", "Amount Paid"]);
    data.sessions.forEach((s) => {
      rows.push([s.label, s.pairsCount, s.paidPairs, s.pendingPairs, s.pv, s.bv, s.amountPaid]);
    });
    rows.push([]);
    rows.push(["Totals", data.totals.pairs || 0, data.totals.paidPairs || 0, data.totals.pendingPairs || 0, data.totals.pv || 0, data.totals.bv || 0, data.totals.amountPaid || 0]);

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily_closing_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function fmt(v) {
    return Number(v || 0).toLocaleString("en-IN");
  }

  return (
    <div className="p-6 pt-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Daily Closing View</h1>
            <p className="text-sm text-gray-500">Session-wise closing summary (8 sessions). Choose date to view.</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border px-3 py-2 rounded"
            />
            <button onClick={() => fetchDailyClosing(date)} className="px-3 py-2 border rounded">Refresh</button>
            <button onClick={exportCsv} className="px-3 py-2 bg-green-600 text-white rounded">Export CSV</button>
          </div>
        </header>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="bg-white rounded shadow p-4">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="text-lg font-semibold mt-1">{date}</div>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500">Total Pairs</div>
                  <div className="text-lg font-semibold mt-1">{fmt(data.totals.pairs)}</div>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500">Paid Pairs</div>
                  <div className="text-lg font-semibold mt-1">{fmt(data.totals.paidPairs)}</div>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500">Amount Paid</div>
                  <div className="text-lg font-semibold mt-1">₹{fmt(data.totals.amountPaid)}</div>
                </div>
              </div>

              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2">Session</th>
                      <th className="py-2">Pairs</th>
                      <th className="py-2">Paid</th>
                      <th className="py-2">Pending</th>
                      <th className="py-2">PV</th>
                      <th className="py-2">BV</th>
                      <th className="py-2">Amount Paid</th>
                      <th className="py-2">Breakdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sessions.map((s) => (
                      <tr key={s.sessionId} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">{s.label}</td>
                        <td className="py-2">{fmt(s.pairsCount)}</td>
                        <td className="py-2 text-green-700">{fmt(s.paidPairs)}</td>
                        <td className="py-2 text-yellow-700">{fmt(s.pendingPairs)}</td>
                        <td className="py-2">{fmt(s.pv)}</td>
                        <td className="py-2">{fmt(s.bv)}</td>
                        <td className="py-2">₹{fmt(s.amountPaid)}</td>
                        <td className="py-2">
                          {s.breakdown ? (
                            <div className="text-xs text-gray-700">
                              {Object.entries(s.breakdown).map(([pkg, info]) => (
                                <div key={pkg}>
                                  <span className="font-medium capitalize">{pkg}</span>: {info.pairs ?? 0} pairs / ₹{fmt(info.amount ?? 0)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">—</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
