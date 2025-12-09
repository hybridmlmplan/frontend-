import React from "react";
import RoutesApp from "./routes";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <RoutesApp />
        </main>
      </div>
    </div>
  );
}
