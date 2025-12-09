import React from "react";
import PageTemplate from "../PageTemplate";
export default function PercentageIncome(){ return <PageTemplate title="Percentage Income" endpoint="/income/percentage" columns={[{key:'level',label:'Level'},{key:'amount',label:'Amount'},{key:'createdAt',label:'Date'}]} />; }
