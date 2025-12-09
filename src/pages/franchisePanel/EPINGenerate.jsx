import React from "react";
import PageTemplate from "../PageTemplate";
export default function EPINGenerate(){ return <PageTemplate title="EPIN Generate" endpoint="/epin/list" columns={[{key:'epin',label:'EPIN'},{key:'status',label:'Status'},{key:'owner',label:'Owner'}]} />; }
