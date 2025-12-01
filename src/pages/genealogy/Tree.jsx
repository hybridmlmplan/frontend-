import React, { useEffect, useState } from "react";
import axios from "axios";

const Tree = () => {
  const [rootUser, setRootUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // NOTE: API Route => /api/genealogy/tree/:userid
  // App.jsx me already route set hai => /genealogy/tree
  const userId = localStorage.getItem("userid");

  const fetchTree = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/genealogy/tree/${userId}`
      );
      setRootUser(res.data.root || null);
    } catch (e) {
      console.error("Tree Load Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const NodeBox = ({ data }) => {
    if (!data) {
      return (
        <div className="border p-2 bg-red-100 text-center text-sm rounded">
          Empty
        </div>
      );
    }

    return (
      <div className="border bg-white p-2 rounded shadow text-center min-w-[120px]">
        <p className="font-bold">{data.username}</p>
        <p className="text-xs text-gray-600">{data.packageName}</p>
        <p className="text-xs text-blue-600">PV: {data.pv}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600 text-lg">
        Loading Binary Tree...
      </div>
    );
  }

  return (
    <div className="p-4">

      <h2 className="text-xl font-bold mb-4">Binary Genealogy Tree</h2>

      {!rootUser ? (
        <p className="text-center text-red-600">No Tree Found</p>
      ) : (
        <div className="flex flex-col items-center gap-8">

          {/* ROOT */}
          <NodeBox data={rootUser} />

          {/* LEVEL 1 (LEFT + RIGHT) */}
          <div className="flex gap-8">
            <NodeBox data={rootUser.left} />
            <NodeBox data={rootUser.right} />
          </div>

          {/* LEVEL 2 */}
          <div className="flex gap-20">

            <div className="flex flex-col items-center gap-4">
              <NodeBox data={rootUser.left?.left} />
              <NodeBox data={rootUser.left?.right} />
            </div>

            <div className="flex flex-col items-center gap-4">
              <NodeBox data={rootUser.right?.left} />
              <NodeBox data={rootUser.right?.right} />
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Tree;
