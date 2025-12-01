import { useEffect, useState } from "react";
import axios from "axios";

export default function FranchiseWallet() {
  const franchiseId = localStorage.getItem("userid");

  const [wallet, setWallet] = useState({
    balance: 0,
    todayIncome: 0,
    totalIncome: 0,
  });

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/franchise/wallet/${franchiseId}`
      );

      setWallet({
        balance: res.data.balance || 0,
        todayIncome: res.data.todayIncome || 0,
        totalIncome: res.data.totalIncome || 0,
      });

      setHistory(res.data.history || []);
    } catch (err) {
      console.error("Franchise Wallet Fetch Error:", err);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-5">
        Franchise Wallet
      </h1>

      {/* Wallet Summary */}
      <div className="grid md:grid-cols-3 gap-4 mb
