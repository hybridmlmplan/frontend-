import React, { useState } from "react";
import axios from "axios";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const token = localStorage.getItem("token"); // user token

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setErr("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErr("New password and confirm password do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/change-password`,
        {
          oldPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.status === true) {
        setMsg("Password changed successfully");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setErr(res.data.message || "Something went wrong");
      }
    } catch (error) {
      setErr("Server error, try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-xl">
      <h2 className="text-2xl font-bold mb-4">Change Password</h2>

      {msg && <div className="bg-green-200 text-green-800 p-2 mb-3">{msg}</div>}
      {err && <div className="bg-red-200 text-red-800 p-2 mb-3">{err}</div>}

      <form
        onSubmit={handleChangePassword}
        className="bg-white shadow-md p-4 rounded"
      >
        <div className="mb-4">
          <label className="block font-medium mb-1">Old Password</label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Enter old password"
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">New Password</label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Confirm New Password</label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          {loading ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
