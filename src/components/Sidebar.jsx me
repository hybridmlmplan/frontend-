import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { FiMenu } from "react-icons/fi";

export default function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/" },
    { name: "Profile", path: "/profile" },
    { name: "Package Purchase", path: "/package" },
    { name: "Genealogy", path: "/genealogy" },
    { name: "Income", path: "/income" },
    { name: "Wallet", path: "/wallet" },
  ];

  return (
    <>
      {/* Mobile Top Menu Button */}
      <div className="lg:hidden p-3 bg-white shadow flex items-center">
        <button onClick={() => setOpen(!open)}>
          <FiMenu size={28} />
        </button>
        <h1 className="ml-3 text-xl font-bold">Hybrid MLM</h1>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white w-64 p-4 transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <h2 className="text-2xl font-semibold mb-6">Menu</h2>

        <ul className="space-y-3">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className={`block p-2 rounded 
                  ${
                    location.pathname === item.path
                      ? "bg-gray-600"
                      : "hover:bg-gray-700"
                  }`}
                onClick={() => setOpen(false)}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
