import React from "react";
import PageTemplate from "../PageTemplate";
export default function FundIncome(){ return <PageTemplate title="Fund Income" endpoint="/income/fund" columns={[{key:'type',label:'Fund'},{key:'amount',label:'Amount'},{key:'createdAt',label:'Date'}]} />; }
