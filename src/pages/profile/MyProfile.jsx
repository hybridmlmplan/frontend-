// =======================================
// MyProfile.jsx — Hybrid MLM Final Plan
// =======================================

import React, { useEffect, useState } from "react";
import axios from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const MyProfile = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    kycStatus: "",
  });

  // Fetch user profile
  const loadProfile = async () => {
    try {
      const res = await axios.get("/user/me");
      setProfile(res.data.data);
      setForm({
        name: res.data.data.name,
        email: res.data.data.email,
        phone: res.data.data.phone,
        kycStatus: res.data.data.kycStatus,
      });
    } catch (e) {
      console.log("Profile fetch error:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdate = async () => {
    try {
      await axios.put("/user/update-profile", form);
      setEditing(false);
      loadProfile();
    } catch (e) {
      console.log("Profile update error:", e);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="p-4 w-full">
      <h1 className="text-xl font-bold mb-4">My Profile</h1>

      {/* USER BASIC INFO */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-semibold mb-2">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <p><strong>User ID:</strong> {profile.userId}</p>
          <p><strong>Sponsor:</strong> {profile.sponsorId}</p>
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Phone:</strong> {profile.phone}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Join Date:</strong> {profile.createdAt?.slice(0, 10)}</p>
        </div>
      </div>

      {/* PACKAGE STATUS */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-semibold mb-2">Package Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <p><strong>Silver:</strong> {profile.packages?.silver?.active ? "Active" : "Inactive"}</p>
          <p><strong>Gold:</strong> {profile.packages?.gold?.active ? "Active" : "Inactive"}</p>
          <p><strong>Ruby:</strong> {profile.packages?.ruby?.active ? "Active" : "Inactive"}</p>
        </div>
      </div>

      {/* PV / BV */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-semibold mb-2">PV / BV Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <p><strong>Left PV:</strong> {profile.leftPV}</p>
          <p><strong>Right PV:</strong> {profile.rightPV}</p>
          <p><strong>Total BV:</strong> {profile.totalBV}</p>
        </div>
      </div>

      {/* RANK DETAILS */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-semibold mb-2">Rank Progress</h2>
        <p><strong>Current Rank:</strong> {profile.rank}</p>
        <p><strong>Next Rank:</strong> {profile.nextRank}</p>
        <p><strong>Pairs Completed:</strong> {profile.pairsCompleted}/8</p>
        
        <div className="w-full bg-gray-300 h-3 rounded mt-2">
          <div
            className="bg-green-600 h-3 rounded"
            style={{ width: `${(profile.pairsCompleted / 8) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* WALLET */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-semibold mb-2">Wallet Balance</h2>
        <p><strong>Income Wallet:</strong> ₹{profile.wallet?.income}</p>
        <p><strong>Withdrawal Wallet:</strong> ₹{profile.wallet?.withdraw}</p>
      </div>

      {/* FRANCHISE */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-semibold mb-2">Franchise</h2>
        <p><strong>Status:</strong> {profile.franchise?.active ? "Active" : "Not a Franchise"}</p>
        {profile.franchise?.active && (
          <p><strong>Commission:</strong> {profile.franchise?.commission}%</p>
        )}
      </div>

      {/* KYC */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-semibold mb-2">KYC</h2>
        <p><strong>Status:</strong> {profile.kycStatus}</p>
        <p><strong>Aadhar:</strong> {profile.kyc?.aadhar}</p>
        <p><strong>PAN:</strong> {profile.kyc?.pan}</p>
      </div>

      {/* EDIT PROFILE */}
      <button
        onClick={() => setEditing(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-3"
      >
        Edit Profile
      </button>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-4 rounded-xl w-80">
            <h2 className="font-bold mb-2">Edit Profile</h2>

            <input
              type="text"
              className="border p-2 w-full rounded mb-2"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              type="text"
              className="border p-2 w-full rounded mb-2"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <input
              type="email"
              className="border p-2 w-full rounded mb-2"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <div className="flex justify-end mt-3 gap-2">
              <button onClick={() => setEditing(false)} className="px-3 py-1 bg-gray-300 rounded">
                Cancel
              </button>
              <button onClick={handleUpdate} className="px-3 py-1 bg-blue-600 text-white rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyProfile;
