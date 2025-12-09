import React from "react";
import PageTemplate from "../PageTemplate";
export default function AllIncomes(){ return <PageTemplate title="All Incomes" endpoint="/admin/ledgers/bv" columns={[{key:'userId',label:'User'},{key:'amount',label:'Amount'},{key:'type',label:'Type'},{key:'createdAt',label:'Date'}]} transform={r=>({...r, createdAt:new Date(r.createdAt).toLocaleString()})} />; }
