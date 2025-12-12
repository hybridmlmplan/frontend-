import React, { useEffect, useState } from "react";
import axios from "axios";

// NotificationsAdmin.jsx
// Admin page to manage notifications (templates, broadcast, scheduled)
// Features:
// - List notification templates / history with pagination and search
// - Create / Edit / Delete templates
// - Send notification (broadcast) to: all users / specific package holders / specific userIds
// - Schedule a notification (optional sendAt ISO string)
// - Export history to CSV
// - Uses Tailwind CSS and expects admin auth token in localStorage.key 'token'
// - Assumed backend endpoints (adjust if your backend differs):
//   GET  /api/admin/notifications?type=&q=&page=&limit=
//   POST /api/admin/notifications  (create template or schedule/send)
//   PUT  /api/admin/notifications/:id
//   DELETE /api/admin/notifications/:id
//   POST /api/admin/notifications/send   body: { templateId | title, message, target: { all|package|users }, packageName, userIds: [], sendAt }
//   GET  /api/admin/notifications/history?page=&limit=&q=

export default function NotificationsAdmin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(12);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // modal / form states
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", message: "", channels: { push: true, email: false, sms: false }, active: true });

  // send modal
  const [showSend, setShowSend] = useState(false);
  const [sendPayload, setSendPayload] = useState({ templateId: "", title: "", message: "", target: "all", packageName: "", userIds: "", sendAt: "" });

  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [page]);

  function getAuthHeaders() {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchList() {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams();
      if (query) qs.set("q", query);
      qs.set("page", page);
      qs.set("limit", perPage);
      const res = await axios.get(`/api/admin/notifications?${qs.toString()}`, { headers: getAuthHeaders() });
      if (!res.data || !res.data.status) throw new Error(res.data?.message || "Failed to load notifications");
      const d = res.data.data || {};
      setTemplates(d.docs || []);
      setTotal(d.total || 0);
    } catch (err) {
      console.error(err); setError(err.response?.data?.message || err.message || "Failed to fetch notifications");
    } finally { setLoading(false); }
  }

  function openCreate() { setEditing(null); setForm({ title: "", message: "", channels: { push: true, email: false, sms: false }, active: true }); setShowModal(true); }
  function openEdit(t) { setEditing(t); setForm({ title: t.title||"", message: t.message||"", channels: t.channels||{push:true}, active: !!t.active }); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditing(null); }

  async function saveTemplate(e) {
    e?.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return alert("Title and message required");
    setActionLoading(true);
    try {
      if (editing) {
        const res = await axios.put(`/api/admin/notifications/${editing._id||editing.id}`, form, { headers: getAuthHeaders() });
        if (res.data && res.data.status) { alert(res.data.message || "Updated"); closeModal(); fetchList(); }
        else throw new Error(res.data?.message||"Update failed");
      } else {
        const res = await axios.post(`/api/admin/notifications`, form, { headers: getAuthHeaders() });
        if (res.data && res.data.status) { alert(res.data.message || "Created"); closeModal(); fetchList(); }
        else throw new Error(res.data?.message||"Create failed");
      }
    } catch (err) { console.error(err); alert(err.response?.data?.message || err.message || "Save error"); }
    finally { setActionLoading(false); }
  }

  async function deleteTemplate(t) {
    if (!t) return; if (!window.confirm(`Delete template ${t.title}?`)) return;
    setActionLoading(true);
    try {
      const res = await axios.delete(`/api/admin/notifications/${t._id||t.id}`, { headers: getAuthHeaders() });
      if (res.data && res.data.status) { alert(res.data.message||"Deleted"); fetchList(); }
      else throw new Error(res.data?.message||"Delete failed");
    } catch (err) { console.error(err); alert(err.response?.data?.message || err.message || "Delete error"); }
    finally { setActionLoading(false); }
  }

  function openSend(t) {
    setSendPayload({ templateId: t?._id||"", title: t?.title||"", message: t?.message||"", target: "all", packageName: "", userIds: "", sendAt: "" });
    setShowSend(true);
  }
  function closeSend() { setShowSend(false); setSendPayload({ templateId: "", title: "", message: "", target: "all", packageName: "", userIds: "", sendAt: "" }); }

  async function sendNow(e) {
    e?.preventDefault();
    if (!sendPayload.templateId && (!sendPayload.title.trim() || !sendPayload.message.trim())) return alert("Provide template or title+message");
    // prepare body
    const body = {
      templateId: sendPayload.templateId || undefined,
      title: sendPayload.title,
      message: sendPayload.message,
      target: sendPayload.target, // all | package | users
      packageName: sendPayload.packageName || undefined,
      userIds: sendPayload.userIds ? sendPayload.userIds.split(/[,\s]+/).filter(Boolean) : undefined,
      sendAt: sendPayload.sendAt || undefined, // ISO datetime for schedule
    };
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/admin/notifications/send`, body, { headers: getAuthHeaders() });
      if (res.data && res.data.status) { alert(res.data.message || "Scheduled / Sent"); closeSend(); }
      else throw new Error(res.data?.message||"Send failed");
    } catch (err) { console.error(err); alert(err.response?.data?.message || err.message || "Send error"); }
    finally { setActionLoading(false); }
  }

  function exportCSV() {
    if (!templates || templates.length === 0) return alert("No templates to export");
    const header = ["Title","Message","Channels","Active","CreatedAt"];
    const rows = templates.map(t => [t.title||"-", (t.message||"").replace(/\n/g,' '), JSON.stringify(t.channels||{}), t.active?"Yes":"No", t.createdAt||"-"]);
    const csv = [header, ...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `notifications_templates_page_${page}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Notifications Admin</h1>
        <div className="flex gap-2">
          <button onClick={openCreate} className="px-3 py-2 bg-indigo-600 text-white rounded">Create Template</button>
          <button onClick={() => { fetchList(); }} className="px-3 py-2 border rounded">Refresh</button>
          <button onClick={exportCSV} className="px-3 py-2 border rounded">Export CSV</button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search title / message" className="w-full border rounded p-2" />
          </div>
          <div className="md:col-span-2 text-right text-sm text-gray-600">Page {page} / {totalPages}</div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded">
        {loading ? (
          <div className="p-6 text-center">Loading templates...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : templates && templates.length === 0 ? (
          <div className="p-6 text-center">No templates found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="p-3">Title</th>
                  <th className="p-3">Message</th>
                  <th className="p-3">Channels</th>
                  <th className="p-3">Active</th>
                  <th className="p-3">Created At</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(t => (
                  <tr key={t._id||t.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{t.title}</td>
                    <td className="p-3 text-sm">{(t.message||"-").slice(0,120)}{(t.message||"").length>120?"...":""}</td>
                    <td className="p-3 text-sm">{Object.keys(t.channels||{}).filter(k=>t.channels[k]).join(', ')}</td>
                    <td className="p-3 text-sm">{t.active? (<span className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 text-xs">Active</span>) : (<span className="inline-block px-2 py-1 rounded bg-red-100 text-red-800 text-xs">Non Active</span>)}</td>
                    <td className="p-3 text-sm">{t.createdAt? new Date(t.createdAt).toLocaleString('en-IN') : '-'}</td>
                    <td className="p-3 text-sm space-x-2">
                      <button onClick={()=>openEdit(t)} className="px-2 py-1 border rounded text-sm">Edit</button>
                      <button onClick={()=>openSend(t)} className="px-2 py-1 border rounded text-sm">Send</button>
                      <button onClick={()=>deleteTemplate(t)} className="px-2 py-1 border rounded text-sm text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Total: {total} templates</div>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={()=>setPage(s=>Math.max(1,s-1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <div className="px-3 py-1 border rounded">{page}</div>
            <button disabled={page>=totalPages} onClick={()=>setPage(s=>Math.min(totalPages,s+1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-2xl w-full bg-white rounded shadow p-4">
            <h2 className="text-lg font-medium mb-2">{editing? 'Edit Template' : 'Create Template'}</h2>
            <form onSubmit={saveTemplate} className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm">Title</label>
                <input value={form.title} onChange={(e)=>setForm(s=>({...s,title:e.target.value}))} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm">Message</label>
                <textarea value={form.message} onChange={(e)=>setForm(s=>({...s,message:e.target.value}))} className="mt-1 block w-full border rounded p-2" rows={6} />
              </div>
              <div className="flex gap-3 items-center">
                <label className="inline-flex items-center"><input type="checkbox" checked={form.channels.push} onChange={(e)=>setForm(s=>({...s,channels:{...s.channels,push:e.target.checked}}))} className="mr-2" /> Push</label>
                <label className="inline-flex items-center"><input type="checkbox" checked={form.channels.email} onChange={(e)=>setForm(s=>({...s,channels:{...s.channels,email:e.target.checked}}))} className="mr-2" /> Email</label>
                <label className="inline-flex items-center"><input type="checkbox" checked={form.channels.sms} onChange={(e)=>setForm(s=>({...s,channels:{...s.channels,sms:e.target.checked}}))} className="mr-2" /> SMS</label>
                <label className="inline-flex items-center ml-auto">Active<input type="checkbox" checked={form.active} onChange={(e)=>setForm(s=>({...s,active:e.target.checked}))} className="ml-2" /></label>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-indigo-600 text-white rounded">{actionLoading? 'Saving...':'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-2xl w-full bg-white rounded shadow p-4">
            <h2 className="text-lg font-medium mb-2">Send Notification</h2>
            <form onSubmit={sendNow} className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm">Use Template</label>
                <select value={sendPayload.templateId} onChange={(e)=>{ const t = templates.find(x=>x._id===e.target.value); setSendPayload(s=>({...s,templateId:e.target.value, title: t?.title||s.title, message: t?.message||s.message})); }} className="mt-1 block w-full border rounded p-2">
                  <option value="">-- none --</option>
                  {templates.map(t=> <option key={t._id} value={t._id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm">Title (override)</label>
                <input value={sendPayload.title} onChange={(e)=>setSendPayload(s=>({...s,title:e.target.value}))} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm">Message (override)</label>
                <textarea value={sendPayload.message} onChange={(e)=>setSendPayload(s=>({...s,message:e.target.value}))} className="mt-1 block w-full border rounded p-2" rows={5} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm">Target</label>
                  <select value={sendPayload.target} onChange={(e)=>setSendPayload(s=>({...s,target:e.target.value}))} className="mt-1 block w-full border rounded p-2">
                    <option value="all">All Users</option>
                    <option value="package">By Package</option>
                    <option value="users">Specific Users</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm">Package Name (if package)</label>
                  <input value={sendPayload.packageName} onChange={(e)=>setSendPayload(s=>({...s,packageName:e.target.value}))} className="mt-1 block w-full border rounded p-2" placeholder="Silver / Gold / Ruby" />
                </div>

                <div>
                  <label className="block text-sm">User IDs (comma separated)</label>
                  <input value={sendPayload.userIds} onChange={(e)=>setSendPayload(s=>({...s,userIds:e.target.value}))} className="mt-1 block w-full border rounded p-2" placeholder="user1,user2,user3" />
                </div>
              </div>

              <div>
                <label className="block text-sm">Schedule (optional)</label>
                <input type="datetime-local" value={sendPayload.sendAt} onChange={(e)=>setSendPayload(s=>({...s,sendAt:e.target.value}))} className="mt-1 block w-full border rounded p-2" />
                <div className="text-xs text-gray-500 mt-1">Leave empty to send immediately. Time is local browser time and backend should interpret correctly (prefer ISO).</div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeSend} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-indigo-600 text-white rounded">{actionLoading? 'Sending...':'Send'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-3">Note: Notifications can be push/email/sms depending on channels enabled in template. Backend must handle delivery, scheduling, and rate-limits. Use scheduling carefully.</div>
    </div>
  );
}
