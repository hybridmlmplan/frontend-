import React from "react";
import PageTemplate from "../PageTemplate";
export default function RoyaltyIncome(){ return <PageTemplate title="Royalty Income" endpoint="/income/royalty" columns={[{key:'userShare',label:'Amount'},{key:'userRankLevel',label:'Rank'},{key:'createdAt',label:'Date'}]} transform={r=>({...r, createdAt:new Date(r.createdAt).toLocaleString()})} />; }
