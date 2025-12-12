// src/components/SessionClock.jsx
import React from 'react';
import PropTypes from 'prop-types';
import {
  SESSION_TIMINGS,
  parseTimeToToday,
  getCurrentSessionFromTimings,
  getNextSessionFromTimings,
} from '../utils';

/**
 * SessionClock
 *
 * Shows current session (id, start-end), a live countdown to session end (or to next session start
 * when outside sessions), and a progress bar for the current session.
 *
 * Uses SESSION_TIMINGS from utils which are defined according to the business plan:
 *   06:00–08:15, 08:15–10:30, ... , 21:45–00:00 (midnight crossing handled)
 *
 * Paste this file at src/components/SessionClock.jsx
 */

function pad(n) {
  return n.toString().padStart(2, '0');
}

function formatTimeLeft(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

/** Convert "HH:MM" to a Date for display (today/local). If end <= start the caller should treat it as next-day end. */
function timeStrForDisplay(timeStr) {
  const d = parseTimeToToday(timeStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function SessionClock({ compact = false, className = '' }) {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const tid = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tid);
  }, []);

  // Determine current session (if any) and next session
  const current = getCurrentSessionFromTimings();
  const next = getNextSessionFromTimings();

  // Helper to compute start/end Date objects for a session, handling midnight cross
  const sessionWindow = (session) => {
    if (!session) return null;
    const start = parseTimeToToday(session.start);
    let end = parseTimeToToday(session.end);
    if (end <= start) end.setDate(end.getDate() + 1); // crosses midnight
    return { start, end };
  };

  // If we are in a current session: show remaining time to end and progress
  let mainLabel = '';
  let subLabel = '';
  let pct = 0;
  let timeLeftSeconds = 0;
  let sessionObj = null;

  if (current) {
    sessionObj = sessionWindow(current);
    const totalMs = sessionObj.end - sessionObj.start;
    const elapsedMs = now - sessionObj.start;
    timeLeftSeconds = Math.max(0, Math.round((sessionObj.end - now) / 1000));
    pct = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));
    mainLabel = `Session ${current.id} (${current.start} → ${current.end})`;
    subLabel = `Ends in ${formatTimeLeft(timeLeftSeconds)}`;
  } else if (next) {
    // Not inside any session; show countdown to next session start
    const nextWindow = sessionWindow(next);
    const toStartSeconds = Math.max(0, Math.round((nextWindow.start - now) / 1000));
    timeLeftSeconds = toStartSeconds;
    pct = 0;
    mainLabel = `No active session`;
    subLabel = `Next: Session ${next.id} begins in ${formatTimeLeft(timeLeftSeconds)} (${next.start})`;
  } else {
    // Fallback (shouldn't happen because getNextSessionFromTimings returns first if none)
    mainLabel = 'Session data unavailable';
    subLabel = '';
  }

  // Small list of all sessions for UI (compact mode toggles)
  const sessionList = SESSION_TIMINGS.map((s) => {
    // compute approximate duration in minutes
    const start = parseTimeToToday(s.start);
    let end = parseTimeToToday(s.end);
    if (end <= start) end.setDate(end.getDate() + 1);
    const durationMinutes = Math.round((end - start) / 60000);
    return {
      ...s,
      durationMinutes,
    };
  });

  return (
    <div
      className={`w-full max-w-md bg-white/80 border rounded-2xl p-4 shadow-sm ${className}`}
      role="region"
      aria-live="polite"
      aria-label="Session clock"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">Current Session</div>
          <div className="mt-1 text-sm font-semibold text-slate-800">{mainLabel}</div>
          <div className="text-xs text-slate-500 mt-1">{subLabel}</div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500">Now</div>
          <div className="text-sm font-mono text-slate-700">{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${current ? 'bg-gradient-to-r from-emerald-400 to-green-600' : 'bg-amber-400'}`}
            style={{ width: `${pct}%` }}
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <div>{current ? `Progress: ${pct}%` : 'Idle'}</div>
          <div>{current ? formatTimeLeft(timeLeftSeconds) : `Next: ${next ? `${next.start}` : '—'}`}</div>
        </div>
      </div>

      {/* Compact toggle / session timings list */}
      {!compact && (
        <details className="mt-4 text-sm text-slate-600">
          <summary className="cursor-pointer select-none">Session schedule (8 sessions)</summary>
          <ul className="mt-3 space-y-2">
            {sessionList.map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-xs font-medium text-slate-700">S{String(s.id).padStart(2, '0')}</div>
                  <div className="text-xs text-slate-500">{s.start} — {s.end}</div>
                </div>
                <div className="text-xs text-slate-400">{s.durationMinutes} min</div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

SessionClock.propTypes = {
  /** If true, hide the collapsible session schedule (compact UI) */
  compact: PropTypes.bool,
  className: PropTypes.string,
};
