import React, { useEffect, useState } from "react";
import axios from "@/utils/axiosInstance";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const DirectsList = () => {
  const [loading, setLoading] = useState(true);
  const [directs, setDirects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchDirects();
  }, []);

  const fetchDirects = async () => {
    try {
      const res = await axios.get("/genealogy/directs");
      setDirects(res.data.directs);
      setFiltered(res.data.directs);
      setLoading(false);
    } catch (err) {
      console.error("Error loading directs", err);
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearch(text);

    let temp = [...directs];

    temp = temp.filter(
      (d) =>
        d.name.toLowerCase().includes(text.toLowerCase()) ||
        d.userId.toString().includes(text)
    );

    if (filterStatus !== "all") {
      temp = temp.filter((d) => d.status === filterStatus);
    }

    setFiltered(temp);
  };

  const handleFilter = (val) => {
    setFilterStatus(val);

    let temp = [...directs];

    if (search.trim() !== "") {
      temp = temp.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.userId.toString().includes(search)
      );
    }

    if (val !== "all") {
      temp = temp.filter((d) => d.status === val);
    }

    setFiltered(temp);
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center py-20">
        <Loader2 className="animate-spin w-10 h-10 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <h2 className="text-2xl font-semibold mb-6">My Directs (Level Star Requirement)</h2>

      {/* ---------------- Filters ---------------- */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by name or ID..."
          className="w-full md:w-1/3"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />

        <select
          className="border rounded-xl px-4 py-2 text-sm w-full md:w-40"
          value={filterStatus}
          onChange={(e) => handleFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* ---------------- Directs Summary ---------------- */}
      <Card className="mb-6 rounded-2xl shadow-md">
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Total Directs</p>
            <p className="text-xl font-bold">{directs.length}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-xl font-bold">
              {directs.filter((d) => d.status === "active").length}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="text-xl font-bold">
              {directs.filter((d) => d.status === "inactive").length}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Your Level Star Progress</p>
            <p className="text-xl font-bold">
              {directs.length}/10 (Star 1 Requirement)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- Directs List ---------------- */}
      <div className="grid gap-5">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 italic">No directs found</p>
        ) : (
          filtered.map((d) => (
            <Card key={d.userId} className="rounded-2xl shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">{d.name}</h3>

                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      d.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {d.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">ID</p>
                    <p className="font-semibold">{d.userId}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">Package</p>
                    <p className="font-semibold">{d.package}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">PV (Binary)</p>
                    <p className="font-semibold">{d.pv}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">BV (Repurchase)</p>
                    <p className="font-semibold">{d.bv}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">Placement</p>
                    <p className="font-semibold">{d.placement}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">Join Date</p>
                    <p className="font-semibold">{d.joined}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DirectsList;
