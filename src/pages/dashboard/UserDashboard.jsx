// src/pages/dashboard/UserDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../../store";
import { SESSIONS, PACKAGES } from "../../constants";

/**
 * UserDashboard.jsx
 * Dashboard page for logged-in users showing key stats and quick actions.
 *
 * Depends on:
 *  - useStore() from src/store.js (actions: refreshDashboard, fetchIncomes, purchasePackage, activateEpin)
 *  - constants: SESSIONS, PACKAGES
 *
 * Paste into src/pages/dashboard/UserDashboard.jsx
 */

function formatCurrency(v) {
  const n = Number(v || 0);
  return `₹${n.toLocaleString("en-IN")}`;
}

function ProgressBar({ percent = 0, label }) {
  return (
    <div>
      <div className="flex justify-between mb-1 text-sm">
        <span className="text-sm">{label}</span>
        <span className="text-sm font-medium">{Math.round(percent)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
        <div style={{ width: `${percent}%` }} className="h-full bg-indigo-600"></div>
      </div>
    </div>
  );
}

function getCurrentSessionIndex() {
  const now = new Date();
  const minutes = (h, m) => h * 60 + m;
  const nMin = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < SESSIONS.length; i++) {
    const [sh, sm] = SESSIONS[i].start.split(":").map(Number);
    const [eh, em] = SESSIONS[i].end.split(":").map(Number);
    let sMin = minutes(sh, sm);
    let eMin = minutes(eh === 0 ? 24 : eh, em);
    if (nMin >= sMin && nMin < eMin) return i;
  }
  return null;
}

export default function UserDashboard() {
  const { state, actions } = useStore();
  const { user, dashboard, incomes, loading } = state;
  const navigate = useNavigate();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingIncomes, setLoadingIncomes] = useState(false);

  useEffect(() => {
    // on mount ensure dashboard & incomes present
    if (user) {
      actions.refreshDashboard().catch(() => {});
      actions.fetchIncomes().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleBuy = (pkgKey) => {
    // navigate to package page with preselect
    navigate("/package", { state: { packageKey: pkgKey } });
  };

  const handleActivateEpin = async () => {
    if (!user) return navigate("/login");
    const epin = window.prompt("Enter EPIN to activate package (cancel to abort):");
    if (!epin) return;
    try {
      setRefreshing(true);
      await actions.activateEpin(epin);
      await actions.refreshDashboard();
      actions.addNotification({ type: "success", message: "EPIN activated successfully" });
    } catch (err) {
      actions.addNotification({ type: "error", message: err?.message || "EPIN activation failed" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await actions.refreshDashboard();
      await actions.fetchIncomes();
    } catch (err) {
      actions.addNotification({ type: "error", message: err?.message || "Refresh failed" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshIncomes = async () => {
    setLoadingIncomes(true);
    try {
      await actions.fetchIncomes();
    } catch (err) {
      actions.addNotification({ type: "error", message: err?.message || "Failed to load incomes" });
    } finally {
      setLoadingIncomes(false);
    }
  };

  const sessionIndex = getCurrentSessionIndex();
  const sessionPercent = sessionIndex === null ? 0 : ((sessionIndex + 1) / SESSIONS.length) * 100;

  return (
    <div className="p-6 pt-24"> {/* pt-24 to accommodate fixed navbar height if any */}
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Welcome{user?.name ? `, ${user.name}` : ""}</h1>
            <p className="text-sm text-gray-500">Your account overview — quick actions & recent activity.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-500">Current Session</div>
              <div className="font-medium">{sessionIndex === null ? "Off session" : `#${sessionIndex + 1} — ${SESSIONS[sessionIndex].start} to ${SESSIONS[sessionIndex].end}`}</div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Pair Income</div>
            <div className="text-xl font-semibold">{formatCurrency(dashboard?.pairs || 0)}</div>
            <div className="text-xs text-gray-400 mt-1">Per your matched green pairs</div>
          </div>

          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Royalty</div>
            <div className="text-xl font-semibold">{formatCurrency(dashboard?.royalty || 0)}</div>
            <div className="text-xs text-gray-400 mt-1">Royalty from BV (Silver ranks)</div>
          </div>

          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Level Income</div>
            <div className="text-xl font-semibold">{formatCurrency(dashboard?.levelIncome || 0)}</div>
            <div className="text-xs text-gray-400 mt-1">Level BV bonuses</div>
          </div>

          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Wallet</div>
            <div className="text-xl font-semibold">{formatCurrency(dashboard?.wallet || 0)}</div>
            <div className="text-xs text-gray-400 mt-1">Available for withdrawal</div>
          </div>
        </div>

        {/* Session progress & PV/BV */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-4 bg-white rounded shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Session Progress</h3>
              <div className="text-sm text-gray-500">{sessionIndex === null ? "No active session" : `Session ${sessionIndex + 1} of ${SESSIONS.length}`}</div>
            </div>

            <ProgressBar percent={sessionPercent} label="Today session progress" />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">PV (Today)</div>
                <div className="font-semibold text-gray-800">{dashboard?.pv ?? 0}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">BV (Today)</div>
                <div className="font-semibold text-gray-800">{dashboard?.bv ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Quick actions & package */}
          <div className="p-4 bg-white rounded shadow">
            <h3 className="text-lg font-medium mb-3">Quick Actions</h3>

            <div className="space-y-3">
              <button
                onClick={() => handleBuy("Silver")}
                className="w-full px-3 py-2 bg-yellow-400 rounded text-sm font-medium hover:bg-yellow-500"
              >
                Buy Silver — {formatCurrency(PACKAGES.SILVER.price)}
              </button>

              <button
                onClick={() => handleBuy("Gold")}
                className="w-full px-3 py-2 bg-amber-600 rounded text-sm font-medium text-white hover:bg-amber-700"
              >
                Buy Gold — {formatCurrency(PACKAGES.GOLD.price)}
              </button>

              <button
                onClick={() => handleBuy("Ruby")}
                className="w-full px-3 py-2 bg-red-600 rounded text-sm font-medium text-white hover:bg-red-700"
              >
                Buy Ruby — {formatCurrency(PACKAGES.RUBY.price)}
              </button>

              <button
                onClick={handleActivateEpin}
                disabled={refreshing}
                className="w-full px-3 py-2 border rounded text-sm hover:bg-gray-50"
              >
                {refreshing ? "Processing..." : "Activate EPIN"}
              </button>

              <Link to="/genealogy" className="block text-center px-3 py-2 border rounded text-sm hover:bg-gray-50">
                View Genealogy
              </Link>

              <Link to="/dashboard/notifications" className="block text-center px-3 py-2 border rounded text-sm hover:bg-gray-50">
                View Notifications
              </Link>
            </div>
          </div>
        </div>

        {/* Recent incomes */}
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium">Recent Incomes</h3>
            <div className="flex items-center gap-2">
              <button onClick={handleRefreshIncomes} className="px-3 py-1 text-sm bg-gray-100 rounded">
                {loadingIncomes ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {Array.isArray(state.incomes) && state.incomes.length > 0 ? (
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Type</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {state.incomes.slice(0, 10).map((inc, idx) => (
                    <tr key={inc.id || idx} className="border-b">
                      <td className="py-2">{inc.type || inc.category || "Income"}</td>
                      <td>{formatCurrency(inc.amount || inc.value || 0)}</td>
                      <td className="text-xs text-gray-500">{inc.date || inc.createdAt || inc.timestamp || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">No incomes recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
