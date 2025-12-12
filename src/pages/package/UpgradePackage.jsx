import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

// UpgradePackage.jsx
// 100% complete frontend page for upgrading a user's package according to the provided Hybrid MLM plan.
// Features:
// - Shows current package and eligible upgrade options
// - Allows activation using EPIN (unlimited EPINs, no expiry)
// - Shows price, PV, pair income and notes about session/capping
// - Handles API calls to fetch packages, request upgrade, and activate via EPIN
// - Friendly UX, validation, accessible markup, Tailwind CSS

export default function UpgradePackage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPackage, setCurrentPackage] = useState(null);
  const [availablePackages, setAvailablePackages] = useState([]); // packages user can upgrade to
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [epin, setEpin] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState("epin"); // epin | online
  const navigate = useNavigate();
  const { userId } = useParams(); // optional param if route provides user id

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      // GET /api/user/package/current -> { status: true, data: { currentPackage, availableUpgrades: [...] } }
      const res = await axios.get(`/api/user/package/current${userId ? `?userId=${userId}` : ""}`);
      if (!res.data || !res.data.status) throw new Error(res.data?.message || "Failed to fetch package data");
      setCurrentPackage(res.data.data.currentPackage || null);
      setAvailablePackages(res.data.data.availableUpgrades || []);
      setSelectedPackageId((res.data.data.availableUpgrades && res.data.data.availableUpgrades[0]?._id) || "");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(n) {
    if (typeof n !== "number") return n;
    return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  }

  async function requestUpgrade() {
    if (!selectedPackageId) return alert("Please select a package to upgrade to.");
    setActionLoading(true);
    try {
      // POST /api/package/upgrade-request body: { newPackageId }
      const res = await axios.post(`/api/package/upgrade-request`, { newPackageId: selectedPackageId });
      if (res.data && res.data.status) {
        alert(res.data.message || "Upgrade request created. Proceed to activation.");
        // refresh data
        await fetchData();
      } else {
        throw new Error(res.data?.message || "Upgrade request failed");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Upgrade error");
    } finally {
      setActionLoading(false);
    }
  }

  async function activateWithEpin() {
    if (!epin || !selectedPackageId) return alert("Enter EPIN and select package");
    setActionLoading(true);
    try {
      // POST /api/package/activate body: { epin, packageId }
      const res = await axios.post(`/api/package/activate`, { epin: epin.trim(), packageId: selectedPackageId });
      if (res.data && res.data.status) {
        alert(res.data.message || "Package activated successfully");
        setEpin("");
        // re-fetch user package info
        await fetchData();
        navigate(`/package/history`);
      } else {
        throw new Error(res.data?.message || "Activation failed");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Activation error");
    } finally {
      setActionLoading(false);
    }
  }

  async function proceedOnlinePayment() {
    if (!selectedPackageId) return alert("Select a package first");
    setActionLoading(true);
    try {
      // Simulate checkout call. Backend should return a payment URL or orderId.
      // POST /api/payment/create  body: {packageId}
      const res = await axios.post(`/api/payment/create`, { packageId: selectedPackageId });
      if (res.data && res.data.status && res.data.data) {
        // If backend returns paymentUrl, redirect
        if (res.data.data.paymentUrl) {
          window.location.href = res.data.data.paymentUrl;
          return;
        }
        alert("Payment initialized. Follow the next steps.");
      } else {
        throw new Error(res.data?.message || "Payment initiation failed");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Payment error");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div className="p-6 text-center">Loading upgrade options...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Upgrade Package</h1>
        <button onClick={() => navigate(-1)} className="px-3 py-2 border rounded">Back</button>
      </div>

      <div className="bg-white shadow rounded p-4 mb-4">
        <h2 className="text-lg font-medium">Current Package</h2>
        {currentPackage ? (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <div>
              <div className="text-sm text-gray-600">Package</div>
              <div className="font-medium">{currentPackage.packageType || currentPackage.packageName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Price / PV</div>
              <div className="font-medium">{formatCurrency(currentPackage.price || 0)} / {currentPackage.pv || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Sessions Completed</div>
              <div className="font-medium">{currentPackage.sessionsCompleted || 0} / 8</div>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm text-gray-600">No active package found. You can purchase any package.</div>
        )}
      </div>

      <div className="bg-white shadow rounded p-4 mb-4">
        <h2 className="text-lg font-medium">Available Upgrades</h2>
        <p className="text-xs text-gray-500">Select the package you want to upgrade to. Note: Pair income capping and red/green cycle rules apply as per plan.</p>

        <div className="mt-3 space-y-3">
          {availablePackages && availablePackages.length > 0 ? (
            availablePackages.map((pkg) => (
              <label key={pkg._id || pkg.id} className={`block border rounded p-3 cursor-pointer ${selectedPackageId === (pkg._id || pkg.id) ? "ring-2 ring-indigo-300" : "hover:bg-gray-50"}`}>
                <input
                  type="radio"
                  name="upgrade"
                  value={pkg._id || pkg.id}
                  checked={selectedPackageId === (pkg._id || pkg.id)}
                  onChange={() => setSelectedPackageId(pkg._id || pkg.id)}
                  className="mr-3"
                />
                <span className="font-medium">{pkg.packageType || pkg.packageName}</span>
                <div className="text-sm text-gray-600">{formatCurrency(pkg.price || 0)} • PV: {pkg.pv || "-"} • Pair Income: {formatCurrency(pkg.pairIncome || 0)}</div>
                <div className="text-xs text-gray-500 mt-2">{pkg.description || "One time purchase. No expiry. Use EPIN to activate."}</div>
              </label>
            ))
          ) : (
            <div className="text-sm text-gray-600">No upgrade packages available at the moment.</div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={requestUpgrade}
            disabled={actionLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
          >
            {actionLoading ? "Processing..." : "Request Upgrade"}
          </button>

          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            className="px-4 py-2 border rounded"
          >
            Proceed to Activate
          </button>
        </div>
      </div>

      {/* Activation Methods */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-medium">Activate Selected Package</h2>
        <div className="mt-2 flex gap-2 items-center">
          <label className="inline-flex items-center">
            <input type="radio" name="mode" value="epin" checked={checkoutMode === "epin"} onChange={() => setCheckoutMode("epin")} className="mr-2" />
            EPIN (Token)
          </label>
          <label className="inline-flex items-center">
            <input type="radio" name="mode" value="online" checked={checkoutMode === "online"} onChange={() => setCheckoutMode("online")} className="mr-2" />
            Online Payment
          </label>
        </div>

        {checkoutMode === "epin" ? (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm">Enter EPIN</label>
              <input value={epin} onChange={(e) => setEpin(e.target.value)} placeholder="Enter EPIN (tokens are unlimited)" className="w-full border rounded p-2" />
              <div className="text-xs text-gray-500 mt-1">EPINs don't expire. If you see "invalid EPIN" from server, confirm token or contact support.</div>
            </div>

            <div className="flex items-end gap-2">
              <button onClick={activateWithEpin} disabled={actionLoading} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60">{actionLoading ? "Activating..." : "Activate with EPIN"}</button>
            </div>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-gray-600">Online payment will open the payment gateway. Backend must return a payment URL.</div>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={proceedOnlinePayment} disabled={actionLoading} className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60">{actionLoading ? "Processing..." : "Pay Online"}</button>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <p>Note:</p>
          <ul className="list-disc ml-4">
            <li>Pair income, session capping (1 pair per package per session), and red/green cycle rules will apply after activation.</li>
            <li>No package expiry; incomes are lifetime per plan.</li>
            <li>If upgrading from Silver to Gold/Ruby, previously accumulated sessions/pairs may remain in red pending list until matched as per plan logic.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
