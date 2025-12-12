// src/components/Loader.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Loader component (spinner + optional label)
 *
 * Usage examples:
 * <Loader />                              // small inline spinner
 * <Loader size="lg" label="Loading..." /> // larger with text
 * <Loader fullScreen />                   // centered overlay fullscreen
 * <Loader variant="button" />             // spinner sized for button
 * <Loader skeleton rows={3} />           // skeleton placeholder rows
 *
 * Props:
 * - size: 'xs'|'sm'|'md'|'lg' (controls spinner size)
 * - label: optional label text shown beside/below spinner
 * - fullScreen: boolean -> renders centered overlay that covers viewport
 * - variant: 'inline'|'center'|'button'|'skeleton'
 * - rows: number (for skeleton variant, default 2)
 * - className: extra classes for container
 * - ariaLabel: accessibility label
 */

function Spinner({ size = 'md', className = '' }) {
  // Map size to Tailwind width/height & stroke
  const sizeMap = {
    xs: 'w-4 h-4 border-2',
    sm: 'w-5 h-5 border-2',
    md: 'w-6 h-6 border-2.5',
    lg: 'w-8 h-8 border-3',
  };
  const sz = sizeMap[size] || sizeMap.md;

  return (
    <svg
      className={`${sz} animate-spin text-blue-600 ${className}`}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

Spinner.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default function Loader({
  size = 'md',
  label = '',
  fullScreen = false,
  variant = 'inline',
  rows = 2,
  className = '',
  ariaLabel = 'Loading',
}) {
  // Skeleton rows for placeholder variant
  if (variant === 'skeleton') {
    const r = Math.max(1, Number(rows || 2));
    return (
      <div className={`space-y-3 ${className}`} aria-hidden="true">
        {Array.from({ length: r }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-slate-100 rounded animate-pulse"
            style={{ width: `${80 - i * 10}%` }}
          />
        ))}
      </div>
    );
  }

  // content for spinner + optional label
  const content = (
    <div
      className={`flex items-center gap-3 ${variant === 'button' ? 'inline-flex' : 'flex'} `}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <Spinner size={size} />
      {label ? (
        <span className="text-sm text-slate-700">{label}</span>
      ) : null}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm ${className}`}
        aria-label={ariaLabel}
      >
        <div className="bg-white/90 dark:bg-slate-800/90 rounded-xl p-6 shadow-lg flex flex-col items-center gap-4">
          {content}
        </div>
      </div>
    );
  }

  // Center variant: centered block (not overlay)
  if (variant === 'center') {
    return (
      <div className={`w-full flex items-center justify-center py-6 ${className}`} aria-label={ariaLabel}>
        {content}
      </div>
    );
  }

  // 'button' or 'inline' variants - return inline element
  return <div className={`${className}`}>{content}</div>;
}

Loader.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  label: PropTypes.string,
  fullScreen: PropTypes.bool,
  variant: PropTypes.oneOf(['inline', 'center', 'button', 'skeleton']),
  rows: PropTypes.number,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};
