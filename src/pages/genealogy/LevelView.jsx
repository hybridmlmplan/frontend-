import React from "react";
import PageTemplate from "../PageTemplate";
export default function LevelView(){ return <PageTemplate title="Level View" endpoint="/user/levels" columns={[{key:'level',label:'Level'},{key:'count',label:'Count'}]} />; }
