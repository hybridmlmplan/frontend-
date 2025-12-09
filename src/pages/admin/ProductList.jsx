import React from "react";
import PageTemplate from "../PageTemplate";
export default function ProductList(){ return <PageTemplate title="Products" endpoint="/admin/products" columns={[{key:'name',label:'Name'},{key:'price',label:'Price'},{key:'pv',label:'PV'}]} />; }
