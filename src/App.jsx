import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./routes/PrivateRoute";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Dashboard
import Dashboard from "./pages/dashboard/Dashboard";

// User Pages
import Profile from "./pages/user/Profile";
import GenealogyTree from "./pages/genealogy/GenealogyTree";

// Purchase
import PackagePurchase from "./pages/purchase/PackagePurchase";

// Income Pages
import DirectIncome from "./pages/income/DirectIncome";
import PairIncome from "./pages/income/PairIncome";
import LevelIncome from "./pages/income/LevelIncome";
import RoyaltyIncome from "./pages/income/RoyaltyIncome";
import FundIncome from "./pages/income/FundIncome";

// EPIN
import EpinList from "./pages/epin/EpinList";
import EpinTransfer from "./pages/epin/EpinTransfer";

// Franchise
import FranchiseDashboard from "./pages/franchise/FranchiseDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard (Protected) */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* User Profile */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          {/* Genealogy */}
          <Route
            path="/genealogy"
            element={
              <PrivateRoute>
                <GenealogyTree />
              </PrivateRoute>
            }
          />

          {/* Purchase Package */}
          <Route
            path="/purchase"
            element={
              <PrivateRoute>
                <PackagePurchase />
              </PrivateRoute>
            }
          />

          {/* Income Pages */}
          <Route
            path="/income/direct"
            element={
              <PrivateRoute>
                <DirectIncome />
              </PrivateRoute>
            }
          />

          <Route
            path="/income/pair"
            element={
              <PrivateRoute>
                <PairIncome />
              </PrivateRoute>
            }
          />

          <Route
            path="/income/level"
            element={
              <PrivateRoute>
                <LevelIncome />
              </PrivateRoute>
            }
          />

          <Route
            path="/income/royalty"
            element={
              <PrivateRoute>
                <RoyaltyIncome />
              </PrivateRoute>
            }
          />

          <Route
            path="/income/fund"
            element={
              <PrivateRoute>
                <FundIncome />
              </PrivateRoute>
            }
          />

          {/* EPIN */}
          <Route
            path="/epin/list"
            element={
              <PrivateRoute>
                <EpinList />
              </PrivateRoute>
            }
          />

          <Route
            path="/epin/transfer"
            element={
              <PrivateRoute>
                <EpinTransfer />
              </PrivateRoute>
            }
          />

          {/* Franchise */}
          <Route
            path="/franchise"
            element={
              <PrivateRoute>
                <FranchiseDashboard />
              </PrivateRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
