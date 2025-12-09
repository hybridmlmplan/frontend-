import React from "react";
import PageTemplate from "../PageTemplate";
export default function FundHistory(){ return <PageTemplate title="Fund History" endpoint="/wallet/ledger" columns={[{key:'txId',label:'Tx'},{key:'amount',label:'Amount'},{key:'status',label:'Status'},{key:'createdAt',label:'Date'}]} transform={r=>({...r, createdAt:new Date(r.createdAt).toLocaleString()})} />; }
