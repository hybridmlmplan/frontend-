import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/package/buy", label: "Buy Package" },
  { to: "/genealogy", label: "Genealogy" },
  { to: "/income/pair", label: "Pair Income" },
  { to: "/wallet", label: "Wallet" },
  { to: "/franchise", label: "Franchise" }
];

export default function Sidebar(){
  return (
    <aside className="w-64 bg-white border-r p-4 min-h-screen">
      <nav className="flex flex-col space-y-2">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} className={({isActive}) => isActive ? "font-semibold text-blue-600" : "text-gray-700"}>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
