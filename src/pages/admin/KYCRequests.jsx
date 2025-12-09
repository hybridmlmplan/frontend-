import React from "react";
import PageTemplate from "../PageTemplate";
export default function KYCRequests(){ return <PageTemplate title="KYC Requests" endpoint="/admin/kyc" columns={[{key:'user',label:'User'},{key:'status',label:'Status'},{key:'createdAt',label:'Date'}]} />; }
