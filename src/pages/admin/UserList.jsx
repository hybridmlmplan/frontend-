import React from "react";
import PageTemplate from "../PageTemplate";
export default function UserList(){ return <PageTemplate title="Users" endpoint="/admin/users" columns={[{key:'userCode',label:'User'},{key:'name',label:'Name'},{key:'phone',label:'Phone'},{key:'package',label:'Package'}]} />; }
