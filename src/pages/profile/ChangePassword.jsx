import React, { useState } from "react";
import axios from "axios";

export default function ChangePassword() {
  const userId = localStorage.getItem("userid");

  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      return alert("All fields are required!");
    }

    if (form.newPassword !== form.confirmPassword) {
      return alert("New passwords do not match!");
    }

    try {
      setLoading(true);

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/user/change-password/${userId}`,
        {
          oldPassword: form.oldPassword,
          newPassword: form.newPassword,
        }
      );

      alert("Password Updated Successfully!");
      setForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

    } catch (err) {
      alert(
        err?.response?.data?.message ||
          "Unable to update password, please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Change Password</h2>

      <div className="space-y-4">

        <div>
          <label className="block font-semibold mb-1">Old Password</label>
          <input
            type="password"
            name="oldPassword"
            value={form.oldPassword}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">New Password</label>
          <input
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-700 text-white font-semibold p-2 rounded disabled:bg-gray-400"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

      </div>
    </div>
  );
}
