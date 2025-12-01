import { useEffect, useState } from "react";
import axios from "axios";

export default function FranchiseProfile() {
  const franchiseId = localStorage.getItem("userid");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    franchiseCode: "",
    joinDate: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/franchise/profile/${franchiseId}`
      );

      setProfile({
        name: res.data.name || "",
        email: res.data.email || "",
        mobile: res.data.mobile || "",
        address: res.data.address || "",
        franchiseCode: res.data.franchiseCode || "",
        joinDate: res.data.joinDate
          ? new Date(res.data.joinDate).toLocaleDateString()
          : "",
      });
    } catch (err) {
      console.error("Franchise Profile Fetch Error:", err);
    }
    setLoading(false);
  };

  if (loading) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Franchise Profile
      </h1>

      <div className="bg-white shadow-md rounded-lg p-5 border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h2 className="font-semibold text-gray-700">Name</h2>
            <p className="text-gray-900">{profile.name}</p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Email</h2>
            <p className="text-gray-900">{profile.email}</p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Mobile</h2>
            <p className="text-gray-900">{profile.mobile}</p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Franchise Code</h2>
            <p className="text-gray-900">{profile.franchiseCode}</p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Address</h2>
            <p className="text-gray-900">{profile.address}</p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Join Date</h2>
            <p className="text-gray-900">{profile.joinDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
