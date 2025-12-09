import React, { useEffect, useState } from "react";
import api from "../../api";

export default function TreeView(){
  const [tree, setTree] = useState(null);
  useEffect(()=>{ api.get("/user/genealogy").then(r=>setTree(r.data.data)).catch(()=>{}); }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Genealogy</h2>
      <div className="bg-white p-4 rounded shadow">
        {tree ? <pre className="text-xs">{JSON.stringify(tree, null, 2)}</pre> : "Loading..."}
      </div>
    </div>
  );
}
