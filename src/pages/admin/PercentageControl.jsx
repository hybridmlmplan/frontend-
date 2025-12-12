import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Plus, Save, Upload, Download } from "lucide-react";

/**
 * Admin — Percentage Control
 * -------------------------
 * Purpose:
 *  - Manage global percentage settings used across the system:
 *      • Royalty tiers (Silver ranks royalty breakdown)
 *      • Level BV percentage (levels 1..10)
 *      • Fund pool percentages (car, house, travel etc.)
 *      • Rank income percentages for Silver/Gold/Ruby where applicable
 *  - Load current config from backend and allow admin to update and save
 *
 * Expected endpoints (adjust if needed):
 *  GET  /api/admin/percentages      -> returns the percentage configuration object
 *  PATCH /api/admin/percentages      -> accepts patched config { key: value }
 *  POST /api/admin/percentages/import -> import via JSON (optional)
 *
 * Notes:
 *  - Values are treated as absolute percentages (0-100). Backend should validate.
 *  - This page focuses on editing arrays and named keys; feel free to expand keys per your backend schema.
 */

const emptyConfig = {
  royalty: {
    // continuous royalty for Silver ranks: first 3% until ₹35 then tiered values
    untilAmount: 35,
    initialPercent: 3,
    tiers: [1, 2, 3, 4, 5, 6, 7, 8], // example fallback
  },
  levelBVPercent: Array.from({ length: 10 }, () => 0.5), // levels 1..10 default 0.5%
  levelCTOPercent: { star1: 1.0, star2: 1.1, star3: 1.2 },
  fundPools: { carPool: 2.0, housePool: 2.0, travelPool: 0 },
  rankPercentage: {
    silver: [10, 20, 40, 80, 160, 320, 640, 1280, 2560], // actual rupee incomes in plan; we keep as numbers for reference
    gold: [50, 100, 200, 400, 800, 1600, 3200, 6400, 12800],
    ruby: [500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000],
  },
  levelIncomePercentPerLevel: Array.from({ length: 10 }, () => 0.5),
};

export default function PercentageControl() {
  const [config, setConfig] = useState(emptyConfig);
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
      const { data } = await axios.get("/api/admin/percentages", { headers: getAuthHeaders() });
      if (data && typeof data === "object") {
        setConfig((prev) => ({ ...prev, ...data }));
      }
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
      // Send entire config object; backend should accept and validate
      await axios.patch("/api/admin/percentages", config, { headers: getAuthHeaders() });
      // Optionally refetch
      await fetchConfig();
    } catch (err) {
      console.error("saveConfig", err?.response || err);
    } finally {
      setSaving(false);
    }
  }

  function updatePath(path, value) {
    // path as array
    setConfig((c) => {
      const copy = JSON.parse(JSON.stringify(c));
      let cur = copy;
      for (let i = 0; i < path.length - 1; i++) {
        cur = cur[path[i]] = cur[path[i]] || {};
      }
      cur[path[path.length - 1]] = value;
      return copy;
    });
  }

  function renderArrayEditor(arrPath, arr) {
    return (
      <div className="overflow-auto border rounded p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">#</th>
              <th className="p-2">Value</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {arr.map((v, i) => (
              <tr key={i} className="border-t">
                <td className="p-2 align-top">{i + 1}</td>
                <td className="p-2">
                  <Input value={String(v)} onChange={(e) => {
                    const nv = e.target.value;
                    setConfig((c) => {
                      const copy = JSON.parse(JSON.stringify(c));
                      const target = arrPath.reduce((o, p) => o[p], copy);
                      target[i] = isNumberString(nv) ? Number(nv) : nv;
                      return copy;
                    });
                  }} />
                </td>
                <td className="p-2">
                  <Button variant="ghost" onClick={() => {
                    setConfig((c) => {
                      const copy = JSON.parse(JSON.stringify(c));
                      const target = arrPath.reduce((o, p) => o[p], copy);
                      target.splice(i, 1);
                      return copy;
                    });
                  }}>Remove</Button>
                </td>
              </tr>
            ))}

            <tr>
              <td colSpan={3} className="p-2">
                <div className="flex gap-2">
                  <Input placeholder="New value" onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = e.target.value;
                      if (!val) return;
                      setConfig((c) => {
                        const copy = JSON.parse(JSON.stringify(c));
                        const target = arrPath.reduce((o, p) => o[p], copy);
                        target.push(isNumberString(val) ? Number(val) : val);
                        return copy;
                      });
                      e.target.value = "";
                    }
                  }} />
                  <div className="text-xs text-muted-foreground">Press Enter to add</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  function isNumberString(v) {
    if (v === null || v === undefined) return false;
    return /^-?\d+(\.\d+)?$/.test(String(v).trim());
  }

  async function importConfig() {
    try {
      const parsed = JSON.parse(importText);
      // Optional: send to backend import endpoint
      await axios.post("/api/admin/percentages/import", { config: parsed }, { headers: getAuthHeaders() });
      // refresh
      await fetchConfig();
      setImportText("");
    } catch (err) {
      console.error("importConfig", err?.response || err);
      alert("Import failed: invalid JSON or server error. Check console.");
    }
  }

  function exportConfig() {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `percentages_config_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6 flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Admin — Percentage Control</h1>
        <div className="flex gap-2">
          <Button onClick={fetchConfig} disabled={loading}><Download className="mr-2 h-4 w-4 inline" /> Reload</Button>
          <Button onClick={exportConfig}><Download className="mr-2 h-4 w-4 inline" /> Export</Button>
          <Button onClick={saveConfig} disabled={saving}><Save className="mr-2 h-4 w-4 inline" /> Save</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Royalty */}
        <Card>
          <CardHeader>
            <CardTitle>Royalty Settings (Silver ranks)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Until Amount (₹)</label>
                <Input value={config.royalty?.untilAmount || 0} type="number" onChange={(e) => updatePath(["royalty", "untilAmount"], Number(e.target.value || 0))} />
              </div>
              <div>
                <label className="text-sm">Initial Percent (%)</label>
                <Input value={config.royalty?.initialPercent || 0} type="number" onChange={(e) => updatePath(["royalty", "initialPercent"], Number(e.target.value || 0))} />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-sm">Royalty Tiers (continuous %) — array</label>
              {renderArrayEditor(["royalty", "tiers"], config.royalty?.tiers || [])}
            </div>
          </CardContent>
        </Card>

        {/* Level BV Percent */}
        <Card>
          <CardHeader>
            <CardTitle>Level BV Percent & CTO Bonus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <label className="text-sm">CTO BV Bonuses</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                <div>
                  <label className="text-xs">Star 1 (%)</label>
                  <Input type="number" value={config.levelCTOPercent?.star1 || 0} onChange={(e) => updatePath(["levelCTOPercent", "star1"], Number(e.target.value || 0))} />
                </div>
                <div>
                  <label className="text-xs">Star 2 (%)</label>
                  <Input type="number" value={config.levelCTOPercent?.star2 || 0} onChange={(e) => updatePath(["levelCTOPercent", "star2"], Number(e.target.value || 0))} />
                </div>
                <div>
                  <label className="text-xs">Star 3 (%)</label>
                  <Input type="number" value={config.levelCTOPercent?.star3 || 0} onChange={(e) => updatePath(["levelCTOPercent", "star3"], Number(e.target.value || 0))} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm">Level Income % per Level (levels 1..10)</label>
              {renderArrayEditor(["levelIncomePercentPerLevel"], config.levelIncomePercentPerLevel || Array.from({ length: 10 }, () => 0))}
            </div>
          </CardContent>
        </Card>

        {/* Fund Pools */}
        <Card>
          <CardHeader><CardTitle>Fund Pools</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="text-sm">Car Fund (%)</label>
                <Input type="number" value={config.fundPools?.carPool || 0} onChange={(e) => updatePath(["fundPools", "carPool"], Number(e.target.value || 0))} />
              </div>
              <div>
                <label className="text-sm">House Fund (%)</label>
                <Input type="number" value={config.fundPools?.housePool || 0} onChange={(e) => updatePath(["fundPools", "housePool"], Number(e.target.value || 0))} />
              </div>
              <div>
                <label className="text-sm">Travel Fund (%)</label>
                <Input type="number" value={config.fundPools?.travelPool || 0} onChange={(e) => updatePath(["fundPools", "travelPool"], Number(e.target.value || 0))} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rank Percentages / Reference incomes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rank Incomes / Reference Values</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="text-sm">Silver Rank Incomes (reference)</label>
              {renderArrayEditor(["rankPercentage", "silver"], config.rankPercentage?.silver || [])}
            </div>

            <div className="mb-4">
              <label className="text-sm">Gold Rank Incomes (reference)</label>
              {renderArrayEditor(["rankPercentage", "gold"], config.rankPercentage?.gold || [])}
            </div>

            <div>
              <label className="text-sm">Ruby Rank Incomes (reference)</label>
              {renderArrayEditor(["rankPercentage", "ruby"], config.rankPercentage?.ruby || [])}
            </div>

          </CardContent>
        </Card>

        {/* Import JSON */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Import / Export</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-3">
              <label className="text-sm">Paste JSON to import (will call server import endpoint)</label>
              <textarea className="w-full h-32 p-2 border rounded" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='{"royalty":{...}}' />
            </div>
            <div className="flex gap-2">
              <Button onClick={importConfig}><Upload className="mr-2 h-4 w-4 inline" /> Import</Button>
              <Button onClick={() => { setImportText(JSON.stringify(config, null, 2)); }} variant="ghost">Fill with current</Button>
              <Button onClick={() => setConfig(emptyConfig)} variant="destructive">Reset to defaults</Button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Notes: Import will POST the JSON to <code>/api/admin/percentages/import</code>. Backend should validate and save. Export downloads the current in-memory config as JSON.</p>
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
