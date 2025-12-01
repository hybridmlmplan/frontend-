import { useEffect, useState } from "react";
import API from "../../utils/axiosInstance";

export default function GenealogyTree() {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/tree/my-tree")
      .then((res) => {
        setTree(res.data.tree);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading Genealogy Tree...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">
        My Team / Genealogy Tree
      </h1>

      {!tree ? (
        <div className="text-gray-600">No data available</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-4 border">
          <TreeNode node={tree} />
        </div>
      )}
    </div>
  );
}

// ⬇️ Recursive Tree Component (Future backend ready)
function TreeNode({ node }) {
  return (
    <div className="text-center p-4">
      {/* User Box */}
      <div className="inline-block bg-blue-100 border border-blue-400 px-4 py-2 rounded-lg shadow-sm text-blue-800 font-semibold">
        {node.name} <br />
        <span className="text-sm text-gray-700">{node.userId}</span>
      </div>

      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div className="flex justify-center gap-6 mt-4">
          {node.children.map((child, i) => (
            <TreeNode key={i} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
