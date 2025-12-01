import React from "react";
import { Link } from "react-router-dom";

const GenealogyIndex = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Genealogy</h2>

      <div className="grid grid-cols-1 gap-4">

        <Link
          to="/genealogy/tree"
          className="p-4 bg-white rounded shadow hover:bg-gray-100 transition"
        >
          🔵 Binary Tree View
        </Link>

        <Link
          to="/genealogy/level-tree"
          className="p-4 bg-white rounded shadow hover:bg-gray-100 transition"
        >
          🟢 Level Tree View
        </Link>

        <Link
          to="/genealogy/direct-team"
          className="p-4 bg-white rounded shadow hover:bg-gray-100 transition"
        >
          🟡 Direct Team Members
        </Link>

      </div>
    </div>
  );
};

export default GenealogyIndex;
