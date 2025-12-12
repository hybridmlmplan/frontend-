// src/redux/sessionSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * Session slice for Hybrid MLM plan
 *
 * Responsibilities:
 * - store sessions schedule & state (8 daily sessions)
 * - provide thunks to fetch/create/update/process sessions via backend
 * - utilities for determining active session based on timezone (Asia/Kolkata)
 *
 * Backend endpoints expected (example):
 * GET  /api/sessions               -> list sessions (with status, start/end, pairs info)
 * POST /api/sessions               -> create a new session (admin)
 * PATCH/PUT /api/sessions/:id      -> update session info (admin)
 * POST /api/sessions/:id/process   -> run session engine (pair matching, capping check, income release)
 *
 * NOTE: heavy logic (pair matching, wallet updates) must run on server for correctness.
 */

/* ---------- Constants based on plan ---------- */

// 8 sessions per day, each 2h15m long with specific start times (Asia/Kolkata)
export const SESSION_DEFINITIONS = [
  { idx: 1, label: "06:00–08:15", start: "06:00", end: "08:15" },
  { idx: 2, label: "08:15–10:30", start: "08:15", end: "10:30" },
  { idx: 3, label: "10:30–12:45", start: "10:30", end: "12:45" },
  { idx: 4, label: "12:45–15:00", start: "12:45", end: "15:00" },
  { idx: 5, label: "15:00–17:15", start: "15:00", end: "17:15" },
  { idx: 6, label: "17:15–19:30", start: "17:15", end: "19:30" },
  { idx: 7, label: "19:30–21:45", start: "19:30", end: "21:45" },
  { idx: 8, label: "21:45–00:00", start: "21:45", end: "00:00" },
];

// Per-day capping per package (from plan)
export const PACKAGE_CAPPING = {
  silver: 1,
  gold: 1,
  ruby: 1,
};

// Session engine endpoints base
const API_BASE = process.env.REACT_APP_API_BASE || ""; // set REACT_APP_API_BASE in env for full URL

/* ---------- Async thunks ---------- */

/**
 * Fetch sessions (paginated or full list)
 * payload can contain query params like { date: 'YYYY-MM-DD' }
 */
export const fetchSessions = createAsyncThunk(
  "sessions/fetchSessions",
  async (query = {}, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE}/api/sessions`, { params: query });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

/**
 * Create a new session (admin)
 * payload: { date: 'YYYY-MM-DD', sessionIdx: 1..8, start, end, meta }
 */
export const createSession = createAsyncThunk(
  "sessions/createSession",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE}/api/sessions`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

/**
 * Update session (admin)
 * payload: { id, updateFields }
 */
export const updateSession = createAsyncThunk(
  "sessions/updateSession",
  async ({ id, updateFields }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${API_BASE}/api/sessions/${id}`, updateFields);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

/**
 * Process session engine (trigger server to run matching/capping and release incomes)
 * payload: { id, runOptions }
 * runOptions could include { force: true } for admin debugging
 */
export const processSession = createAsyncThunk(
  "sessions/processSession",
  async ({ id, runOptions = {} }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE}/api/sessions/${id}/process`, runOptions);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

/* ---------- Utilities (client-side helpers) ---------- */

/**
 * Build today's session schedule objects using SESSION_DEFINITIONS and a date string
 * dateStr: 'YYYY-MM-DD' (in Asia/Kolkata)
 * returns array of sessions with ISO start/end strings
 */
export function buildDailySchedule(dateStr) {
  // dateStr expected in YYYY-MM-DD
  // We'll produce ISO (no timezone conversion) — server should interpret in Asia/Kolkata or store timezone-aware
  return SESSION_DEFINITIONS.map((d) => {
    const startIso = `${dateStr}T${d.start}:00`;
    // handle midnight end "00:00" -> next day
    const endTime = d.end === "00:00" ? "24:00" : d.end;
    const endIso = endTime === "24:00" ? `${dateStr}T24:00:00` : `${dateStr}T${d.end}:00`;
    return {
      idx: d.idx,
      label: d.label,
      start: startIso,
      end: endIso,
      status: "scheduled", // scheduled | running | completed
      pairs: {
        silver: { taken: 0, capped: PACKAGE_CAPPING.silver },
        gold: { taken: 0, capped: PACKAGE_CAPPING.gold },
        ruby: { taken: 0, capped: PACKAGE_CAPPING.ruby },
      },
      meta: {},
    };
  });
}

/**
 * Given a JS Date or ISO string, compute current session idx (1..8) or null
 * timezone: assume Asia/Kolkata (client), but best to have server authoritative
 */
export function getCurrentSessionIdx(now = new Date()) {
  // convert now to Asia/Kolkata by using locale time string (approx). For correctness use server.
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const hm = hours * 60 + minutes;

  // convert SESSION_DEFINITIONS ranges to minutes and check
  // We'll hardcode ranges in minutes (Kolkata local times)
  const ranges = [
    [6 * 60 + 0, 8 * 60 + 15], // 06:00 - 08:15
    [8 * 60 + 15, 10 * 60 + 30],
    [10 * 60 + 30, 12 * 60 + 45],
    [12 * 60 + 45, 15 * 60 + 0],
    [15 * 60 + 0, 17 * 60 + 15],
    [17 * 60 + 15, 19 * 60 + 30],
    [19 * 60 + 30, 21 * 60 + 45],
    [21 * 60 + 45, 24 * 60 + 0],
  ];

  for (let i = 0; i < ranges.length; i++) {
    const [s, e] = ranges[i];
    if (hm >= s && hm < e) return i + 1;
  }
  return null;
}

/* ---------- Initial state ---------- */

const initialState = {
  sessions: [], // array of session objects from backend
  currentSession: null, // { id, idx, start, end, status } or null
  status: "idle", // idle | loading | succeeded | failed
  error: null,
  lastUpdated: null,
};

/* ---------- Slice ---------- */

const sessionSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    // local updates if needed (optimistic)
    setCurrentSession(state, action) {
      state.currentSession = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    // update pair counts locally (useful for immediate UI)
    incrementPairTaken(state, action) {
      // payload: { sessionId, packageKey ('silver'|'gold'|'ruby'), amount }
      const { sessionId, packageKey, amount = 1 } = action.payload;
      const s = state.sessions.find((x) => x._id === sessionId || x.id === sessionId);
      if (s && s.pairs && s.pairs[packageKey]) {
        s.pairs[packageKey].taken += amount;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Expect action.payload = { sessions: [...] } or array directly
        const payload = action.payload;
        const sessions = Array.isArray(payload) ? payload : payload.sessions || [];
        state.sessions = sessions;
        state.lastUpdated = new Date().toISOString();

        // try to set currentSession if server provided active one
        const active = sessions.find((s) => s.status === "running") || null;
        state.currentSession = active;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error;
      })

      .addCase(createSession.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.status = "succeeded";
        const s = action.payload;
        // payload expected the created session
        state.sessions.push(s);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(createSession.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error;
      })

      .addCase(updateSession.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateSession.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updated = action.payload;
        const idx = state.sessions.findIndex((x) => x._id === updated._id || x.id === updated.id);
        if (idx !== -1) state.sessions[idx] = updated;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateSession.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error;
      })

      .addCase(processSession.pending, (state) => {
        state.status = "loading";
      })
      .addCase(processSession.fulfilled, (state, action) => {
        state.status = "succeeded";
        // server returns processed session (with updated pairs, incomes released etc.)
        const processed = action.payload;
        const idx = state.sessions.findIndex((x) => x._id === processed._id || x.id === processed.id);
        if (idx !== -1) state.sessions[idx] = processed;
        state.currentSession = processed.status === "running" ? processed : state.currentSession;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(processSession.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error;
      });
  },
});

/* ---------- Exports ---------- */

export const { setCurrentSession, clearError, incrementPairTaken } = sessionSlice.actions;

export default sessionSlice.reducer;

/* ---------- Selectors ---------- */

/**
 * Select all sessions
 */
export const selectAllSessions = (state) => state.sessions.sessions;

/**
 * Select session by id
 */
export const selectSessionById = (state, id) =>
  state.sessions.sessions.find((s) => s._id === id || s.id === id);

/**
 * Select current active session (server-provided or computed)
 */
export const selectCurrentSession = (state) => {
  if (state.sessions.currentSession) return state.sessions.currentSession;
  // fallback: compute based on local time (best-effort)
  const idx = getCurrentSessionIdx(new Date());
  if (!idx) return null;
  return state.sessions.sessions.find((s) => s.idx === idx) || null;
};

/**
 * Select remaining capacity for a package in a session
 * returns number left (>=0)
 */
export const selectRemainingCapacity = (state, sessionId, packageKey) => {
  const s = selectSessionById(state, sessionId);
  if (!s || !s.pairs || !s.pairs[packageKey]) return 0;
  const { taken, capped } = s.pairs[packageKey];
  return Math.max(0, capped - taken);
};

/* ---------- Usage notes ---------- */

/**
 * Integration tips:
 *
 * - On app load: dispatch(fetchSessions({ date: '2025-12-12' })) to get schedule for a day
 * - Server should produce daily sessions (one document per session) and endpoints to process session engine
 * - For UI showing clock: use getCurrentSessionIdx() and selectCurrentSession to highlight which session is active
 * - For purchases: before allowing a pair purchase, check selectRemainingCapacity(...) for the package
 *
 * Example:
 *  const dispatch = useDispatch();
 *  useEffect(() => {
 *    dispatch(fetchSessions({ date: todayStr }));
 *  }, [dispatch, todayStr]);
 *
 *  // To trigger engine (admin)
 *  dispatch(processSession({ id: sessionId, runOptions: { force: true } }));
 *
 * Security:
 * - Always let server verify caps and perform pairing/payouts. Client-side checks are only for UX.
 */

