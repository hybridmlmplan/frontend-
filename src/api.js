// src/api.js
// Centralized API client for Hybrid MLM frontend
// Vite + Railway compatible
// FINAL – HTTPS + /api FIXED

// ================= API BASE =================
const RAW_BASE =
  (typeof __API_BASE__ !== "undefined" && __API_BASE__) ||
  import.meta?.env?.VITE_API_BASE_URL ||
  "https://backend-production-9337.up.railway.app"; // ✅ HTTPS

// ✅ FINAL BASE WITH /api
const API_BASE = RAW_BASE.replace(/\/$/, "") + "/api";

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_RETRIES = 2;
const CACHE_TTL = 5000;

// ================= CACHE =================
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

// ================= FETCH HELPER =================
async function _fetch(path, opts = {}) {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;

  const timeout = opts.timeout ?? DEFAULT_TIMEOUT;
  const retries = typeof opts.retries === "number" ? opts.retries : DEFAULT_RETRIES;
  let attempt = 0;

  while (true) {
    attempt++;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const finalOpts = { ...opts, signal: controller.signal };
      const resp = await fetch(url, finalOpts);
      clearTimeout(id);

      const ctype = resp.headers.get("content-type") || "";
      const body = ctype.includes("application/json")
        ? await resp.json()
        : await resp.text();

      if (!resp.ok) {
        const err = new Error(body?.message || `HTTP ${resp.status}`);
        err.status = resp.status;
        err.body = body;
        throw err;
      }

      return body;
    } catch (err) {
      clearTimeout(id);
      const recoverable =
        err.name === "AbortError" || err.name === "TypeError";

      if (attempt <= retries && recoverable) {
        await new Promise((r) => setTimeout(r, 200 * attempt));
        continue;
      }
      throw err;
    }
  }
}

// ================= AUTH TOKEN =================
const TOKEN_KEY = "authToken";

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ================= AUTH HEADER =================
function _authHeaders(extra = {}) {
  const token = getToken();
  return token
    ? { ...extra, Authorization: `Bearer ${token}` }
    : { ...extra };
}

// ================= API OBJECT =================
const Api = {
  // ---------- AUTH ----------
  signup(payload) {
    return Api.post("/auth/signup", payload);
  },

  async login(payload) {
    const res = await Api.post("/auth/login", payload);
    if (res.ok && res.data?.token) setToken(res.data.token);
    return res;
  },

  logout() {
    clearToken();
    return { ok: true };
  },

  // ---------- GENERIC ----------
  async get(path, opts = {}) {
    try {
      const cacheKey = opts.cache ? `GET:${path}` : null;
      if (cacheKey) {
        const cached = _getCache(cacheKey);
        if (cached) return { ok: true, data: cached };
      }

      const res = await _fetch(path, {
        method: "GET",
        headers: _authHeaders(opts.headers || {}),
      });

      if (cacheKey) _setCache(cacheKey, res, opts.ttl);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message, status: err.status || 0 };
    }
  },

  async post(path, body = {}, opts = {}) {
    try {
      const res = await _fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ..._authHeaders(opts.headers || {}),
        },
        body: JSON.stringify(body),
      });
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message, status: err.status || 0 };
    }
  },

  // ---------- BASIC ----------
  health() {
    return Api.get("/test");
  },

  // ---------- TOKEN ----------
  setToken,
  getToken,
  clearToken,
};

export default Api;
