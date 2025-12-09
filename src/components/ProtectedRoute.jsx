import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, admin=false }) {
  const auth = useSelector(s=>s.auth);
  if (!auth.token) return <Navigate to="/login" replace />;
  if (admin && auth.user?.role !== "admin") return <div>Admin access required</div>;
  return children;
}
