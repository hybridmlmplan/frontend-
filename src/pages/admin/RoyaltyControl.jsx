import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Download, Save, Upload } from "lucide-react";

/**
 * Admin — Royalty Control
 * ----------------------
 * Purpose:
 *  - Manage continuous royalty configuration (primarily for Silver ranks)
 *  - Configure initial % (3% until amount ₹35), then tiered royalty % per rank
 *  - Configure CTO/BV percentages (star1/star2/star3)
 *  - Import / Export JSON config
 *
 * Expected backend endpoints:
 *  GET  /api/admin/royalty       -> returns { royaltyConfig }
 *  PATCH /api/admin/royalty     -> accepts the patched config object
 *  POST  /api/admin/royalty/import -> optional import endpoint
 */

const defaultConfig = {
  initial: {
    untilAmount: 35, // ₹ threshold for initial percent
    percent: 3.0,
  },
  tiers: [1, 2, 3, 4, 5, 6, 7, 8], // continuous royalty percent per next levels (example)
  // tiers length should match Silver rank count or be interpreted by backend
  ctoBonuses: { star1: 1.0, star2: 1.1, star3: 1.2 },
  notes: "Continuous royalty: initial percent applied until amount threshold, then tiered percentages applied per rank. Values are percentages (0-100).",
};

export default function RoyaltyControl() {
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importText, setImportText] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  function getAuthHeaders() {
    const token = localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchConfig() {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/royalty", { headers: getAuthHeaders() });
      if (data && data.royaltyConfig) setConfig((prev) => ({ ...prev, ...data.royaltyConfig }));
      else if (data && typeof data === "object") setConfig((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error("fetchConfig", err?.response || err);
      // keep defaults
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    setSaving(true);
    try {
      await axios.patch("/api/admin/royalty", config, { headers: getAuthHeaders() });
      // refresh
      await fetchConfig();
      alert("Saved successfully");
    } catch (err) {
      console.error("saveConfig", err?.response || err);
      alert("Save failed. Check console.");
    } finally {
      setSaving(false);
    }
  }

  function updatePath(path, value) {
    setConfig((c) => {
      const copy = JSON.parse(JSON.stringify(c));
      let cur = copy;
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]] = cur[path[i]] || {};
      cur[path[path.length - 1]] = value;
      return copy;
    });
  }

  function isNumberString(v) {
    if (v === null || v === undefined) return false;
    return /^-?\d+(\.\d+)?$/.test(String(v).trim());
  }

  function renderTiersEditor() {
    const tiers = Array.isArray(config.tiers) ? config.tiers : [];
    return (
      <div className="overflow-auto border rounded p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left"><th className="p-2">Rank #</th><th className="p-2">Percent (%)</th><th className="p-2">Action</th></tr>
          </thead>
          <TBody>
            {tiers.map((t, i) => (
              <TR key={i} className="border-t">
                <TD className="p-2">{i + 1}</TD>
                <TD className="p-2">
                  <Input value={String(t)} onChange={(e) => {
                    const nv = e.target.value;
                    setConfig((c) => {
                      const copy = JSON.parse(JSON.stringify(c));
                      copy.tiers[i] = isNumberString(nv) ? Number(nv) : nv;
                      return copy;
                    });
                  }} />
                </TD>
                <TD className="p-2">
                  <Button variant="ghost" onClick={() => {
                    setConfig((c) => {
                      const copy = JSON.parse(JSON.stringify(c));
                      copy.tiers.splice(i, 1);
                      return copy;
                    });
                  }}>Remove</Button>
                </TD>
              </TR>
            ))}

            <TR>
              <TD colSpan={3} className="p-2">
                <div className="flex gap-2">
                  <Input placeholder="New percent" onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = e.target.value;
                      if (!v) return;
                      setConfig((c) => {
                        const copy = JSON.parse(JSON.stringify(c));
                        copy.tiers = copy.tiers || [];
                        copy.tiers.push(isNumberString(v) ? Number(v) : v);
                        return copy;
                      });
                      e.target.value = "";
                    }
                  }} />
                  <div className="text-xs text-muted-foreground">Press Enter to add</div>
                </div>
              </TD>
            </TR>
          </TBody>
        </table>
      </div>
    );
  }

  async function importConfig() {
    try {
      const parsed = JSON.parse(importText);
      await axios.post("/api/admin/royalty/import", { config: parsed }, { headers: getAuthHeaders() });
      await fetchConfig();
      setImportText("");
      setTimeout(() => alert("Import successful"), 100);
    } catch (err) {
      console.error("importConfig", err?.response || err);
      alert("Import failed. Check console and JSON format.");
    }
  }

  function exportConfig() {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `royalty_config_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6 flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Admin — Royalty Control</h1>
        <div className="flex gap-2">
          <Button onClick={fetchConfig} disabled={loading}><Download className="mr-2 h-4 w-4 inline" /> Reload</Button>
          <Button onClick={exportConfig}><Download className="mr-2 h-4 w-4 inline" /> Export</Button>
          <Button onClick={saveConfig} disabled={saving}><Save className="mr-2 h-4 w-4 inline" /> Save</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Initial Royalty</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Until Amount (₹)</label>
                <Input type="number" value={config.initial?.untilAmount || 0} onChange={(e) => updatePath(["initial", "untilAmount"], Number(e.target.value || 0))} />
              </div>
              <div>
                <label className="text-sm">Initial Percent (%)</label>
                <Input type="number" value={config.initial?.percent || 0} onChange={(e) => updatePath(["initial", "percent"], Number(e.target.value || 0))} />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-sm">Notes</label>
              <textarea className="w-full p-2 border rounded" value={config.notes || ""} onChange={(e) => updatePath(["notes"], e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>CTO BV Bonuses</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="text-sm">Star 1 (%)</label>
                <Input type="number" value={config.ctoBonuses?.star1 || 0} onChange={(e) => updatePath(["ctoBonuses", "star1"], Number(e.target.value || 0))} />
              </div>
              <div>
                <label className="text-sm">Star 2 (%)</label>
                <Input type="number" value={config.ctoBonuses?.star2 || 0} onChange={(e) => updatePath(["ctoBonuses", "star2"], Number(e.target.value || 0))} />
              </div>
              <div>
                <label className="text-sm">Star 3 (%)</label>
                <Input type="number" value={config.ctoBonuses?.star3 || 0} onChange={(e) => updatePath(["ctoBonuses", "star3"], Number(e.target.value || 0))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Tiered Royalty Percentages (Silver ranks)</CardTitle></CardHeader>
          <CardContent>
            {renderTiersEditor()}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Import / Export</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-2">
              <label className="text-sm">Paste JSON to import (calls /api/admin/royalty/import)</label>
              <textarea className="w-full h-40 p-2 border rounded" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='{"initial":{...},"tiers":[...],"ctoBonuses":{...}}' />
            </div>
            <div className="flex gap-2">
              <Button onClick={importConfig}><Upload className="mr-2 h-4 w-4 inline" /> Import</Button>
              <Button variant="ghost" onClick={() => setImportText(JSON.stringify(config, null, 2))}>Fill with current</Button>
              <Button variant="destructive" onClick={() => setConfig(defaultConfig)}>Reset to defaults</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
