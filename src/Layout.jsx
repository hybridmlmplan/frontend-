import { Link, Outlet, useNavigate } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-60 bg-white shadow-md p-5">
        <h2 className="text-xl font-bold mb-6">My MLM Panel</h2>

        <nav className="space-y-3">
          <Link className="block p-2 rounded hover:bg-gray-200" to="/dashboard">
            Dashboard
          </Link>

          <Link className="block p-2 rounded hover:bg-gray-200" to="/profile">
            Profile
          </Link>

          <Link className="block p-2 rounded hover:bg-gray-200" to="/team">
            My Team
          </Link>

          <Link className="block p-2 rounded hover:bg-gray-200" to="/income">
            Income
          </Link>

          <Link className="block p-2 rounded hover:bg-gray-200" to="/franchise">
            Franchise
          </Link>

          <button
            onClick={logout}
            className="w-full text-left p-2 rounded hover:bg-red-200 text-red-600 mt-8"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
}
