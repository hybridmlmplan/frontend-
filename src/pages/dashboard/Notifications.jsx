// src/pages/dashboard/Notifications.jsx
import React, { useEffect, useState } from "react";
import { useStore } from "../../store";
import api from "../../api/axiosConfig";
import { formatDistanceToNowStrict, parseISO } from "date-fns";

/**
 * Notifications Page (Dashboard)
 *
 * Features:
 * - Shows notifications from the central store (state.notifications)
 * - Can fetch server notifications (GET /user/notifications) and add to store
 * - Mark a single notification as read (POST /user/notifications/:id/read)
 * - Mark all as read (POST /user/notifications/mark-read)
 * - Simple UI with filters (All / Unread)
 *
 * Note:
 * - Backend endpoints used: /user/notifications, /user/notifications/:id/read, /user/notifications/mark-read
 * - If your backend uses different routes, change the api calls accordingly.
 *
 * Paste this file to: src/pages/dashboard/Notifications.jsx
 */

export default function Notifications() {
  const { state, actions } = useStore();
  const notifications = state.notifications || [];
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Local copy to allow optimistic UI while re-syncing from server
  const [localListVersion, setLocalListVersion] = useState(0);

  useEffect(() => {
    // nothing automatic here — rely on store bootstrap,
    // but we can auto-sync once on mount to get server notifications
    syncFromServer().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function filterList(list) {
    if (filter === "all") return list;
    return list.filter((n) => !n.read);
  }

  async function syncFromServer() {
    setSyncing(true);
    setError(null);
    try {
      const data = await api.get("/user/notifications");
      // Expecting an array of notifications: [{ id, type, message, read, createdAt }, ...]
      if (Array.isArray(data?.data || data)) {
        const items = data.data || data;
        // Add each notification to client store using store action (avoid duplicates by id)
        const existingIds = new Set((state.notifications || []).map((n) => n.id));
        for (const it of items) {
          if (!existingIds.has(it.id)) {
            // store expects { id, type, message, date/read }
            actions.addNotification({
              id: it.id,
              type: it.type || "info",
              message: it.message || it.title || "Notification",
            });
          }
        }
        // bump local version to re-render summary UI if needed
        setLocalListVersion((v) => v + 1);
      }
    } catch (err) {
      console.error("Failed to sync notifications", err);
      setError(err?.message || "Failed to fetch notifications");
    } finally {
      setSyncing(false);
    }
  }

  async function markAsRead(id) {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/user/notifications/${encodeURIComponent(id)}/read`);
      // best-effort: re-sync from server to refresh local store
      await syncFromServer();
    } catch (err) {
      setError(err?.message || "Failed to mark as read");
    } finally {
      setLoading(false);
    }
  }

  async function markAllAsRead() {
    if (!window.confirm("Mark all notifications as read?")) return;
    setLoading(true);
    setError(null);
    try {
      await api.post("/user/notifications/mark-read");
      await syncFromServer();
    } catch (err) {
      setError(err?.message || "Failed to mark all as read");
    } finally {
      setLoading(false);
    }
  }

  // friendly timestamp
  function timeAgo(item) {
    try {
      const iso = item.date || item.createdAt || item.timestamp || new Date().toISOString();
      const parsed = typeof iso === "string" ? parseISO(iso) : new Date(iso);
      return formatDistanceToNowStrict(parsed, { addSuffix: true });
    } catch {
      return "";
    }
  }

  const list = filterList(notifications);

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Notifications</h2>
            <p className="text-sm text-gray-500">Important alerts about your account, pairs, EPINs and payouts.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-600 mr-2">
              Total: <span className="font-semibold">{notifications.length}</span>
            </div>

            <div className="flex rounded-md border overflow-hidden">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-sm ${filter === "all" ? "bg-indigo-600 text-white" : "bg-white text-gray-700"}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-1 text-sm ${filter === "unread" ? "bg-indigo-600 text-white" : "bg-white text-gray-700"}`}
              >
                Unread
              </button>
            </div>

            <button
              onClick={() => syncFromServer()}
              disabled={syncing}
              className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
            >
              {syncing ? "Syncing..." : "Sync"}
            </button>

            <button
              onClick={markAllAsRead}
              disabled={loading}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              {loading ? "Processing..." : "Mark all read"}
            </button>
          </div>
        </div>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        <div className="bg-white border rounded shadow-sm">
          {list.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No notifications to show.
              <div className="mt-3">
                <button onClick={() => syncFromServer()} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">
                  Fetch from server
                </button>
              </div>
            </div>
          ) : (
            <ul>
              {list
                .slice()
                .sort((a, b) => {
                  // sort by date desc if available
                  const da = new Date(a.date || a.createdAt || Date.now()).getTime();
                  const db = new Date(b.date || b.createdAt || Date.now()).getTime();
                  return db - da;
                })
                .map((n) => (
                  <li key={n.id || `${n.message}-${Math.random()}`} className="border-b last:border-b-0">
                    <div className="flex items-start gap-3 p-4">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                            n.type === "error" ? "bg-red-500" : n.type === "success" ? "bg-green-500" : "bg-indigo-500"
                          }`}
                        >
                          {n.type === "error" ? "!" : n.type === "success" ? "✓" : "i"}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className={`text-sm font-medium ${n.read ? "text-gray-500" : "text-gray-900"}`}>{n.message}</div>
                            {n.extra && <div className="text-xs text-gray-500 mt-1">{n.extra}</div>}
                          </div>

                          <div className="text-right text-xs">
                            <div className="text-gray-400">{timeAgo(n)}</div>
                            {!n.read ? <div className="text-xs text-yellow-600">Unread</div> : <div className="text-xs text-green-600">Read</div>}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            Mark as read
                          </button>

                          <button
                            onClick={() => {
                              // quick copy message
                              navigator.clipboard?.writeText(n.message || "");
                              actions.addNotification({ type: "info", message: "Notification text copied to clipboard" });
                            }}
                            className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-700 hover:bg-gray-100"
                          >
                            Copy
                          </button>

                          <button
                            onClick={async () => {
                              if (!window.confirm("Delete this notification?")) return;
                              try {
                                await api.post(`/user/notifications/${encodeURIComponent(n.id)}/delete`);
                                await syncFromServer();
                              } catch (err) {
                                setError(err?.message || "Delete failed");
                              }
                            }}
                            className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
