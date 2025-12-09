import React from "react";
import PageTemplate from "../PageTemplate";
export default function PVSummary(){ return <PageTemplate title="PV Summary" endpoint="/pv/summary" columns={[{key:'totalPV',label:'Total PV'},{key:'usedPV',label:'Used'},{key:'availablePV',label:'Available'}]} />; }
