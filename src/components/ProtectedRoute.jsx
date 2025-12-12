// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useStore } from "../store";

/**
 * ProtectedRoute
 *
 * Usage examples:
 * <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 *
 * Role-based:
 * <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
 * or
 * <Route path="/franchise" element={<ProtectedRoute allowedRoles={['franchise','admin']}><Franchise /></ProtectedRoute>} />
 *
 * Props:
 *  - children: React node to render when authorized
 *  - adminOnly: boolean (if true, only user.role === 'admin' allowed)
 *  - allowedRoles: array of roles allowed (overrides adminOnly if provided)
 */
export default function ProtectedRoute({ children, adminOnly = false, allowedRoles = null }) {
  const { state } = useStore();
  const { user, loading } = state;
  const location = useLocation();

  // While we are bootstrapping (checking token / fetching user) show loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <div className="mt-3 text-sm text-gray-600">Checking authentication...</div>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login, preserve attempted path in state
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Role-based checks
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border rounded shadow p-6 text-center">
            <h3 className="text-xl font-semibold text-red-600 mb-2">Access denied</h3>
            <p className="text-sm text-gray-600 mb-4">You don't have permission to view this page.</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => (window.location.href = "/")} className="px-4 py-2 bg-gray-100 rounded">Go Home</button>
            </div>
          </div>
        </div>
      );
    }
  } else if (adminOnly) {
    if (user.role !== "admin") {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border rounded shadow p-6 text-center">
            <h3 className="text-xl font-semibold text-red-600 mb-2">Admin access required</h3>
            <p className="text-sm text-gray-600 mb-4">Only administrators can access this page.</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => (window.location.href = "/")} className="px-4 py-2 bg-gray-100 rounded">Go Home</button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Authorized — render children
  return children;
}
