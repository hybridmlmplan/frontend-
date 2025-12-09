import React from "react";
import PageTemplate from "../PageTemplate";
export default function Orders(){ return <PageTemplate title="Orders" endpoint="/admin/orders" columns={[{key:'orderCode',label:'Order'},{key:'buyer',label:'Buyer'},{key:'price',label:'Price'}]} />; }
