import React from "react";
import PageTemplate from "../PageTemplate";
export default function OrderHistory(){ return <PageTemplate title="Order History" endpoint="/franchise/orders" columns={[{key:'orderCode',label:'Order'},{key:'price',label:'Price'},{key:'createdAt',label:'Date'}]} />; }
