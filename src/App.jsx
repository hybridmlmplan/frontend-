import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Package from "./pages/package/BuyPackage";

const App = () => {
  return (
    <>
      {/* Navbar always on top */}
      <Navbar />

      {/* Space for fixed navbar */}
      <div className="pt-16 min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/package" element={<Package />} />
        </Routes>
      </div>
    </>
  );
};

export default App;
