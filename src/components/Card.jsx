// src/components/Card.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable Card component for Hybrid MLM frontend
 *
 * Props:
 * - variant: 'default' | 'package' | 'rank' | 'income'  (controls visuals)
 * - title: string
 * - subtitle: string (small text under title)
 * - children: React node (main body)
 * - footer: React node (footer actions/info)
 * - status: 'red'|'green'|'pending'|'info' (renders badge)
 * - action: { label, onClick, disabled } (optional primary action button)
 * - icon: React node (optional icon/avatar)
 * - loading: boolean (shows skeleton)
 *
 * Usage:
 * <Card variant="package" title="Silver" subtitle="₹35" status="pending" action={{label:'Activate', onClick:()=>{}}}>
 *   <div>PV: 35 • Pair: ₹10</div>
 * </Card>
 */

function StatusBadge({ status }) {
  if (!status) return null;
  const map = {
    red: { text: 'Pending', classes: 'bg-pairRed/10 text-pairRed border border-pairRed' },
    green: { text: 'Paid', classes: 'bg-pairGreen/10 text-pairGreen border border-pairGreen' },
    pending: { text: 'Pending', classes: 'bg-amber-50 text-amber-600 border border-amber-200' },
    info: { text: 'Info', classes: 'bg-sky-50 text-sky-600 border border-sky-100' },
  };
  const cfg = map[status] || map.info;
  return (
    <span
      role="status"
      aria-label={`status-${status}`}
      className={`inline-flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full ${cfg.classes}`}
    >
      {cfg.text}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['red', 'green', 'pending', 'info']),
};

export default function Card({
  variant = 'default',
  title,
  subtitle,
  children,
  footer,
  status,
  action,
  icon,
  loading = false,
  className = '',
  ...rest
}) {
  // Visual tweaks by variant
  const variantStyles = {
    default: 'bg-white',
    package: 'bg-gradient-to-br from-white to-slate-50 border',
    rank: 'bg-white/95 border',
    income: 'bg-white border-l-4',
  };
  // package-specific accent: silver/gold/ruby detection via title (small heuristic)
  const accentClass =
    variant === 'package'
      ? title && title.toLowerCase().includes('silver')
        ? 'ring-1 ring-slate-200'
        : title && title.toLowerCase().includes('gold')
        ? 'ring-1 ring-yellow-200'
        : title && title.toLowerCase().includes('ruby')
        ? 'ring-1 ring-rose-200'
        : 'ring-1 ring-slate-100'
      : '';

  return (
    <article
      role="article"
      aria-label={title || 'card'}
      className={`rounded-2xl shadow-soft ${variantStyles[variant] || variantStyles.default} ${accentClass} ${className} overflow-hidden`}
      {...rest}
    >
      <div className="flex items-start gap-4 p-4 md:p-5">
        {icon ? (
          <div className="shrink-0 h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl">
            {icon}
          </div>
        ) : null}

        <div className="flex-1 min-w-0">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {loading ? (
                <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
              ) : (
                <h3 className="text-sm md:text-base font-semibold text-slate-800 truncate">{title}</h3>
              )}
              {subtitle && !loading ? (
                <p className="text-xs text-slate-500 mt-1 truncate">{subtitle}</p>
              ) : loading && (
                <div className="mt-2 h-3 w-28 bg-slate-200 rounded animate-pulse" />
              )}
            </div>

            <div className="flex items-center gap-2">
              {!loading && status ? <StatusBadge status={status} /> : null}
            </div>
          </div>

          {/* Body */}
          <div className="mt-3">
            {loading ? (
              <>
                <div className="h-3 w-full bg-slate-100 rounded animate-pulse mb-2" />
                <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse mb-2" />
              </>
            ) : (
              <div className="text-sm text-slate-700">{children}</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {(footer || action) && (
        <div className="border-t px-4 md:px-5 py-3 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">{footer}</div>

          {action ? (
            <button
              type="button"
              aria-label={action.label || 'action'}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`ml-auto inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 
                ${action.disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {action.icon ? <span className="-ml-1">{action.icon}</span> : null}
              <span>{action.label}</span>
            </button>
          ) : null}
        </div>
      )}
    </article>
  );
}

Card.propTypes = {
  variant: PropTypes.oneOf(['default', 'package', 'rank', 'income']),
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  children: PropTypes.node,
  footer: PropTypes.node,
  status: PropTypes.oneOf(['red', 'green', 'pending', 'info']),
  action: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    icon: PropTypes.node,
  }),
  icon: PropTypes.node,
  loading: PropTypes.bool,
  className: PropTypes.string,
};
