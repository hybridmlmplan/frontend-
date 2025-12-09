import React from "react";
import PageTemplate from "../PageTemplate";
export default function FranchiseList(){ return <PageTemplate title="Franchises" endpoint="/admin/franchises" columns={[{key:'franchiseId',label:'Franchise'},{key:'user',label:'Holder'},{key:'commissionPercent',label:'Commission'}]} />; }
