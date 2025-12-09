import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { Link } from "react-router-dom";

export default function Navbar() {
  const auth = useSelector(s => s.auth);
  const dispatch = useDispatch();

  return (
    <nav className="bg-white border-b p-3 flex justify-between">
      <div className="flex items-center space-x-4">
        <Link to="/dashboard" className="font-bold text-lg">HybridMLM</Link>
      </div>
      <div className="flex items-center space-x-4">
        {auth.user ? (
          <>
            <span>Namaste, {auth.user.name || auth.user.userCode}</span>
            <button onClick={() => dispatch(logout())} className="text-sm bg-red-500 text-white px-3 py-1 rounded">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-blue-600">Login</Link>
            <Link to="/signup" className="text-blue-600">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
}
