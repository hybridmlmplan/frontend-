import React from "react";
import PageTemplate from "../PageTemplate";
export default function BVSummary(){ return <PageTemplate title="BV Summary" endpoint="/bv/summary" columns={[{key:'totalBV',label:'Total BV'},{key:'usedBV',label:'Used'},{key:'availableBV',label:'Available'}]} />; }
