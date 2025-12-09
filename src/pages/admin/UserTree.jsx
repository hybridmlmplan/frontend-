import React from "react";
import PageTemplate from "../PageTemplate";
export default function UserTree(){ return <PageTemplate title="User Tree" endpoint="/admin/user-tree" columns={[{key:'userCode',label:'User'},{key:'sponsor',label:'Sponsor'},{key:'placement',label:'Placement'}]} />; }
