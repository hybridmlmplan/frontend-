import React from "react";
import PageTemplate from "../PageTemplate";
export default function NotificationsAdmin(){ return <PageTemplate title="Notifications" endpoint="/admin/notifications" columns={[{key:'title',label:'Title'},{key:'message',label:'Message'},{key:'createdAt',label:'Date'}]} />; }
