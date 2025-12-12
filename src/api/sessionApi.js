// src/api/sessionApi.js
// Session API client for Hybrid MLM frontend
// - Implements session listing, current-session detection, user pair fetch,
//   session summary, claiming pair income (frontend action), admin trigger.
// - Provides realtime subscription via socket.io (if available).
//
// Expects backend endpoints:
// GET  ${API_BASE}/sessions                -> list sessions (today / upcoming)
// GET  ${API_BASE}/sessions/current        -> current active session (or null)
// GET  ${API_BASE}/sessions/:id            -> session detail (pairs, counts)
// GET  ${API_BASE}/users/:id/pairs?session= -> user's pairs for session
// POST ${API_BASE}/sessions/:id/claim      -> claim income for a pair (auth required)
// POST ${API_BASE}/admin/sessions/engine/run -> admin trigger (protected)
//
// Uses global __API_BASE__ (vite define) or falls back to '/api'.
// Returns structured errors { ok:false, error, status }

const API_BASE = (typeof __API_BASE__ !== 'undefined' && __APP_ENV__ ? __API_BASE__ : '/api');

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_RETRIES = 2;
const CACHE_TTL = 8 * 1000; // 8s cache for session list

// 8 sessions timings according to plan (local times) — start inclusive, end exclusive
export const SESSION_TIMINGS = [
  { id: 1, start: "06:00", end: "08:15" },
  { id: 2, start: "08:15", end: "10:30" },
  { id: 3, start: "10:30", end: "12:45" },
  { id: 4, start: "12:45", end: "15:00" },
  { id: 5, start: "15:00", end: "17:15" },
  { id: 6, start: "17:15", end: "19:30" },
  { id: 7, start: "19:30", end: "21:45" },
  { id: 8, start: "21:45", end: "00:00" } // crosses midnight boundary logically
];

// ---- simple in-memory cache ----
const _cache = new Map();
function setCache(key, value, ttl = CACHE_TTL) {
  const expire = Date.now() + ttl;
  _cache.set(key, { value, expire });
}
function getCache(key) {
  const rec = _cache.get(key);
  if (!rec) return null;
  if (Date.now() > rec.expire) { _cache.delete(key); return null; }
  return rec.value;
}
function clearCache(key) { _cache.delete(key); }

// ---- fetch helper with timeout + retry ----
async function _fetchJson(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`;
  const timeout = opts.timeout || DEFAULT_TIMEOUT;
  const retries = typeof opts.retries === 'number' ? opts.retries : DEFAULT_RETRIES;
  let attempt = 0;
  while (true) {
    attempt++;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, Object.assign({}, opts, { signal: controller.signal }));
      clearTimeout(id);
      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        let body = null;
        try { body = ct.includes('application/json') ? await res.json() : await res.text(); } catch (e) {}
        const err = new Error(body?.message || `HTTP ${res.status}`);
        err.status = res.status; err.body = body;
        throw err;
      }
      if (ct.includes('application/json')) return await res.json();
      return await res.text();
    } catch (err) {
      clearTimeout(id);
      const recoverable = err.name === 'AbortError' || err.name === 'TypeError';
      if (attempt <= retries && recoverable) {
        await new Promise(r => setTimeout(r, 250 * attempt));
        continue;
      }
      throw err;
    }
  }
}

// ---- socket helper (optional) ----
let _socket = null;
function initSocket() {
  if (_socket) return _socket;
  if (typeof io === 'undefined') return null;
  try {
    _socket = io(API_BASE, { path: '/socket.io' });
    return _socket;
  } catch (e) {
    console.warn('sessionApi: socket init failed', e);
    return null;
  }
}

// ---- utilities ----
function parseTimeToToday(timeStr) {
  // timeStr "HH:MM" -> Date object for today (local)
  const [hh, mm] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d;
}
function isNowInRange(startStr, endStr) {
  const now = new Date();
  const start = parseTimeToToday(startStr);
  let end = parseTimeToToday(endStr);
  // handle midnight crossing: if end <= start => end is next day
  if (end <= start) end.setDate(end.getDate() + 1);
  return now >= start && now < end;
}
function findCurrentSessionByTimings() {
  for (const s of SESSION_TIMINGS) {
    if (isNowInRange(s.start, s.end)) return s;
  }
  return null;
}

// ---- Session API ----
const SessionAPI = {
  /**
   * getSessions(opts)
   * opts: { day: 'YYYY-MM-DD' } optional -> backend may return sessions for that date
   */
  async getSessions(opts = {}) {
    const cacheKey = `sessions:${opts.day || 'today'}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const qs = opts.day ? `?day=${encodeURIComponent(opts.day)}` : '';
    try {
      const res = await _fetchJson(`/sessions${qs}`, { method: 'GET' });
      // expected { ok:true, sessions: [...] }
      if (res && res.sessions) {
        setCache(cacheKey, res, 8 * 1000);
        return res;
      }
      return { ok: false, error: 'invalid_response' };
    } catch (err) {
      return { ok: false, error: err.message || err.toString(), status: err.status || 0 };
    }
  },

  /**
   * getSessionById(id)
   * returns session detail including pair counts and pair items
   */
  async getSessionById(id) {
    if (!id) return { ok: false, error: 'id_required' };
    try {
      const res = await _fetchJson(`/sessions/${encodeURIComponent(id)}`, { method: 'GET' });
      return res && res.ok ? res : { ok: false, error: res?.error || 'failed' };
    } catch (err) {
      return { ok: false, error: err.message || 'network_error' };
    }
  },

  /**
   * getCurrentSession()
   * tries backend /sessions/current then falls back to local timings
   */
  async getCurrentSession() {
    try {
      const res = await _fetchJson('/sessions/current', { method: 'GET' });
      if (res && typeof res.current !== 'undefined') return res;
    } catch (e) {
      // ignore and fallback
    }
    // fallback: detect by client timing
    const s = findCurrentSessionByTimings();
    if (!s) return { ok: true, current: null, fallback: true };
    return { ok: true, current: { id: s.id, start: s.start, end: s.end }, fallback: true };
  },

  /**
   * getUserPairs(userId, sessionId)
   * returns list of pairs for user in a session (red/green, packageName, pairIncome)
   */
  async getUserPairs(userId, sessionId) {
    if (!userId) return { ok: false, error: 'userId_required' };
    const qs = sessionId ? `?session=${encodeURIComponent(sessionId)}` : '';
    try {
      const res = await _fetchJson(`/users/${encodeURIComponent(userId)}/pairs${qs}`, { method: 'GET' });
      return res && res.ok ? res : { ok: false, error: res?.error || 'failed' };
    } catch (err) {
      return { ok: false, error: err.message || 'network_error' };
    }
  },

  /**
   * getSessionSummary(sessionId)
   * returns counts grouped by package and red/green totals for UI badges
   */
  async getSessionSummary(sessionId) {
    if (!sessionId) return { ok: false, error: 'sessionId_required' };
    try {
      const res = await _fetchJson(`/sessions/${encodeURIComponent(sessionId)}/summary`, { method: 'GET' });
      return res && res.ok ? res : { ok: false, error: res?.error || 'failed' };
    } catch (err) {
      return { ok: false, error: err.message || 'network_error' };
    }
  },

  /**
   * claimPairIncome(sessionId, pairId, authToken)
   * user requests backend to mark pair income as paid/claim
   */
  async claimPairIncome(sessionId, pairId, authToken) {
    if (!sessionId || !pairId) return { ok: false, error: 'sessionId_and_pairId_required' };
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await _fetchJson(`/sessions/${encodeURIComponent(sessionId)}/claim`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ pairId }),
        timeout: 20000
      });
      return res && res.ok ? res : { ok: false, error: res?.error || 'failed' };
    } catch (err) {
      return { ok: false, error: err.message || 'network_error' };
    }
  },

  /**
   * Admin: triggerSessionEngine()
   * (PROTECTED) - triggers server's session engine run immediately
   */
  async triggerSessionEngine(adminToken) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
      const res = await _fetchJson('/admin/sessions/engine/run', { method: 'POST', headers, timeout: 30000 });
      return res && res.ok ? res : { ok: false, error: res?.error || 'failed' };
    } catch (err) {
      return { ok: false, error: err.message || 'network_error' };
    }
  },

  /**
   * realtime subscription to session events
   * callback receives { event: 'pair_created'|'pair_green'|'session_closed', payload: {...} }
   * returns unsubscribe() function
   */
  subscribeToSessionEvents(callback) {
    if (typeof callback !== 'function') throw new Error('callback required');
    const s = initSocket();
    if (!s) {
      // fallback: no socket available
      console.warn('sessionApi: socket not available');
      return () => {};
    }
    function onPairCreated(payload) { callback({ event: 'pair_created', payload }); }
    function onPairGreen(payload) { callback({ event: 'pair_green', payload }); }
    function onSessionClosed(payload) { callback({ event: 'session_closed', payload }); }

    s.on('session:pair_created', onPairCreated);
    s.on('session:pair_green', onPairGreen);
    s.on('session:closed', onSessionClosed);

    return function unsubscribe() {
      s.off('session:pair_created', onPairCreated);
      s.off('session:pair_green', onPairGreen);
      s.off('session:closed', onSessionClosed);
    };
  },

  // small utility for UI - returns next session object from timings (client side)
  getNextSessionFromTimings() {
    const now = new Date();
    for (const s of SESSION_TIMINGS) {
      const start = parseTimeToToday(s.start);
      let end = parseTimeToToday(s.end);
      if (end <= start) end.setDate(end.getDate() + 1);
      if (end > now) return s;
    }
    return null;
  }
};

export default SessionAPI;
