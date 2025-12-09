import React from "react";
import PageTemplate from "../PageTemplate";
export default function FranchiseSettings(){ return <PageTemplate title="Franchise Settings" endpoint="/franchise/settings" columns={[{key:'key',label:'Key'},{key:'value',label:'Value'}]} />; }
