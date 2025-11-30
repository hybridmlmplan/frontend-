import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../utils/axiosInstance";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    sponsorId: "",
    placementId: "",
    position: "left",
    packageName: "silver",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/signup", form);

      if (res.data.success) {
        navigate("/login");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed, please try again."
      );
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6">
        
        <h2 className="text-2xl font-bold text-center mb-6">
          Create New Account
        </h2>

        {error && (
          <p className="bg-red-200 text-red-700 p-2 rounded mb-4 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            required
          />

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            required
          />

          {/* Mobile */}
          <input
            type="number"
            name="mobile"
            placeholder="Mobile Number"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            required
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            required
          />

          {/* Sponsor ID */}
          <input
            type="text"
            name="sponsorId"
            placeholder="Sponsor ID"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            required
          />

          {/* Placement ID */}
          <input
            type="text"
            name="placementId"
            placeholder="Placement ID"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            required
          />

          {/* Position */}
          <select
            name="position"
            className="w-full border p-2 rounded"
            onChange={handleChange}
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>

          {/* Package Selection */}
          <select
            name="packageName"
            className="w-full border p-2 rounded"
            onChange={handleChange}
          >
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="ruby">Ruby</option>
          </select>

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            {loading ? "Please wait..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600">
            Login Here
          </Link>
        </p>
      </div>
    </div>
  );
}
