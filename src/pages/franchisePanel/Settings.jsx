import React, { useState, useEffect } from "react";
import axios from "axios";

const Settings = () => {
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    franchiseName: "",
    address: "",
  });

  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [tokenStatus, setTokenStatus] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchTokenStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/franchise/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status) {
        setProfile({
          name: res.data.user.name,
          email: res.data.user.email,
          phone: res.data.user.phone,
          franchiseName: res.data.user.franchiseName || "",
          address: res.data.user.address || "",
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchTokenStatus = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/franchise/epin/token-status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status) {
        setTokenStatus(res.data.tokenStatus);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/franchise/update-profile`,
        profile,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status) {
        setMsg("Profile updated successfully!");
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New password & confirm password must match");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/franchise/change-password`,
        passwords,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status) {
        setMsg("Password updated successfully!");
        setPasswords({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  const toggleToken = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/franchise/epin/token-toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status) {
        setTokenStatus(res.data.tokenStatus);
        setMsg(
          `EPIN token is now ${res.data.tokenStatus ? "ON (Live Mode)" : "OFF (Testing Mode)"}`
        );
      }
    } catch (err) {
      setError("Failed to update token status");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Franchise Settings</h2>

      {msg && <div className="bg-green-200 text-green-800 p-2">{msg}</div>}
      {error && <div className="bg-red-200 text-red-800 p-2">{error}</div>}

      {/* ========================== PROFILE UPDATE ========================= */}
      <div className="bg-white shadow rounded p-4 mb-6">
        <h3 className="text-xl font-semibold mb-3">Update Profile</h3>

        <form onSubmit={updateProfile}>
          {["name", "email", "phone", "franchiseName", "address"].map(
            (field) => (
              <div className="mb-3" key={field}>
                <label className="block font-medium capitalize mb-1">
                  {field === "franchiseName"
                    ? "Franchise Name"
                    : field === "phone"
                    ? "Mobile Number"
                    : field}
                </label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={profile[field]}
                  onChange={(e) =>
                    setProfile({ ...profile, [field]: e.target.value })
                  }
                />
              </div>
            )
          )}

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* ========================== PASSWORD CHANGE ========================= */}
      <div className="bg-white shadow rounded p-4 mb-6">
        <h3 className="text-xl font-semibold mb-3">Change Password</h3>

        <form onSubmit={updatePassword}>
          <div className="mb-3">
            <label className="block mb-1 font-medium">Old Password</label>
            <input
              type="password"
              className="w-full border p-2 rounded"
              value={passwords.oldPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, oldPassword: e.target.value })
              }
            />
          </div>

          <div className="mb-3">
            <label className="block mb-1 font-medium">New Password</label>
            <input
              type="password"
              className="w-full border p-2 rounded"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, newPassword: e.target.value })
              }
            />
          </div>

          <div className="mb-3">
            <label className="block mb-1 font-medium">Confirm Password</label>
            <input
              type="password"
              className="w-full border p-2 rounded"
              value={passwords.confirmPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, confirmPassword: e.target.value })
              }
            />
          </div>

          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* ========================== TOKEN SYSTEM ========================= */}
      <div className="bg-white shadow rounded p-4">
        <h3 className="text-xl font-semibold mb-3">EPIN Token Mode</h3>

        <div className="flex items-center justify-between">
          <span className="font-medium">
            Current Mode:{" "}
            <span className="text-blue-600 font-bold">
              {tokenStatus ? "LIVE (ON)" : "TESTING (OFF)"}
            </span>
          </span>

          <button
            onClick={toggleToken}
            className={`px-4 py-2 rounded text-white ${
              tokenStatus ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {tokenStatus ? "Switch OFF" : "Switch ON"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
