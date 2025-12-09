import React from "react";
import PageTemplate from "../PageTemplate";
export default function PayoutRequests(){ return <PageTemplate title="Payout Requests" endpoint="/admin/payouts" columns={[{key:'user',label:'User'},{key:'amount',label:'Amount'},{key:'status',label:'Status'}]} />; }
