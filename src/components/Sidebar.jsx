// src/components/Sidebar.jsx
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../store";

/**
 * Sidebar component for Hybrid MLM frontend
 * - Responsive (collapsible on small screens)
 * - Shows user info, package status, quick actions
 * - Role-aware links (admin / franchise)
 *
 * Usage: place inside main layout next to page content.
 */
export default function Sidebar() {
  const { state, actions } = useStore();
  const { user, dashboard } = state;
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [processingEpin, setProcessingEpin] = useState(false);

  const activePath = (path) => location.pathname.startsWith(path);

  const handleActivateEpin = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    const epin = window.prompt("Enter EPIN to activate package (leave blank to cancel):");
    if (!epin) return;
    setProcessingEpin(true);
    try {
      await actions.activateEpin(epin);
      actions.addNotification({ type: "success", message: "EPIN activated successfully." });
    } catch (err) {
      actions.addNotification({ type: "error", message: err?.message || "EPIN activation failed." });
    } finally {
      setProcessingEpin(false);
    }
  };

  const quickPurchase = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate("/package");
  };

  const goProfile = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate("/profile");
  };

  return (
    <aside className={`bg-white border-r h-screen sticky top-0 z-40 w-64 transition-all ${collapsed ? "w-20" : "w-64"}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="logo" className="w-10 h-10 rounded-full" />
            {!collapsed && (
              <div>
                <div className="font-semibold text-gray-800">Hybrid MLM</div>
                <div className="text-xs text-gray-500">Binary · Royalty · EPIN</div>
              </div>
            )}
          </div>

          <button
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed((s) => !s)}
            className="text-gray-600 hover:text-gray-900 p-1"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        {/* User panel */}
        <div className="p-4 border-b">
          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.avatar || "/avatar.png"} alt="avatar" className="w-12 h-12 rounded-full border" />
              {!collapsed && (
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">{user.name || user.id || "User"}</div>
                  <div className="text-xs text-gray-500">ID: {user.id || user.sponsorId || "-"}</div>
                  <div className="text-xs mt-1">
                    Package:{" "}
                    <span className="font-medium text-indigo-600">
                      {user.package ? user.package : "No Active"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <div>Not signed in</div>
              {!collapsed && <div className="text-xs mt-1">Login to access dashboard & purchases</div>}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto p-2">
          <ul className="space-y-1">
            <li>
              <Link
                to="/dashboard"
                className={`block px-3 py-2 rounded-md text-sm ${activePath("/dashboard") ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                Dashboard
              </Link>
            </li>

            <li>
              <Link
                to="/package"
                className={`block px-3 py-2 rounded-md text-sm ${activePath("/package") ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                Packages & Purchase
              </Link>
            </li>

            <li>
              <Link
                to="/epin"
                className={`block px-3 py-2 rounded-md text-sm ${activePath("/epin") ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                EPIN Management
              </Link>
            </li>

            <li>
              <Link
                to="/genealogy"
                className={`block px-3 py-2 rounded-md text-sm ${activePath("/genealogy") ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                Genealogy
              </Link>
            </li>

            <li>
              <Link
                to="/income"
                className={`block px-3 py-2 rounded-md text-sm ${activePath("/income") ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                Income Ledger
              </Link>
            </li>

            <li>
              <Link
                to="/wallet"
                className={`block px-3 py-2 rounded-md text-sm ${activePath("/wallet") ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                Wallet
              </Link>
            </li>

            {/* Role based */}
            {user?.role === "admin" && (
              <li>
                <Link to="/admin" className="block px-3 py-2 rounded-md text-sm text-red-700 bg-red-50">
                  Admin Panel
                </Link>
              </li>
            )}

            {user?.role === "franchise" && (
              <li>
                <Link to="/franchise" className="block px-3 py-2 rounded-md text-sm text-green-700 bg-green-50">
                  Franchise Panel
                </Link>
              </li>
            )}
          </ul>

          {/* Quick actions */}
          <div className="mt-4 px-2">
            <div className="text-xs text-gray-500 px-2 mb-2">Quick Actions</div>
            <div className="flex flex-col gap-2">
              <button
                onClick={quickPurchase}
                className="w-full text-left px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                title="Buy package"
              >
                Buy Package
              </button>

              <button
                onClick={handleActivateEpin}
                disabled={processingEpin}
                className="w-full text-left px-3 py-2 rounded-md bg-yellow-500 text-sm hover:bg-yellow-600"
                title="Activate EPIN"
              >
                {processingEpin ? "Activating EPIN..." : "Activate EPIN"}
              </button>

              <button
                onClick={goProfile}
                className="w-full text-left px-3 py-2 rounded-md border text-sm hover:bg-gray-50"
              >
                Profile
              </button>
            </div>
          </div>

          {/* Dashboard summary */}
          <div className="mt-6 px-2">
            <div className="text-xs text-gray-500 px-2 mb-2">Summary</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="text-xs text-gray-500">Pairs</div>
                <div className="font-semibold text-gray-800">{dashboard?.pairs ?? 0}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="text-xs text-gray-500">Wallet</div>
                <div className="font-semibold text-gray-800">₹{dashboard?.wallet ?? 0}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="text-xs text-gray-500">PV</div>
                <div className="font-semibold text-gray-800">{dashboard?.pv ?? 0}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="text-xs text-gray-500">BV</div>
                <div className="font-semibold text-gray-800">{dashboard?.bv ?? 0}</div>
              </div>
            </div>
          </div>
        </nav>

        {/* Footer (logout) */}
        <div className="p-4 border-t">
          {user ? (
            <div className="flex gap-2">
              <button
                onClick={() => actions.logout()}
                className="flex-1 px-3 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Sign Out
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(user?.id || "");
                  actions.addNotification({ type: "info", message: "User ID copied to clipboard" });
                }}
                className="px-3 py-2 rounded-md border text-sm"
                title="Copy ID"
              >
                Copy ID
              </button>
            </div>
          ) : (
            <div className="text-xs text-gray-500">Please login to access features</div>
          )}
        </div>
      </div>
    </aside>
  );
}
