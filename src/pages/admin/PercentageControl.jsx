import React from "react";
import PageTemplate from "../PageTemplate";
export default function PercentageControl(){ return <PageTemplate title="Percentage Control" endpoint="/admin/percentages" columns={[{key:'name',label:'Name'},{key:'value',label:'Value'}]} />; }
