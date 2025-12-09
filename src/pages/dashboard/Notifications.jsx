import React, { useEffect, useState } from "react";
import api from "../../api";
import PageTemplate from "../PageTemplate";

export default function Notifications(){
  return <PageTemplate title="Notifications" endpoint="/notify/my" columns={[{key:'title',label:'Title'},{key:'message',label:'Message'},{key:'createdAt',label:'Date'}]} transform={r => ({...r, createdAt: new Date(r.createdAt).toLocaleString()})} />;
}
