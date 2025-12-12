import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Lazy load pages for faster initial bundle
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Packages = lazy(() => import('./pages/Packages'));
const BinaryTree = lazy(() => import('./pages/BinaryTree'));
const Income = lazy(() => import('./pages/Income'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Franchise = lazy(() => import('./pages/Franchise'));
const Admin = lazy(() => import('./pages/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));

import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Simple protected route component
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

// Public route that redirects authenticated users to dashboard
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Loading...</div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Header />

          <main className="flex-1 container mx-auto px-4 py-6">
            <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
              <Routes>
                {/* Public pages */}
                <Route
                  path="/"
                  element={<PublicRoute><Login /></PublicRoute>} />
                <Route
                  path="/login"
                  element={<PublicRoute><Login /></PublicRoute>} />
                <Route
                  path="/signup"
                  element={<PublicRoute><Signup /></PublicRoute>} />

                {/* User panel - protected */}
                <Route
                  path="/dashboard"
                  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route
                  path="/packages"
                  element={<PrivateRoute><Packages /></PrivateRoute>} />
                <Route
                  path="/binary-tree"
                  element={<PrivateRoute><BinaryTree /></PrivateRoute>} />
                <Route
                  path="/income"
                  element={<PrivateRoute><Income /></PrivateRoute>} />
                <Route
                  path="/wallet"
                  element={<PrivateRoute><Wallet /></PrivateRoute>} />

                {/* Franchise panel - protected */}
                <Route
                  path="/franchise"
                  element={<PrivateRoute><Franchise /></PrivateRoute>} />

                {/* Admin area (could itself contain nested routes) */}
                <Route path="/admin/*" element={<PrivateRoute><Admin /></PrivateRoute>} />

                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
