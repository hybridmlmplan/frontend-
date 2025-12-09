import React from "react";
import PageTemplate from "../PageTemplate";
export default function FundRequests(){ return <PageTemplate title="Fund Requests" endpoint="/admin/fund-requests" columns={[{key:'user',label:'User'},{key:'amount',label:'Amount'},{key:'status',label:'Status'}]} />; }
