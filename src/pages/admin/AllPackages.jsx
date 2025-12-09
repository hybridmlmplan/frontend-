import React from "react";
import PageTemplate from "../PageTemplate";
export default function AllPackages(){ return <PageTemplate title="All Packages" endpoint="/admin/packages" columns={[{key:'code',label:'Code'},{key:'price',label:'Price'},{key:'pv',label:'PV'}]} />; }
