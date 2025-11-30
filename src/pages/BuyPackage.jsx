import { useEffect, useState } from "react";
import axios from "axios";

export default function BuyPackage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const packages = [
    { name: "Silver", amount: 35, code: "Sp" },
    { name: "Gold", amount: 155, code: "Gp" },
    { name: "Ruby", amount: 1250, code: "Rp" },
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
      .catch(() => setLoading(false));
  }, []);

  const buyPackage = async (pkg) => {
    setProcessing(true);
    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/package/buy`,
        { packageName: pkg.name },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(res.data.message || "Package Purchased Successfully!");

      // reload
      window.location.reload();
    } catch (err) {
      console.log(err);
      alert("Error purchasing package.");
    }

    setProcessing(false);
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!user) return <div className="p-4">User Not Found</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Buy Package</h1>

      <p className="text-gray-600">Select a package to upgrade your account.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg, i) => (
          <div
            key={i}
            className="bg-white shadow rounded-lg p-4 border text-center"
          >
            <h2 className="text-xl font-semibold mb-2">{pkg.name}</h2>
            <p className="text-gray-700 mb-4">₹{pkg.amount}</p>

            {user.packageName === pkg.name ? (
              <button
                disabled
                className="w-full bg-gray-400 text-white py-2 rounded"
              >
                Purchased
              </button>
            ) : (
              <button
                onClick={() => buyPackage(pkg)}
                disabled={processing}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                {processing ? "Processing..." : "Buy Now"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
