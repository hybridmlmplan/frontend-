import React from "react";

export default function Card({ title, children, footer }) {
  return (
    <div className="bg-white rounded shadow p-4">
      {title && <div className="text-sm text-gray-500 mb-2">{title}</div>}
      <div className="mb-2">{children}</div>
      {footer && <div className="text-xs text-gray-400 mt-3">{footer}</div>}
    </div>
  );
}
