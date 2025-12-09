import React from "react";
import PageTemplate from "../PageTemplate";
export default function LevelIncome(){ return <PageTemplate title="Level Income" endpoint="/income/level" columns={[{key:'fromUser',label:'From'},{key:'amount',label:'Amount'},{key:'createdAt',label:'Date'}]} transform={r=>({...r, createdAt:new Date(r.createdAt).toLocaleString()})} />; }
