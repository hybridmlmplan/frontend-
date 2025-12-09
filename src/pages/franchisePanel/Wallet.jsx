import React from "react";
import PageTemplate from "../PageTemplate";
export default function FranchiseWallet(){ return <PageTemplate title="Franchise Wallet" endpoint="/franchise/wallet" columns={[{key:'balance',label:'Balance'},{key:'pending',label:'Pending'},{key:'updatedAt',label:'Updated'}]} />; }
