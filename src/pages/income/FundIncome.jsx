import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// FundIncome.jsx — Fully based on your FINAL BUSINESS PLAN
// Includes: Car Fund (2%), House Fund (2%), Travel Fund (National/International)
// BV-based income only
// Auto-calculated from backend API

export default function FundIncome() {
  const [loading, setLoading] = useState(true);
  const [fundData, setFundData] = useState(null);

  useEffect(() => {
    fetchFundIncome();
  }, []);

  const fetchFundIncome = async () => {
    try {
      // API — GET /api/income/fund
      const res = await fetch("/api/income/fund", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setFundData(data);
    } catch (err) {
      console.error("Fund Income Fetch Error", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!fundData) {
    return (
      <div className="text-center text-red-500 py-10">
        Unable to load fund income data.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-2xl font-bold">Fund Income</h2>
      <p className="text-sm text-gray-600">
        (Car Fund • House Fund • Travel Fund — All BV Based)
      </p>

      {/* Car Fund */}
      <Card className="shadow-md rounded-2xl">
        <CardContent className="p-5 space-y-2">
          <h3 className="text-xl font-semibold">Car Fund (Monthly 2%)</h3>
          <p className="text-gray-600 text-sm">
            Eligibility: Ruby Star & Above
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div className="p-3 rounded-xl bg-gray-100">
              <p className="text-xs text-gray-500">Total Pool BV</p>
              <p className="text-lg font-bold">{fundData.carFund.poolBV}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-100">
              <p className="text-xs text-gray-500">Your Share (%)</p>
              <p className="text-lg font-bold">{fundData.carFund.userPercent}%</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-100">
              <p className="text-xs text-gray-500">Your Income</p>
              <p className="text-lg font-bold text-green-600">₹{fundData.carFund.amount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* House Fund */}
      <Card className="shadow-md rounded-2xl">
        <CardContent className="p-5 space-y-2">
          <h3 className="text-xl font-semibold">House Fund (Monthly 2%)</h3>
          <p className="text-sm text-gray-600">
            Eligibility: Diamond Star & Above
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div className="p-3 rounded-xl bg-gray-100">
              <p className="text-xs text-gray-500">Total Pool BV</p>
              <p className="text-lg font-bold">{fundData.houseFund.poolBV}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-100">
              <p className="text-xs text-gray-500">Your Share (%)</p>
              <p className="text-lg font-bold">{fundData.houseFund.userPercent}%</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-100">
              <p className="text-xs text-gray-500">Your Income</p>
              <p className="text-lg font-bold text-green-600">₹{fundData.houseFund.amount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Travel Fund */}
      <Card className="shadow-md rounded-2xl">
        <CardContent className="p-5 space-y-2">
          <h3 className="text-xl font-semibold">Travel Fund (Yearly)</h3>
          <p className="text-sm text-gray-600">
            Eligibility: Ruby Star → National • Diamond Star → International
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div className="p-3 rounded-xl bg-gray-100">
              <p className="text-xs text-gray-500">Tour Type</p>
              <p className="text-lg font-bold">{fundData.travelFund.type}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-100">
              <p className="text-xs text-gray-500">Eligibility Rank</p>
              <p className="font-bold">{fundData.travelFund.rank}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-100">
              <p className="text-xs text-gray-500">Value (₹)</p>
              <p className="text-lg font-bold text-green-600">₹{fundData.travelFund.amount}</p>
            </div>
          </div>

          <Button className="w-full mt-4">View Detailed Travel Benefits</Button>
        </CardContent>
      </Card>
    </div>
  );
}
