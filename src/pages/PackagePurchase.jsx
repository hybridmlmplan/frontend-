import { useState, useEffect } from "react";
import axios from "axios";

export default function PackagePurchase() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState("");

  const packages = [
    { id: "silver", name: "Silver", price: 35 },
    { id: "gold", name: "Gold", price: 155 },
    { id: "ruby", name: "Ruby", price: 1250 },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data.user);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  const handlePurchase = () => {
    const token = localStorage.getItem("token");

    axios
      .post(
        `${import.meta.env.VITE_API_URL}/api/package/purchase`,
        { packageName: selectedPackage },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => {
        alert("Package Purchased Successfully");
        window.location.reload();
      })
      .catch((err) => {
        console.log(err);
        alert("Error purchasing package");
      });
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!user) return <div className="p-4">User Not Found</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Package Purchase</h1>

      {/* Current Package */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="font-semibold mb-2">Current Package</h2>
        <p>
          <strong>Package: </strong>
          {user.packageName || "Not Purchased"}
        </p>
        <p>
          <strong>PV: </strong>
          {user.pv || 0}
        </p>
      </div>

      {/* Select Package */}
      <div className="bg-blue-50 shadow rounded-lg p-4 space-y-3">
        <h2 className="font-semibold mb-2">Choose a Package</h2>

        {packages.map((pkg) => (
          <label
            key={pkg.id}
            className="flex items-center gap-3 bg-white p-3 rounded shadow cursor-pointer"
          >
            <input
              type="radio"
              name="package"
              value={pkg.id}
              onChange={() => setSelectedPackage(pkg.id)}
            />
            <div>
              <p className="font-medium">{pkg.name}</p>
              <p className="text-sm text-gray-600">₹{pkg.price}</p>
            </div>
          </label>
        ))}

        <button
          onClick={handlePurchase}
          disabled={!selectedPackage}
          className="w-full bg-blue-600 text-white p-3 rounded-lg mt-3 disabled:bg-gray-300"
        >
          Purchase Package
        </button>
      </div>
    </div>
  );
}
