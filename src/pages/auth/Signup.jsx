import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Signup() {

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    sponsorId: "",
    packageName: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/signup`,
        form
      );

      alert(res.data.message || "Signup successful!");
      navigate("/login");
    } catch (error) {
      alert(error?.response?.data?.message || "Signup failed!");
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 px-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">Create Account</h2>

        <form onSubmit={handleSignup} className="space-y-4">

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="w-full border p-2 rounded"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full border p-2 rounded"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="mobile"
            placeholder="Mobile Number"
            className="w-full border p-2 rounded"
            value={form.mobile}
            onChange={handleChange}
            maxLength={10}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full border p-2 rounded"
            value={form.password}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="sponsorId"
            placeholder="Sponsor ID"
            className="w-full border p-2 rounded"
            value={form.sponsorId}
            onChange={handleChange}
            required
          />

          {/* PACKAGE DROPDOWN */}
          <select
            name="packageName"
            className="w-full border p-2 rounded"
            value={form.packageName}
            onChange={handleChange}
            required
          >
            <option value="">Select Package</option>
            <option value="Silver">Silver (₹35)</option>
            <option value="Gold">Gold (₹155)</option>
            <option value="Ruby">Ruby (₹1250)</option>
          </select>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Signup"}
          </button>

        </form>

        <p className="text-center mt-4">
          Already have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
