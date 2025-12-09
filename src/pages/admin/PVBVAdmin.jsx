import React from "react";
import PageTemplate from "../PageTemplate";
export default function PVBVAdmin(){ return <PageTemplate title="PV/BV Admin" endpoint="/admin/pvbv" columns={[{key:'user',label:'User'},{key:'pv',label:'PV'},{key:'bv',label:'BV'}]} />; }
