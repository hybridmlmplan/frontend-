import React from "react";
import PageTemplate from "../PageTemplate";
export default function EPINAdmin(){ return <PageTemplate title="EPIN Admin" endpoint="/admin/epins" columns={[{key:'epin',label:'EPIN'},{key:'status',label:'Status'},{key:'owner',label:'Owner'}]} />; }
