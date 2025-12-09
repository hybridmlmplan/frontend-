import React, { useEffect, useState } from "react";
import api from "../api";
import Table from "../components/Table";
import Loader from "../components/Loader";

/**
 * Usage:
 * const MyPage = () => <PageTemplate title="Pair Income" endpoint="/income/pair" columns={[{key:'createdAt',label:'Date'},{key:'amount',label:'Amount'}]} />
 */
export default function PageTemplate({ title, endpoint, columns = [], transform = null }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(endpoint).then(r => {
      if (!mounted) return;
      const payload = r.data?.data ?? [];
      setData(transform ? payload.map(transform) : payload);
      setLoading(false);
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [endpoint]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {loading ? <Loader /> : <Table columns={columns} data={data} />}
    </div>
  );
}
