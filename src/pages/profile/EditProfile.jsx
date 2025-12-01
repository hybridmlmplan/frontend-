import React, { useState, useEffect } from "react";
import axios from "axios";

export default function EditProfile() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
  });

  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userid");

  // Fetch User Profile
  const fetchProfile = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/user/profile/${userId}`
      );
      setForm({
        name: res.data.name || "",
        email: res.data.email || "",
        mobile: res.data.mobile || "",
        address: res.data.address || "",
      });
    } catch (err) {
      console.error("Profile load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update Profile
  const updateProfile = async () => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/user/profile/update/${userId}`,
        form
      );
      alert("Profile Updated Successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      alert("Update Failed!");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (loading) {
    return <p className="text-center mt-10 text-lg">Loading Profile...</p>;
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

      <div className="space-y-4">

        <div>
          <label className="block font-semibold mb-1">Full Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Mobile</label>
          <input
            type="text"
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          onClick={updateProfile}
          className="w-full bg-blue-600 text-white font-semibold p-2 rounded"
        >
          Update Profile
        </button>

      </div>
    </div>
  );
}
