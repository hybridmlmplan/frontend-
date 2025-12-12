// src/api.js
// Centralized API client for Hybrid MLM frontend
// - Provides functions for Auth, Users, Packages, EPIN, Sessions, Wallet, Royalty, Admin
// - Robust fetch helper with timeout + retry
// - Auth token stored in localStorage (key: "authToken")
// - Optional socket.io realtime helpers (requires socket.io-client loaded in page)
// - Exports a single default Api object and some helpers

const API_BASE = (typeof __API_BASE__ !== 'undefined') ? __API_BASE__ : (process.env.REACT_APP_API_BASE || '/api');
const DEFAULT_TIMEOUT = 15000; // ms
const DEFAULT_RETRIES = 2;
const CACHE_TTL = 5000; // ms for lightweight caching

// ---------- Simple in-memory cache ----------
const _cache = new Map();
function _setCache(key, value, ttl = CACHE_TTL) {
  _cache.set(key, { value, expire: Date.now() + ttl });
}
function _getCache(key) {
  const rec = _cache.get(key);
  if (!rec) return null;
  if (Date.now() > rec.expire) {
    _cache.delete(key);
    return null;
  }
  return rec.value;
}
function _clearCache(key) { _cache.delete(key); }

// ---------- Fetch helper (timeout + retry) ----------
async function _fetch(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`;
  const timeout = opts.timeout ?? DEFAULT_TIMEOUT;
  const retries = typeof opts.retries === 'number' ? opts.retries : DEFAULT_RETRIES;
  let attempt = 0;

  while (true) {
    attempt++;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const finalOpts = Object.assign({}, opts, { signal: controller.signal });
      const resp = await fetch(url, finalOpts);
      clearTimeout(id);
      const ctype = resp.headers.get('content-type') || '';
      let body = null;
      if (ctype.includes('application/json')) {
        body = await resp.json();
      } else {
        body = await resp.text();
      }
      if (!resp.ok) {
        const err = new Error(body?.message || `HTTP ${resp.status}`);
        err.status = resp.status;
        err.body = body;
        throw err;
      }
      return body;
    } catch (err) {
      clearTimeout(id);
      const recoverable = err.name === 'AbortError' || err.name === 'TypeError';
      if (attempt <= retries && recoverable) {
        // small backoff
        await new Promise(r => setTimeout(r, 200 * attempt));
        continue;
      }
      throw err;
    }
  }
}

// ---------- Auth token helpers ----------
const TOKEN_KEY = 'authToken';
function setToken(token) { if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); }
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

// ---------- Socket helper (optional) ----------
let _socket = null;
function initSocket() {
  if (_socket) return _socket;
  if (typeof io === 'undefined') return null;
  try {
    _socket = io(API_BASE, { path: '/socket.io' });
    return _socket;
  } catch (e) {
    console.warn('socket init failed', e);
    return null;
  }
}

// ---------- Helpers to include auth header ----------
function _authHeaders(extra = {}) {
  const token = getToken();
  const h = { ...extra };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// ---------- API Methods ----------
const Api = {
  // ----- Auth -----
  async signup(payload) {
    // payload: { name, mobile, email, password, sponsorId, placementId?, package? }
    try {
      const res = await _fetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message || 'Network error', status: err.status || 0, body: err.body || null };
    }
  },

  async login(payload) {
    // payload: { login, password }
    try {
      const res = await _fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res && res.token) setToken(res.token);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message || 'Network error', status: err.status || 0, body: err.body || null };
    }
  },

  logout() {
    clearToken();
    // optionally call server logout
    return Api.post('/auth/logout').catch(()=>{});
  },

  // ----- Generic GET/POST helpers (exposed) -----
  async get(path, opts = {}) {
    try {
      const cacheKey = opts.cache ? `GET:${path}` : null;
      if (cacheKey) {
        const cached = _getCache(cacheKey);
        if (cached) return { ok: true, data: cached, cached: true };
      }
      const headers = _authHeaders(opts.headers || {});
      const res = await _fetch(path, { method: 'GET', headers, timeout: opts.timeout });
      if (cacheKey) _setCache(cacheKey, res, opts.ttl || CACHE_TTL);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message || 'Network error', status: err.status || 0, body: err.body || null };
    }
  },

  async post(path, body = {}, opts = {}) {
    try {
      const headers = Object.assign({ 'Content-Type': 'application/json' }, _authHeaders(opts.headers || {}));
      const res = await _fetch(path, { method: 'POST', headers, body: JSON.stringify(body), timeout: opts.timeout });
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message || 'Network error', status: err.status || 0, body: err.body || null };
    }
  },

  // ----- Users -----
  async me() {
    return Api.get('/me', { cache: false });
  },

  async getUserById(id) {
    if (!id) return { ok: false, error: 'id required' };
    return Api.get(`/users/${encodeURIComponent(id)}`);
  },

  async checkUserExists(identifier) {
    if (!identifier) return { ok: false, error: 'identifier required' };
    return Api.get(`/users/check-id?user=${encodeURIComponent(identifier)}`, { cache: true, ttl: 2000 });
  },

  // ----- Packages -----
  async listPackages() {
    return Api.get('/packages', { cache: true, ttl: 30 * 1000 });
  },

  async publicPackagesSummary() {
    return Api.get('/packages/public-summary', { cache: true, ttl: 60 * 1000 });
  },

  // ----- EPIN -----
  async generateEPINs(count = 1, payload = {}) {
    // Admin action: payload can include package, expiry, token required
    return Api.post('/admin/epin/generate', { count, ...payload }, { });
  },

  async validateEPIN(code) {
    if (!code) return { ok: false, error: 'code required' };
    return Api.get(`/epin/validate?code=${encodeURIComponent(code)}`);
  },

  async activateEPIN(code) {
    if (!code) return { ok: false, error: 'code required' };
    return Api.post('/epin/activate', { code });
  },

  // ----- Sessions (wraps sessionApi responsibilities) -----
  async getSessions(day = null) {
    const qs = day ? `?day=${encodeURIComponent(day)}` : '';
    return Api.get(`/sessions${qs}`, { cache: true, ttl: 8 * 1000 });
  },

  async getCurrentSession() {
    return Api.get('/sessions/current');
  },

  async getSessionById(id) {
    if (!id) return { ok: false, error: 'id required' };
    return Api.get(`/sessions/${encodeURIComponent(id)}`);
  },

  async getSessionSummary(id) {
    if (!id) return { ok: false, error: 'id required' };
    return Api.get(`/sessions/${encodeURIComponent(id)}/summary`);
  },

  async claimPair(sessionId, pairId) {
    if (!sessionId || !pairId) return { ok: false, error: 'sessionId and pairId required' };
    return Api.post(`/sessions/${encodeURIComponent(sessionId)}/claim`, { pairId });
  },

  // ----- Wallet -----
  async getWallet() {
    return Api.get('/wallet');
  },

  async requestWithdraw(amount, details = {}) {
    return Api.post('/wallet/withdraw', { amount, ...details });
  },

  async walletHistory(page = 1, pageSize = 20) {
    return Api.get(`/wallet/history?page=${page}&pageSize=${pageSize}`, { cache: true, ttl: 5000 });
  },

  // ----- Orders / Repurchase -----
  async createOrder(items = []) {
    // items: [{ productId, qty }]
    return Api.post('/orders', { items });
  },

  async repurchasePackage(pkgName) {
    return Api.post('/orders/repurchase', { package: pkgName });
  },

  // ----- Royalty -----
  async getRoyaltySummary(userId) {
    return Api.get(`/royalty/summary${userId ? `?user=${encodeURIComponent(userId)}` : ''}`);
  },

  async triggerRoyaltyRun(period) {
    // admin-only
    return Api.post('/admin/royalty/run', { period });
  },

  // ----- Rank / Level -----
  async getRankForUser(userId) {
    if (!userId) return { ok: false, error: 'userId required' };
    return Api.get(`/ranks/${encodeURIComponent(userId)}`);
  },

  // ----- Admin tools -----
  async adminListUsers(q = '', page = 1, pageSize = 50) {
    return Api.get(`/admin/users?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`);
  },

  async adminTriggerSessionEngine() {
    return Api.post('/admin/sessions/engine/run', {});
  },

  // ----- Franchise -----
  async getFranchiseByUser(userId) {
    if (!userId) return { ok: false, error: 'userId required' };
    return Api.get(`/franchise/${encodeURIComponent(userId)}`);
  },

  // ----- Realtime subscription helpers -----
  subscribeToSocket(event, cb) {
    const s = initSocket();
    if (!s) return () => {};
    s.on(event, cb);
    return () => s.off(event, cb);
  },

  // expose raw fetch for advanced usage
  rawFetch: _fetch,

  // token helpers
  setToken,
  getToken,
  clearToken,

  // socket init
  initSocket,
};

// ---------- Export default ----------
export default Api;
