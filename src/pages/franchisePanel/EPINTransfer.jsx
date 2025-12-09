import React from "react";
import PageTemplate from "../PageTemplate";
export default function EPINTransfer(){ return <PageTemplate title="EPIN Transfer" endpoint="/epin/transfers" columns={[{key:'epin',label:'EPIN'},{key:'from',label:'From'},{key:'to',label:'To'},{key:'createdAt',label:'Date'}]} />; }
