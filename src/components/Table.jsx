import React from "react";

/**
 * Simple reusable table.
 * props:
 * - columns: [{ key, label }]
 * - data: array of rows (objects)
 * - renderRow? (optional) custom row renderer: (row) => jsx
 */
export default function Table({ columns = [], data = [], renderRow = null }) {
  return (
    <div className="overflow-auto bg-white rounded shadow">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(c => (
              <th key={c.key} className="text-left px-4 py-2 text-sm font-medium text-gray-600">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr><td colSpan={columns.length} className="p-4 text-center text-gray-500">No data</td></tr>
          )}
          {data.map((row, idx) => (
            renderRow ? (
              <React.Fragment key={idx}>{renderRow(row, idx)}</React.Fragment>
            ) : (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {columns.map(c => (
                  <td key={c.key} className="px-4 py-2 text-sm text-gray-700">{String(row[c.key] ?? "")}</td>
                ))}
              </tr>
            )
          ))}
        </tbody>
      </table>
    </div>
  );
}
