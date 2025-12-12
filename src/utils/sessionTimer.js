// src/utils/sessionTimer.js
// ------------------------------------------------------
// HYBRID MLM: 8-Session Engine Timer Utility
// ------------------------------------------------------
// This file provides:
// 1) getCurrentSession()        → returns active session index & label
// 2) getNextSessionStart()      → timestamp of next session start
// 3) getRemainingSessionTime()  → remaining time of current session
// 4) getDailySessions()         → full session timetable
// ------------------------------------------------------

// ------------------------------------------------------
// DAILY 8 SESSIONS (FINAL PLAN)
// Each session = 2 hours 15 minutes
// ------------------------------------------------------
export const SESSIONS = [
  { index: 1, start: "06:00", end: "08:15" },
  { index: 2, start: "08:15", end: "10:30" },
  { index: 3, start: "10:30", end: "12:45" },
  { index: 4, start: "12:45", end: "15:00" },
  { index: 5, start: "15:00", end: "17:15" },
  { index: 6, start: "17:15", end: "19:30" },
  { index: 7, start: "19:30", end: "21:45" },
  { index: 8, start: "21:45", end: "24:00" },
];

// Convert HH:MM → today timestamp
const toTodayTime = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  now.setHours(h === 24 ? 23 : h, h === 24 ? 59 : m, 59, 999);
  return now.getTime();
};

// ------------------------------------------------------
// 1) Get Current Active Session
// ------------------------------------------------------
export function getCurrentSession() {
  const now = Date.now();

  for (let s of SESSIONS) {
    const start = toTodayTime(s.start);
    const end = toTodayTime(s.end);

    if (now >= start && now <= end) {
      return {
        sessionNo: s.index,
        label: `Session-${s.index}`,
        start,
        end,
      };
    }
  }

  // If time is past midnight (00:00–06:00)
  return {
    sessionNo: 0,
    label: "No Active Session",
    start: null,
    end: null,
  };
}

// ------------------------------------------------------
// 2) Get Next Session Start Time
// ------------------------------------------------------
export function getNextSessionStart() {
  const now = Date.now();

  for (let s of SESSIONS) {
    const start = toTodayTime(s.start);
    if (now < start) {
      return {
        nextSession: s.index,
        startTimestamp: start,
      };
    }
  }

  // If day ended → next day session-1 automatically next
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(6, 0, 0, 0);

  return {
    nextSession: 1,
    startTimestamp: tomorrow.getTime(),
  };
}

// ------------------------------------------------------
// 3) Remaining Time for Current Session
// ------------------------------------------------------
export function getRemainingSessionTime() {
  const session = getCurrentSession();

  if (!session || !session.end) {
    return {
      remainingMs: 0,
      formatted: "00:00:00",
    };
  }

  const now = Date.now();
  const diff = session.end - now;

  if (diff <= 0) {
    return {
      remainingMs: 0,
      formatted: "00:00:00",
    };
  }

  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return {
    remainingMs: diff,
    formatted: `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`,
  };
}

// ------------------------------------------------------
// 4) Get All Daily Sessions
// ------------------------------------------------------
export function getDailySessions() {
  return SESSIONS;
}

// ------------------------------------------------------
// 5) Utility: Check if session ended (used by session engine)
// ------------------------------------------------------
export function isSessionEnded() {
  const session = getCurrentSession();
  if (session.sessionNo === 0) return true;
  return Date.now() > session.end;
}

// ------------------------------------------------------
// 6) Export default
// ------------------------------------------------------
export default {
  getCurrentSession,
  getNextSessionStart,
  getRemainingSessionTime,
  getDailySessions,
  isSessionEnded,
};
