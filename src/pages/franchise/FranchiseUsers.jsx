import { useEffect, useState } from "react";
import axios from "axios";

export default function FranchiseUsers() {
  const franchiseId = localStorage.getItem("userid");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/franchise/users/${franchiseId}`
      );
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Franchise Users Load Error:", err);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Franchise Users
      </h1>

      {loading ? (
        <div className="text-gray-600">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-red-500 font-medium">No Users Found</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">#</th>
                <th className="border p-2">User ID</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Mobile</th>
                <th className="border p-2">Package</th>
                <th className="border p-2">BV</th>
                <th className="border p-2">Joining Date</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border p-2">{i + 1}</td>
                  <td className="border p-2">{u.userid}</td>
                  <td className="border p-2">{u.name}</td>
                  <td className="border p-2">{u.mobile}</td>
                  <td className="border p-2">{u.packageName}</td>
                  <td className="border p-2">{u.bv}</td>
                  <td className="border p-2">
                    {new Date(u.joinDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
