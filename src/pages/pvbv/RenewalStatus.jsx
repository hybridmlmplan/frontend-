import React from "react";
import PageTemplate from "../PageTemplate";
export default function RenewalStatus(){ return <PageTemplate title="Renewal Status (Note: No renewal in system)" endpoint="/pv/renewal-status" columns={[{key:'package',label:'Package'},{key:'status',label:'Status'}]} />; }
