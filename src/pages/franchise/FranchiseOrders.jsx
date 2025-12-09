import React from "react";
import PageTemplate from "../PageTemplate";
export default function FranchiseOrders(){ return <PageTemplate title="Franchise Orders" endpoint="/franchise/orders" columns={[{key:'orderCode',label:'Order'},{key:'price',label:'Price'},{key:'processed',label:'Processed'}]} />; }
