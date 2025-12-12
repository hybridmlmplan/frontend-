import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Download, Save, Upload } from "lucide-react";

/**
 * Admin — Settings Page
 * ---------------------
 * Single-file admin settings editor for your hybrid MLM plan.
 * Provides controls for:
 *  - General site settings (siteName, contact)
 *  - Package config references (silver/gold/ruby PV & pair income)
 *  - Session engine options (enable/disable auto engine, session timings)
 *  - 29-Feb full shutdown toggle
 *  - EPIN/token mode (on/off)
 *  - Bank/payment settings
 *  - Import / Export JSON config
 *
 * Expected endpoints:
 *  GET  /api/admin/settings    -> returns settings object
 *  PATCH /api/admin/settings   -> accepts full settings object (or partial)
 *  POST  /api/admin/settings/import -> optional import
 */

const defaultSettings = {
  siteName: "Hybrid MLM",
  contactEmail: "support@example.com",
  contactPhone: "",
  maintenanceMode: false,
  epinTokenMode: "on", // on | off
  shutdownOnFeb29: true,
  packages: {
    silver: { price: 35, pv: 35, pairIncome: 10, capping: 1 },
    gold: { price: 155, pv: 155, pairIncome: 50, capping: 1 },
    ruby: { price: 1250, pv: 1250, pairIncome: 500, capping: 1 },
  },
  sessions: {
    perDay: 8,
    lengthMinutes: 135, // 2h15m = 135 minutes
    timings: [
      "06:00-08:15",
      "08:15-10:30",
      "10:30-12:45",
      "12:45-15:00",
      "15:00-17:15",
      "17:15-19:30",
      "19:30-21:45",
      "21:45-00:00",
    ],
  },
  autoEngine: true,
  contact: {
    address: "",
    bank: {
      accountName: "",
      accountNumber: "",
      ifsc: "",
      bankName: "",
    },
  },
  notes: "Core settings for the Hybrid MLM system",
};

function getAuthHeaders() {
  const token = localStorage.getItem("token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importText, setImportText] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/settings", { headers: getAuthHeaders() });
      if (data && typeof data === "object") setSettings((s) => ({ ...s, ...data }));
    } catch (err) {
      console.error("fetchSettings", err?.response || err);
      // keep defaults
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      await axios.patch("/api/admin/settings", settings, { headers: getAuthHeaders() });
      await fetchSettings();
      alert("Settings saved successfully");
    } catch (err) {
      console.error("saveSettings", err?.response || err);
      alert("Save failed. Check console for details.");
    } finally {
      setSaving(false);
    }
  }

  async function importSettings() {
    try {
      const parsed = JSON.parse(importText);
      await axios.post("/api/admin/settings/import", { settings: parsed }, { headers: getAuthHeaders() });
      setImportText("");
      await fetchSettings();
      alert("Import successful");
    } catch (err) {
      console.error("importSettings", err?.response || err);
      alert("Import failed: invalid JSON or server error. Check console.");
    }
  }

  function exportSettings() {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settings_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6 flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Admin — Settings</h1>
        <div className="flex gap-2">
          <Button onClick={fetchSettings} disabled={loading}><Download className="mr-2 h-4 w-4 inline" /> Reload</Button>
          <Button onClick={exportSettings}><Download className="mr-2 h-4 w-4 inline" /> Export</Button>
          <Button onClick={saveSettings} disabled={saving}><Save className="mr-2 h-4 w-4 inline" /> Save</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>General</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              <Input value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} placeholder="Site Name" />
              <Input value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} placeholder="Support Email" />
              <Input value={settings.contactPhone} onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })} placeholder="Support Phone" />
              <Textarea value={settings.contact.address} onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, address: e.target.value } })} placeholder="Address" />
              <div className="flex items-center gap-3">
                <label className="text-sm">Maintenance Mode</label>
                <Switch checked={settings.maintenanceMode} onCheckedChange={(v) => setSettings({ ...settings, maintenanceMode: !!v })} />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm">EPIN / Token Mode</label>
                <Select value={settings.epinTokenMode} onChange={(e) => setSettings({ ...settings, epinTokenMode: e.target.value })}>
                  <option value="on">Token ON (Live)</option>
                  <option value="off">Token OFF (Testing)</option>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm">Shutdown on Feb 29</label>
                <Switch checked={!!settings.shutdownOnFeb29} onCheckedChange={(v) => setSettings({ ...settings, shutdownOnFeb29: !!v })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bank / Payment</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              <Input value={settings.contact.bank.accountName} onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, bank: { ...settings.contact.bank, accountName: e.target.value } } })} placeholder="Account Name" />
              <Input value={settings.contact.bank.accountNumber} onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, bank: { ...settings.contact.bank, accountNumber: e.target.value } } })} placeholder="Account Number" />
              <Input value={settings.contact.bank.ifsc} onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, bank: { ...settings.contact.bank, ifsc: e.target.value } } })} placeholder="IFSC" />
              <Input value={settings.contact.bank.bankName} onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, bank: { ...settings.contact.bank, bankName: e.target.value } } })} placeholder="Bank Name" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Packages Reference (one-time purchase)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.keys(settings.packages).map((k) => (
                <div key={k} className="border rounded p-3">
                  <h3 className="font-medium uppercase">{k}</h3>
                  <Input value={settings.packages[k].price} type="number" onChange={(e) => setSettings({ ...settings, packages: { ...settings.packages, [k]: { ...settings.packages[k], price: Number(e.target.value || 0) } } })} placeholder="Price" />
                  <Input value={settings.packages[k].pv} type="number" onChange={(e) => setSettings({ ...settings, packages: { ...settings.packages, [k]: { ...settings.packages[k], pv: Number(e.target.value || 0) } } })} placeholder="PV" />
                  <Input value={settings.packages[k].pairIncome} type="number" onChange={(e) => setSettings({ ...settings, packages: { ...settings.packages, [k]: { ...settings.packages[k], pairIncome: Number(e.target.value || 0) } } })} placeholder="Pair Income" />
                  <Input value={settings.packages[k].capping} type="number" onChange={(e) => setSettings({ ...settings, packages: { ...settings.packages, [k]: { ...settings.packages[k], capping: Number(e.target.value || 0) } } })} placeholder="Capping per session" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Session Engine</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex gap-2">
                <Input value={settings.sessions.perDay} type="number" onChange={(e) => setSettings({ ...settings, sessions: { ...settings.sessions, perDay: Number(e.target.value || 0) } })} />
                <Input value={settings.sessions.lengthMinutes} type="number" onChange={(e) => setSettings({ ...settings, sessions: { ...settings.sessions, lengthMinutes: Number(e.target.value || 0) } })} />
              </div>

              <div>
                <label className="text-sm">Session Timings (one per line)</label>
                <Textarea value={(settings.sessions.timings || []).join("\n")} onChange={(e) => setSettings({ ...settings, sessions: { ...settings.sessions, timings: e.target.value.split(/\n/).map((s) => s.trim()).filter(Boolean) } })} />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm">Auto Engine Enabled</label>
                <Switch checked={!!settings.autoEngine} onCheckedChange={(v) => setSettings({ ...settings, autoEngine: !!v })} />
              </div>

              <div className="text-sm text-muted-foreground">Note: Session engine should be executed by a server-side scheduled job (every 135 minutes as per plan). Frontend toggles only update the config.</div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Import / Export</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-3">
              <label className="text-sm">Paste JSON to import (calls /api/admin/settings/import)</label>
              <Textarea className="h-40" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='{"siteName":"..."}' />
            </div>
            <div className="flex gap-2">
              <Button onClick={importSettings}><Upload className="mr-2 h-4 w-4 inline" /> Import</Button>
              <Button variant="ghost" onClick={() => setImportText(JSON.stringify(settings, null, 2))}>Fill with current</Button>
              <Button variant="destructive" onClick={() => setSettings(defaultSettings)}>Reset to defaults</Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
