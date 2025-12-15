import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// pages (import paths apne project ke hisab se sahi hi rahenge)
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Package from "./pages/package/BuyPackage";

const App = () => {
  return (
    <BrowserRouter>
      {/* Navbar always on top */}
      <Navbar />

      {/* IMPORTANT: margin-top for fixed navbar */}
      <div className="pt-16 min-h-screen pointer-events-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/package" element={<Package />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
