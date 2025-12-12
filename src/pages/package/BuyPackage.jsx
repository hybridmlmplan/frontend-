import React, { useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";

/**
 * BuyPackage.jsx
 * ----------------
 * 100% complete frontend page for buying/activating packages (Silver/Gold/Ruby)
 * Features:
 * - Fetches available packages from backend (/api/packages)
 * - Shows package details (Price, PV, Pair Income, Capping)
 * - Allows entering EPIN or using online payment (mock) to activate
 * - Honors Token ON/OFF mode (Token=EPIN system live/test)
 * - Validates sponsorId & optional placementId client-side before calling backend
 * - Submits purchase to /api/package/purchase (expects server to handle PV/BV/epin logic)
 * - Friendly fallbacks and demo-mode data to allow copy-paste and immediate usage
 *
 * Backend endpoints this UI expects (change if your backend differs):
 * - GET {apiBase}/api/packages                -> [{ key, name, price, pv, pairIncome, capping }]
 * - GET {apiBase}/api/user/profile           -> { uid, name, sponsorId, placementId, package }
 * - POST {apiBase}/api/epin/validate         -> { valid: true/false, message }
 * - POST {apiBase}/api/package/purchase      -> { success: true, message, orderId }
 *
 * Integration notes: Server must enforce Token ON/Token OFF logic, EPIN transfer rules, and actual package activation.
 */

export default function BuyPackage({ apiBase = "" }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [packages, setPackages] = useState([]);
  const [profile, setProfile] = useState({ uid: "", name: "", sponsorId: "ROOT", placementId: "" });

  const [selectedPkg, setSelectedPkg] = useState(null);
  const [useEPin, setUseEPin] = useState(true); // default prefers EPIN
  const [epin, setEpin] = useState("");
  const [tokenMode, setTokenMode] = useState(true); // Token ON = live EPIN required (admin controlled)
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Form fields for purchase
  const [sponsorId, setSponsorId] = useState("");
  const [placementId, setPlacementId] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [pkgRes, profRes] = await Promise.all([fetchPackages(), fetchProfile()]);
        if (!mounted) return;
        setPackages(pkgRes);
        setProfile(profRes);
        setSponsorId(profRes.sponsorId || "ROOT");
        setPlacementId(profRes.placementId || "");
        setSelectedPkg(pkgRes[0] || null);
        // token mode should ideally come from backend config; kept true by default
        setTokenMode(true);
      } catch (err) {
        console.error("BuyPackage load error:", err);
        if (!mounted) return;
        setError("Failed to load server data — showing demo packages. Replace endpoints as required.");
        // demo fallback
        const demo = [
          { key: "silver", name: "Silver", price: 35, pv: 35, pairIncome: 10, capping: 1 },
          { key: "gold", name: "Gold", price: 155, pv: 155, pairIncome: 50, capping: 1 },
          { key: "ruby", name: "Ruby", price: 1250, pv: 1250, pairIncome: 500, capping: 1 },
        ];
        setPackages(demo);
        setProfile({ uid: "GSM0001", name: "Demo User", sponsorId: "ROOT", placementId: "" });
        setSponsorId("ROOT");
        setPlacementId("");
        setSelectedPkg(demo[0]);
        setTokenMode(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchPackages() {
    const url = `${apiBase}/api/packages`;
    const res = await axios.get(url);
    return res.data;
  }

  async function fetchProfile() {
    const url = `${apiBase}/api/user/profile`;
    const res = await axios.get(url);
    return res.data;
  }

  async function validateEpinOnServer(epinCode) {
    const url = `${apiBase}/api/epin/validate`;
    const res = await axios.post(url, { epin: epinCode });
    return res.data;
  }

  async function submitPurchase(payload) {
    const url = `${apiBase}/api/package/purchase`;
    const res = await axios.post(url, payload);
    return res.data;
  }

  function resetMessages() {
    setError(null);
    setSuccessMsg("");
  }

  async function handleBuy(e) {
    e.preventDefault();
    resetMessages();

    if (!selectedPkg) {
      setError("Koi package select kijiye.");
      return;
    }

    // basic client-side sponsor validation
    if (!sponsorId || sponsorId.trim().length < 1) {
      setError("Sponsor ID zaroori hai (ROOT allowed).");
      return;
    }

    // placement optional — if supplied, do basic format check
    if (placementId && placementId.trim().length < 3) {
      setError("Agar placement id dena hai to wo valid hona chahiye.");
      return;
    }

    // if tokenMode ON, EPIN is required for activation
    if (tokenMode && useEPin) {
      if (!epin || epin.trim().length < 3) {
        setError("EPIN daaliye. (Token ON mode me EPIN chahiye)");
        return;
      }
    }

    setProcessing(true);
    try {
      // if EPIN used, validate with server first
      if (useEPin && tokenMode) {
        const v = await validateEpinOnServer(epin.trim());
        if (!v || !v.valid) {
          setError(v?.message || "EPIN invalid ya server reject kar raha hai.");
          setProcessing(false);
          return;
        }
      }

      // payload for purchase. server will check BV/PV/EPIN and place user accordingly
      const payload = {
        packageKey: selectedPkg.key,
        sponsorId: sponsorId.trim() || "ROOT",
        placementId: placementId.trim() || null,
        useEPin: !!useEPin,
        epin: useEPin ? epin.trim() : null,
        paymentMethod: useEPin ? "EPIN" : "ONLINE", // if ONLINE, backend must process payment separately
      };

      const resp = await submitPurchase(payload);
      if (!resp || !resp.success) {
        setError(resp?.message || "Server rejected purchase.");
        setProcessing(false);
        return;
      }

      setSuccessMsg(resp.message || "Package activated successfully.");
      // clear form on success
      setEpin("");
      // ideally refresh profile/packages
      try {
        const prof = await fetchProfile();
        setProfile(prof);
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error("BuyPackage error:", err);
      setError("Server error during purchase. Check console.");
    } finally {
      setProcessing(false);
    }
  }

  // Helper: pretty price
  function formatRs(n) {
    return `₹ ${Number(n || 0).toLocaleString()}`;
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="inline-block animate-pulse text-lg">Loading package shop...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Buy Package</h1>
        <div className="text-sm text-slate-500">Logged as <strong>{profile.name} ({profile.uid})</strong></div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-300 text-sm">{error}</div>}
      {successMsg && <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-300 text-sm">{successMsg}</div>}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {packages.map((pkg) => (
          <label
            key={pkg.key}
            className={`p-4 rounded shadow-sm border cursor-pointer flex flex-col gap-2 ${selectedPkg?.key === pkg.key ? "border-blue-500 bg-blue-50" : "hover:shadow"}`}
          >
            <input
              type="radio"
              name="pkg"
              className="hidden"
              checked={selectedPkg?.key === pkg.key}
              onChange={() => setSelectedPkg(pkg)}
            />
            <div className="text-lg font-semibold">{pkg.name}</div>
            <div className="text-sm text-slate-500">Price: <span className="font-semibold">{formatRs(pkg.price)}</span></div>
            <div className="text-sm">PV: <strong>{pkg.pv}</strong></div>
            <div className="text-sm">Pair Income: <strong>₹ {pkg.pairIncome}</strong></div>
            <div className="text-xs text-slate-500">Capping/session: {pkg.capping}</div>
          </label>
        ))}
      </section>

      <form onSubmit={handleBuy} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Sponsor ID</label>
            <input
              value={sponsorId}
              onChange={(e) => setSponsorId(e.target.value)}
              className="w-full border p-2 rounded mt-1"
              placeholder="Sponsor ID (ROOT allowed)"
            />
            <div className="text-xs text-slate-500 mt-1">Sponsor determines upline. Use ROOT if none.</div>
          </div>

          <div>
            <label className="text-sm">Placement ID (optional)</label>
            <input
              value={placementId}
              onChange={(e) => setPlacementId(e.target.value)}
              className="w-full border p-2 rounded mt-1"
              placeholder="Placement ID (optional)"
            />
            <div className="text-xs text-slate-500 mt-1">Placement determines binary side. Leave blank to auto-place.</div>
          </div>
        </div>

        <div className="p-3 rounded border bg-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-medium">Activation Method</div>
              <div className="text-xs text-slate-500">Token mode controlled by admin. EPIN required if Token ON.</div>
            </div>
            <div className="text-sm">Token Mode: <strong>{tokenMode ? "ON" : "OFF"}</strong></div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" checked={useEPin} onChange={() => setUseEPin(true)} />
              <span className="text-sm">Use EPIN</span>
            </label>

            <label className="flex items-center gap-2">
              <input type="radio" checked={!useEPin} onChange={() => setUseEPin(false)} />
              <span className="text-sm">Pay Online / Other</span>
            </label>
          </div>

          {useEPin && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                value={epin}
                onChange={(e) => setEpin(e.target.value)}
                className="border p-2 rounded col-span-2"
                placeholder={tokenMode ? "Enter EPIN (required)" : "Enter EPIN (optional in test mode)"}
              />
              <button
                type="button"
                className="px-3 py-2 border rounded"
                onClick={async () => {
                  resetMessages();
                  if (!epin || epin.trim().length < 3) {
                    setError("EPIN daaliye test ke liye.");
                    return;
                  }
                  setProcessing(true);
                  try {
                    const v = await validateEpinOnServer(epin.trim());
                    if (!v || !v.valid) setError(v?.message || "EPIN invalid");
                    else setSuccessMsg(v.message || "EPIN valid");
                  } catch (err) {
                    console.error(err);
                    setError("Server error validating EPIN.");
                  } finally {
                    setProcessing(false);
                  }
                }}
              >
                Validate EPIN
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={processing}
            type="submit"
            className={`px-4 py-2 rounded font-medium ${processing ? "bg-slate-300" : "bg-blue-600 text-white"}`}
          >
            {processing ? "Processing..." : `Buy & Activate ${selectedPkg ? selectedPkg.name : "Package"}`}
          </button>

          <button
            type="button"
            onClick={async () => {
              // Quick demo helper: prefill EPIN and sponsor
              setEpin("DEMO-EPIN-123");
              setSponsorId(profile.sponsorId || "ROOT");
              setPlacementId(profile.placementId || "");
              setSuccessMsg("Demo data prefilled. Use Validate EPIN before Buy.");
            }}
            className="px-3 py-2 rounded border"
          >
            Prefill Demo
          </button>
        </div>

        <div className="text-xs text-slate-500">
          <strong>Note:</strong> PV (package PV) will be used for binary pairing only. BV and repurchase volumes are handled server-side for royalty, rank and fund distributions. EPIN transfer rules, unlimited transfer and no expiry are enforced on server.
        </div>
      </form>

      <section className="mt-6 p-4 rounded border bg-white">
        <h2 className="font-medium mb-2">Developer / Integration Notes</h2>
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>Server must validate EPIN, charge wallet or process payment, update user package & PV, and record BV appropriately.</li>
          <li>If Token Mode (EPIN system) is ON, backend must reject purchases without EPIN unless admin allows offline payments.</li>
          <li>Placement rules: backend should allow automatic placement if placementId not provided, and should validate requested placement availability.</li>
          <li>After successful purchase, backend must update binary tree, PV ledger, and session engine inputs so the next session counts the new PV.</li>
          <li>Client-side only does minimal validation — server is authoritative for all business rules.</li>
        </ul>
      </section>
    </div>
  );
}

BuyPackage.propTypes = {
  apiBase: PropTypes.string,
};
