import React from "react";
import PageTemplate from "../PageTemplate";
export default function DirectsList(){ return <PageTemplate title="Directs List" endpoint="/user/directs" columns={[{key:'userCode',label:'User'},{key:'name',label:'Name'},{key:'package',label:'Package'}]} />; }
