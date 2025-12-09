import React from "react";
import PageTemplate from "../PageTemplate";
export default function LevelControl(){ return <PageTemplate title="Level Control" endpoint="/admin/levels" columns={[{key:'level',label:'Level'},{key:'percent',label:'Percent'}]} />; }
