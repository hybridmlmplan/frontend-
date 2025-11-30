// frontend/src/pages/dashboard/Profile.jsx
import { useEffect, useState } from "react";
import API from "../../utils/axiosInstance";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
  });

  useEffect(() => {
    API.get("/user/me")
      .then((res) => {
        setUser(res.data.user);
        setForm({
          name: res.data.user.name,
          email: res.data.user.email,
          mobile: res.data.user.mobile,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = () => {
    API.put("/user/update-profile", form)
      .then((res) => {
        alert("Profile Updated!");
        setUser(res.data.user);
        setEditMode(false);
      })
      .catch((err) => {
        alert(err?.response?.data?.message || "Update failed");
      });
  };

  if (loading) return <div className="p-4">Loading profile...</div>;
  if (!user) return <div className="p-4">User not found</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

      {/* MAIN CARD */}
      <div className="bg-white p-4 rounded-lg shadow-md border">
        {/* UserID */}
        <p className="text-gray-700 mb-3">
          <strong>User ID:</strong> {user.userId}
        </p>

        {/* Editable Fields */}
        <div className="space-y-3">

          {/* Name */}
          <div>
            <label className="block font-medium">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              disabled={!editMode}
              onChange={handleChange}
              className="w-full border p-2 rounded disabled:bg-gray-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              disabled={!editMode}
              onChange={handleChange}
              className="w-full border p-2 rounded disabled:bg-gray-100"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block font-medium">Mobile No.</label>
            <input
              type="text"
              name="mobile"
              maxLength={10}
              value={form.mobile}
              disabled={!editMode}
              onChange={handleChange}
              className="w-full border p-2 rounded disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex gap-3">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleUpdate}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Save Changes
              </button>

              <button
                onClick={() => setEditMode(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* EXTRA INFO CARD */}
      <div className="bg-blue-50 p-4 rounded-lg shadow-md border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-700 mb-2">Account Info</h2>

        <p><strong>Package:</strong> {user.packageName || "Not Purchased"}</p>
        <p><strong>PV:</strong> {user.pv || 0}</p>
        <p><strong>Rank:</strong> {user.rank || "No Rank"}</p>
        <p><strong>Status:</strong> Active</p>
      </div>
    </div>
  );
}
