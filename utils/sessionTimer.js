// src/utils/sessionTimer.js
// Helpers for 8 sessions per day, 2h15m each
// Returns sessionIndex (1..8) and remaining ms for current session

export const SESSION_SCHEDULE = [
  ["06:00", "08:15"],
  ["08:15", "10:30"],
  ["10:30", "12:45"],
  ["12:45", "15:00"],
  ["15:00", "17:15"],
  ["17:15", "19:30"],
  ["19:30", "21:45"],
  ["21:45", "00:00"]
];

function parseTime(base, hhmm) {
  const [hh, mm] = hhmm.split(":").map(Number);
  const d = new Date(base);
  d.setHours(hh, mm, 0, 0);
  return d;
}

export function getSessionInfo(now = new Date()) {
  // returns { sessionIndex: 1..8 or null, start: Date, end: Date, timeLeftMs }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i < SESSION_SCHEDULE.length; i++) {
    let [s, e] = SESSION_SCHEDULE[i];
    let start = parseTime(today, s);
    let end = parseTime(today, e);
    // handle midnight end (end <= start)
    if (end <= start) end.setDate(end.getDate() + 1);

    if (now >= start && now < end) {
      return { sessionIndex: i + 1, start, end, timeLeftMs: end - now };
    }
  }
  // If none matched, return next upcoming session (useful for UI)
  for (let i = 0; i < SESSION_SCHEDULE.length; i++) {
    let [s] = SESSION_SCHEDULE[i];
    let start = parseTime(today, s);
    if (start > now) return { sessionIndex: null, nextSession: i + 1, start, timeLeftMs: start - now };
  }
  // next is tomorrow session 1
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const start = parseTime(tomorrow, SESSION_SCHEDULE[0][0]);
  return { sessionIndex: null, nextSession: 1, start, timeLeftMs: start - now };
}

export function formatMs(ms) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
