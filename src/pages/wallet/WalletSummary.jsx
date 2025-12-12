import React, { useEffect, useState } from "react";

const WalletSummary = () => {
  const [wallet, setWallet] = useState({
    mainWallet: 0,
    fundWallet: 0,
    royaltyWallet: 0,
    rankIncomeWallet: 0,
    withdrawable: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- SAFE DUMMY FETCH ---
    // Replace this with your backend API:
    // GET /api/wallet/summary
    const fetchWallet = async () => {
      setLoading(true);

      // Dummy static example (no real money logic)
      setWallet({
        mainWallet: 0,
        fundWallet: 0,
        royaltyWallet: 0,
        rankIncomeWallet: 0,
        withdrawable: 0,
      });

      setLoading(false);
    };

    fetchWallet();
  }, []);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Wallet Summary</h2>

      {loading ? (
        <p>Loading wallet data...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">

          <div className="border p-4 rounded-lg shadow">
            <h3 className="font-semibold">Main Wallet</h3>
            <p className="text-2xl font-bold mt-2">₹{wallet.mainWallet}</p>
          </div>

          <div className="border p-4 rounded-lg shadow">
            <h3 className="font-semibold">Fund Wallet</h3>
            <p className="text-2xl font-bold mt-2">₹{wallet.fundWallet}</p>
          </div>

          <div className="border p-4 rounded-lg shadow">
            <h3 className="font-semibold">Royalty Wallet</h3>
            <p className="text-2xl font-bold mt-2">₹{wallet.royaltyWallet}</p>
          </div>

          <div className="border p-4 rounded-lg shadow">
            <h3 className="font-semibold">Rank Income Wallet</h3>
            <p className="text-2xl font-bold mt-2">₹{wallet.rankIncomeWallet}</p>
          </div>

          <div className="border p-4 rounded-lg shadow bg-green-50">
            <h3 className="font-semibold">Withdrawable Balance</h3>
            <p className="text-2xl font-bold mt-2 text-green-700">
              ₹{wallet.withdrawable}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletSummary;
