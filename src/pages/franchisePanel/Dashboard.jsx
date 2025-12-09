import React from "react";
import PageTemplate from "../PageTemplate";
export default function FranchiseDashboard(){ return <PageTemplate title="Franchise Dashboard" endpoint="/franchise/dashboard" columns={[{key:'metric',label:'Metric'},{key:'value',label:'Value'}]} />; }
