// src/components/Table.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Generic Table component
 *
 * Props:
 *  - columns: [{ key, header, sortable=false, width, render?: (row) => node }]
 *  - data: array of row objects
 *  - rowKey: string (property name for unique row id) OR (row)=>id
 *  - loading: boolean
 *  - error: string
 *  - selectable: boolean   // show checkboxes
 *  - onSelectionChange: fn(selectedIdsArray)
 *  - pagination: { pageSize: number, initialPage?: number } | null
 *  - onRowClick: fn(row)
 *  - className: extra classes
 *
 * Columns example:
 *  { key: 'name', header: 'Name', sortable: true, width: '40%', render: (r) => <b>{r.name}</b> }
 *
 * Usage:
 *  <Table
 *    columns={cols}
 *    data={rows}
 *    rowKey="id"
 *    selectable
 *    onSelectionChange={(ids)=>console.log(ids)}
 *    pagination={{pageSize:10}}
 *  />
 */

function sortData(data, sortBy) {
  if (!sortBy || !sortBy.key) return data;
  const { key, dir } = sortBy;
  const multiplier = dir === 'asc' ? 1 : -1;
  const sorted = [...data].sort((a, b) => {
    const va = a?.[key];
    const vb = b?.[key];
    // numeric or date compare fallback to string
    if (va == null && vb == null) return 0;
    if (va == null) return -1 * multiplier;
    if (vb == null) return 1 * multiplier;
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * multiplier;
    const da = Date.parse(va);
    const db = Date.parse(vb);
    if (!Number.isNaN(da) && !Number.isNaN(db)) return (da - db) * multiplier;
    return String(va).localeCompare(String(vb)) * multiplier;
  });
  return sorted;
}

export default function Table({
  columns,
  data,
  rowKey = 'id',
  loading = false,
  error = '',
  selectable = false,
  onSelectionChange,
  pagination = null,
  onRowClick,
  className = '',
  compact = false,
  emptyMessage = 'No records found.',
}) {
  const getRowId = React.useCallback(
    (row) => (typeof rowKey === 'function' ? rowKey(row) : row?.[rowKey]),
    [rowKey]
  );

  // Selection state
  const [selected, setSelected] = React.useState(new Set());

  React.useEffect(() => {
    // reset selection if data changes
    setSelected(new Set());
  }, [data]);

  React.useEffect(() => {
    if (onSelectionChange) onSelectionChange(Array.from(selected));
  }, [selected, onSelectionChange]);

  // Sorting state
  const [sortBy, setSortBy] = React.useState({ key: null, dir: 'asc' });

  const toggleSort = (col) => {
    if (!col.sortable) return;
    setSortBy((prev) => {
      if (prev.key !== col.key) return { key: col.key, dir: 'asc' };
      if (prev.dir === 'asc') return { key: col.key, dir: 'desc' };
      return { key: null, dir: 'asc' }; // disable sorting on third toggle
    });
  };

  // Pagination state
  const pageSize = pagination?.pageSize || 0;
  const initialPage = pagination?.initialPage || 1;
  const [page, setPage] = React.useState(initialPage);

  React.useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  // Derived data: sorted -> paged
  const sorted = React.useMemo(() => sortData(data || [], sortBy), [data, sortBy]);

  const totalItems = sorted.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;

  // clamp page
  React.useEffect(() => {
    if (pageSize > 0 && page > totalPages) setPage(totalPages);
  }, [page, pageSize, totalPages]);

  const paged = React.useMemo(() => {
    if (pageSize <= 0) return sorted;
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSize, page]);

  // Selection helpers
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllOnPage = (checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      paged.forEach((r) => {
        const id = getRowId(r);
        if (!id && id !== 0) return;
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const allOnPageSelected = paged.length > 0 && paged.every((r) => selected.has(getRowId(r)));
  const someOnPageSelected = paged.some((r) => selected.has(getRowId(r))) && !allOnPageSelected;

  // Render helpers
  const renderCell = (col, row) => {
    if (col.render) return col.render(row);
    const v = row?.[col.key];
    if (v === null || v === undefined) return '-';
    return String(v);
  };

  return (
    <div className={`w-full overflow-auto ${className}`}>
      <div className="min-w-full bg-white rounded-xl border shadow-sm">
        {/* Table header / Tools row */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-slate-700">Records</div>
            <div className="text-xs text-slate-500">
              {totalItems} item{totalItems !== 1 ? 's' : ''}
              {pageSize > 0 && ` • Page ${page}/${totalPages}`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Basic controls placeholder - you can pass in custom controls here if needed */}
            {loading && (
              <div className="text-xs text-slate-500">Loading…</div>
            )}
            {error && (
              <div className="text-xs text-red-500">{error}</div>
            )}
          </div>
        </div>

        {/* Actual table */}
        <table className="w-full table-auto text-sm">
          <thead className="text-xs text-slate-500 uppercase">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allOnPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someOnPageSelected;
                    }}
                    onChange={(e) => selectAllOnPage(e.target.checked)}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left align-middle ${col.width ? '' : ''}`}
                  style={{ width: col.width || undefined }}
                >
                  <div
                    className={`flex items-center gap-2 select-none ${col.sortable ? 'cursor-pointer' : ''}`}
                    onClick={() => toggleSort(col)}
                    role={col.sortable ? 'button' : undefined}
                    tabIndex={col.sortable ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (col.sortable && (e.key === 'Enter' || e.key === ' ')) toggleSort(col);
                    }}
                  >
                    <span className="font-medium text-slate-600">{col.header}</span>
                    {col.sortable && sortBy.key === col.key && (
                      <SortIcon dir={sortBy.dir} />
                    )}
                    {col.sortable && sortBy.key !== col.key && (
                      <SortHint />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // loading skeleton rows
              Array.from({ length: Math.max(3, pageSize || 3) }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  {selectable && <td className="px-4 py-3"><div className="h-4 w-4 bg-slate-200 rounded" /></td>}
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={(selectable ? 1 : 0) + columns.length} className="px-4 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => {
                const id = getRowId(row);
                const isSelected = selected.has(id);
                return (
                  <tr
                    key={id ?? idx}
                    className={`border-b last:border-b-0 hover:bg-slate-50 ${compact ? 'text-sm' : ''}`}
                    onClick={(e) => {
                      // avoid row click when clicking checkbox or button
                      if (e.target.closest('input') || e.target.closest('button')) return;
                      if (onRowClick) onRowClick(row);
                    }}
                    role={onRowClick ? 'button' : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (onRowClick && (e.key === 'Enter' || e.key === ' ')) onRowClick(row);
                    }}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(id)}
                          aria-label={`Select row ${id}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          {col.render ? (
                            col.render(row)
                          ) : (
                            <span className="text-slate-700">{renderCell(col, row)}</span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer / Pagination controls */}
        {pageSize > 0 && totalItems > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t bg-slate-50 rounded-b-xl">
            <div className="text-xs text-slate-600">
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalItems)} of {totalItems}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className={`px-2 py-1 rounded-md text-xs ${page <= 1 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100'}`}
                aria-label="First page"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`px-2 py-1 rounded-md text-xs ${page <= 1 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100'}`}
                aria-label="Previous page"
              >
                ‹
              </button>

              <span className="text-xs text-slate-600 px-2">Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={page}
                onChange={(e) => {
                  const v = Number(e.target.value || 1);
                  if (!Number.isFinite(v)) return;
                  setPage(Math.min(Math.max(1, v), totalPages));
                }}
                className="w-12 text-center text-xs rounded border px-1 py-0.5"
                aria-label="Current page"
              />
              <span className="text-xs text-slate-500">/ {totalPages}</span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={`px-2 py-1 rounded-md text-xs ${page >= totalPages ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100'}`}
                aria-label="Next page"
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className={`px-2 py-1 rounded-md text-xs ${page >= totalPages ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100'}`}
                aria-label="Last page"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.node.isRequired,
      sortable: PropTypes.bool,
      width: PropTypes.string,
      render: PropTypes.func,
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  rowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  loading: PropTypes.bool,
  error: PropTypes.string,
  selectable: PropTypes.bool,
  onSelectionChange: PropTypes.func,
  pagination: PropTypes.shape({
    pageSize: PropTypes.number.isRequired,
    initialPage: PropTypes.number,
  }),
  onRowClick: PropTypes.func,
  className: PropTypes.string,
  compact: PropTypes.bool,
  emptyMessage: PropTypes.string,
};

/* Small inline icons */
function SortIcon({ dir = 'asc' }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden className="inline-block">
      {dir === 'asc' ? (
        <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function SortHint() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden className="inline-block opacity-40">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
