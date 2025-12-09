import React from "react";

/**
 * Controlled input with label and error.
 * props: label, value, onChange, type, placeholder, className
 */
export default function Input({ label, value, onChange, type = "text", placeholder = "", className = "", error = "" }) {
  return (
    <div className="mb-3">
      {label && <label className="block text-sm text-gray-600 mb-1">{label}</label>}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className={`w-full border p-2 rounded ${className}`}
      />
      {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </div>
  );
}
