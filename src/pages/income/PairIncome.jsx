import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

// PairIncome.jsx
// Frontend page to display binary pair incomes (red/green) and allow claiming.
// Assumptions made (followed from your plan):
// - Backend endpoint GET /api/income/pairs -> returns { data: [ { id, userId, packageType, leftPV, rightPV, amount, status, sessionId, createdAt } ], meta: { total } }
// - Backend endpoint POST /api/income/claim/:id to claim a green pair income
// - Auth is handled globally (Authorization header set via axios interceptor elsewhere)
// - Tailwind CSS is available for styling
// - This file is a single-file React component that can be dropped into your Vite + React project.

const PACKAGE_LABELS = {
  silver: { label: "Silver", pair: 10 },
  gold: { label: "Gold", pair: 50 },
  ruby: { label: "Ruby", pair: 500 }
};

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch (e) {
    return iso;
  }
}

export default function PairIncome() {
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [filterPackage, setFilterPackage] = useState("all");
  const [claimingIds, setClaimingIds] = useState(new Set());

  const fetchPairs = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pageNum,
        limit: pageSize,
      };
      if (filterPackage !== "all") params.package = filterPackage;

      const res = await axios.get("/api/income/pairs", { params });
      // expecting { data: [...], meta: { total } }
      const data = res.data || {};
      setPairs(data.data || []);
      setTotal((data.meta && data.meta.total) || 0);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Failed to load pairs");
    } finally {
      setLoading(false);
    }
  }, [pageSize, filterPackage]);

  useEffect(() => {
    fetchPairs(1);
  }, [fetchPairs]);

  const claimPair = async (pairId) => {
    if (!pairId) return;
    setClaimingIds(prev => new Set(prev).add(pairId));
    try {
      await axios.post(`/api/income/claim/${pairId}`);
      // optimistic refresh: mark claimed locally
      setPairs(prev => prev.map(p => p.id === pairId ? { ...p, status: 'claimed' } : p));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Claim failed');
    } finally {
      setClaimingIds(prev => {
        const s = new Set(prev);
        s.delete(pairId);
        return s;
      });
    }
  };

  const handlePackageFilter = (pkg) => {
    setFilterPackage(pkg);
  };

  const nextPage = () => {
    if (page * pageSize >= total) return;
    fetchPairs(page + 1);
  };
  const prevPage = () => {
    if (page <= 1) return;
    fetchPairs(page - 1);
  };

  const totalAmountByStatus = (status) =>
    pairs.reduce((sum, p) => sum + (p.status === status ? Number(p.amount || 0) : 0), 0);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Pair Income (Binary) — PairIncome</h1>

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => handlePackageFilter('all')}
            className={`px-3 py-1 rounded ${filterPackage === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
            All
          </button>
          {Object.keys(PACKAGE_LABELS).map(k => (
            <button
              key={k}
              onClick={() => handlePackageFilter(k)}
              className={`px-3 py-1 rounded ${filterPackage === k ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
              {PACKAGE_LABELS[k].label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-3 items-center text-sm">
          <div className="px-3 py-1 bg-green-50 rounded">Green total: ₹{totalAmountByStatus('green')}</div>
          <div className="px-3 py-1 bg-red-50 rounded">Red total: ₹{totalAmountByStatus('red')}</div>
          <div className="px-3 py-1 bg-gray-50 rounded">Claimed total: ₹{totalAmountByStatus('claimed')}</div>
        </div>
      </div>

      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">#</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Package</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Left PV</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Right PV</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount (₹)</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Session</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-6 text-center">Loading...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-red-600">{error}</td>
              </tr>
            ) : pairs.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-6 text-center">No pairs found.</td>
              </tr>
            ) : (
              pairs.map((p, idx) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3 text-sm">{PACKAGE_LABELS[p.packageType]?.label || p.packageType}</td>
                  <td className="px-4 py-3 text-sm">{p.leftPV}</td>
                  <td className="px-4 py-3 text-sm">{p.rightPV}</td>
                  <td className="px-4 py-3 text-sm">₹{p.amount}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${p.status === 'green' ? 'bg-green-100 text-green-800' : p.status === 'red' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{p.sessionId || '-'}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {p.status === 'green' && p.status !== 'claimed' ? (
                      <button
                        disabled={claimingIds.has(p.id)}
                        onClick={() => claimPair(p.id)}
                        className="px-3 py-1 rounded bg-emerald-600 text-white text-sm hover:opacity-90">
                        {claimingIds.has(p.id) ? 'Claiming...' : 'Claim'}
                      </button>
                    ) : p.status === 'claimed' ? (
                      <span className="text-sm text-gray-500">Claimed</span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Total results: {total}</div>
        <div className="flex gap-2">
          <button onClick={prevPage} disabled={page <= 1} className="px-3 py-1 bg-gray-100 rounded">Prev</button>
          <button onClick={nextPage} disabled={page * pageSize >= total} className="px-3 py-1 bg-gray-100 rounded">Next</button>
        </div>
      </div>

    </div>
  );
}
