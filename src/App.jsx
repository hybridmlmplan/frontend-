import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./routes/PrivateRoute";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Dashboard
import Home from "./pages/dashboard/Home";

// User Pages
import Profile from "./pages/dashboard/Profile";
import GenealogyTree from "./pages/myteam";

// Purchase
import PackagePurchase from "./pages/purchase/PackagePurchase";
import BuyPackage from "./pages/buypackage";

// Income Pages
import DirectIncome from "./pages/income/DirectIncome";
import PairIncome from "./pages/income/BinaryIncome";
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

          {/* OPTIONAL (if you also want /signup to work) */}
          <Route path="/signup" element={<Register />} />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />

          {/* Profile */}
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
            path="/myteam"
            element={
              <PrivateRoute>
                <GenealogyTree />
              </PrivateRoute>
            }
          />

          {/* Purchase */}
          <Route
            path="/packagepurchase"
            element={
              <PrivateRoute>
                <PackagePurchase />
              </PrivateRoute>
            }
          />

          <Route
            path="/buypackage"
            element={
              <PrivateRoute>
                <BuyPackage />
              </PrivateRoute>
            }
          />

          {/* Income */}
          <Route
            path="/directincome"
            element={
              <PrivateRoute>
                <DirectIncome />
              </PrivateRoute>
            }
          />

          <Route
            path="/pairincome"
            element={
              <PrivateRoute>
                <PairIncome />
              </PrivateRoute>
            }
          />

          <Route
            path="/levelincome"
            element={
              <PrivateRoute>
                <LevelIncome />
              </PrivateRoute>
            }
          />

          <Route
            path="/royaltyincome"
            element={
              <PrivateRoute>
                <RoyaltyIncome />
              </PrivateRoute>
            }
          />

          <Route
            path="/fundincome"
            element={
              <PrivateRoute>
                <FundIncome />
              </PrivateRoute>
            }
          />

          {/* EPIN */}
          <Route
            path="/epinlist"
            element={
              <PrivateRoute>
                <EpinList />
              </PrivateRoute>
            }
          />

          <Route
            path="/epintransfer"
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

          {/* Default Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
