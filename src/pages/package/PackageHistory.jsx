import React from "react";
import PageTemplate from "../../pages/PageTemplate";
export default function PackageHistory(){ return <PageTemplate title="Package History" endpoint="/order/user-orders" columns={[{key:'orderCode',label:'Order'},{key:'price',label:'Price'},{key:'createdAt',label:'Date'}]} transform={r=>({...r, createdAt: new Date(r.createdAt).toLocaleString()})}/>; }
