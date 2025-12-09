import React from "react";
import PageTemplate from "../PageTemplate";
export default function Settings(){ return <PageTemplate title="Settings" endpoint="/admin/settings" columns={[{key:'key',label:'Key'},{key:'value',label:'Value'}]} />; }
