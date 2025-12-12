// src/store.js
// Central store for Hybrid MLM frontend (React Context + useReducer).
// Usage:
// Wrap your App with <StoreProvider> in src/main.jsx
// Inside components use: const { state, actions } = useStore();

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api, {
  setAuthToken,
  clearAuthToken,
  initAuthFromStorage,
  loginAndStore,
  logout as apiLogout,
  get,
  post,
} from './api/axiosConfig';

// Initialize token (axiosConfig handles reading token from localStorage)
initAuthFromStorage();

// ----------------------
// Business constants
// ----------------------
const PACKAGES = {
  Silver: { key: 'Silver', price: 35, pv: 35, pairIncome: 10, capping: 1 },
  Gold: { key: 'Gold', price: 155, pv: 155, pairIncome: 50, capping: 1 },
  Ruby: { key: 'Ruby', price: 1250, pv: 1250, pairIncome: 500, capping: 1 },
};

const SESSIONS = [
  { id: 1, start: '06:00', end: '08:15' },
  { id: 2, start: '08:15', end: '10:30' },
  { id: 3, start: '10:30', end: '12:45' },
  { id: 4, start: '12:45', end: '15:00' },
  { id: 5, start: '15:00', end: '17:15' },
  { id: 6, start: '17:15', end: '19:30' },
  { id: 7, start: '19:30', end: '21:45' },
  { id: 8, start: '21:45', end: '00:00' },
];

// Rank tables (you provided; kept here for reference & UI)
const RANKS = {
  Silver: [
    { name: 'Star', income: 10 },
    { name: 'Silver Star', income: 20 },
    { name: 'Gold Star', income: 40 },
    { name: 'Ruby Star', income: 80 },
    { name: 'Emerald Star', income: 160 },
    { name: 'Diamond Star', income: 320 },
    { name: 'Crown Star', income: 640 },
    { name: 'Ambassador Star', income: 1280 },
    { name: 'Company Star', income: 2560 },
  ],
  Gold: [
    { name: 'Star', income: 50 },
    { name: 'Silver Star', income: 100 },
    { name: 'Gold Star', income: 200 },
    { name: 'Ruby Star', income: 400 },
    { name: 'Emerald Star', income: 800 },
    { name: 'Diamond Star', income: 1600 },
    { name: 'Crown Star', income: 3200 },
    { name: 'Ambassador Star', income: 6400 },
    { name: 'Company Star', income: 12800 },
  ],
  Ruby: [
    { name: 'Star', income: 500 },
    { name: 'Silver Star', income: 1000 },
    { name: 'Gold Star', income: 2000 },
    { name: 'Ruby Star', income: 4000 },
    { name: 'Emerald Star', income: 8000 },
    { name: 'Diamond Star', income: 16000 },
    { name: 'Crown Star', income: 32000 },
    { name: 'Ambassador Star', income: 64000 },
    { name: 'Company Star', income: 128000 },
  ],
};

// ----------------------
// Initial state
// ----------------------
const initialState = {
  ready: false,
  user: null, // { id, name, email, phone, role, package, ... }
  token: null,
  packages: PACKAGES,
  sessions: SESSIONS,
  ranks: RANKS,
  dashboard: {
    pairs: 0,
    royalty: 0,
    levelIncome: 0,
    wallet: 0,
    pv: 0,
    bv: 0,
  },
  genealogy: [], // tree nodes from backend
  incomes: [], // recent incomes
  epins: [], // user's epins
  notifications: [],
  loading: false,
  error: null,
};

// ----------------------
// Actions & reducer
// ----------------------
const StoreContext = createContext(null);

const ACTIONS = {
  BOOTSTRAP: 'BOOTSTRAP',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_USER: 'SET_USER',
  CLEAR_USER: 'CLEAR_USER',
  SET_DASHBOARD: 'SET_DASHBOARD',
  SET_GENEALOGY: 'SET_GENEALOGY',
  SET_INCOMES: 'SET_INCOMES',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  CLEAR_NOTIFICATION: 'CLEAR_NOTIFICATION',
  SET_EPINS: 'SET_EPINS',
  UPDATE_WALLET: 'UPDATE_WALLET',
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.BOOTSTRAP:
      return { ...state, ...action.payload, ready: true };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case ACTIONS.SET_USER:
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false, error: null };
    case ACTIONS.CLEAR_USER:
      return { ...state, user: null, token: null, dashboard: initialState.dashboard };
    case ACTIONS.SET_DASHBOARD:
      return { ...state, dashboard: { ...state.dashboard, ...action.payload }, loading: false };
    case ACTIONS.SET_GENEALOGY:
      return { ...state, genealogy: action.payload, loading: false };
    case ACTIONS.SET_INCOMES:
      return { ...state, incomes: action.payload, loading: false };
    case ACTIONS.ADD_NOTIFICATION:
      return { ...state, notifications: [action.payload, ...state.notifications].slice(0, 20) };
    case ACTIONS.CLEAR_NOTIFICATION:
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.payload) };
    case ACTIONS.SET_EPINS:
      return { ...state, epins: action.payload };
    case ACTIONS.UPDATE_WALLET:
      return { ...state, dashboard: { ...state.dashboard, wallet: action.payload } };
    default:
      return state;
  }
}

// ----------------------
// Provider and hooks
// ----------------------
export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Bootstrap from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (savedUser && token) {
        dispatch({ type: ACTIONS.BOOTSTRAP, payload: { user: JSON.parse(savedUser), token } });
        setAuthToken(token);
        // optional: fetch initial dashboard/genealogy
        refreshDashboard().catch(() => {});
        fetchGenealogy().catch(() => {});
        fetchIncomes().catch(() => {});
      } else {
        dispatch({ type: ACTIONS.BOOTSTRAP, payload: {} });
      }
    } catch (e) {
      dispatch({ type: ACTIONS.BOOTSTRAP, payload: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------
  // Action creators
  // ----------------------

  // Helper: save user & token to storage
  function persistAuth(user, token) {
    try {
      if (token) localStorage.setItem('token', token);
      if (user) localStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
      // ignore storage errors
    }
  }

  async function login(payload) {
    // payload: { emailOrPhone, password } or { email, password }
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const data = await loginAndStore(payload); // axiosConfig helper returns data and sets token internally
      const token = data?.token || localStorage.getItem('token') || null;
      const user = data?.user || data?.userDetail || null;
      if (token && user) {
        setAuthToken(token);
        persistAuth(user, token);
        dispatch({ type: ACTIONS.SET_USER, payload: { user, token } });
        // refresh user-dependent data
        refreshDashboard().catch(() => {});
        fetchGenealogy().catch(() => {});
        fetchIncomes().catch(() => {});
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Login failed: invalid response' });
      }
      return data;
    } catch (err) {
      const msg = err?.message || 'Login failed';
      dispatch({ type: ACTIONS.SET_ERROR, payload: msg });
      throw err;
    }
  }

  async function signup(payload) {
    // payload: { name, email, phone, sponsorId, placementId, package, epin (optional) }
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const data = await post('/user/signup', payload);
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      return data;
    } catch (err) {
      const msg = err?.message || 'Signup failed';
      dispatch({ type: ACTIONS.SET_ERROR, payload: msg });
      throw err;
    }
  }

  async function logout(doServerCall = false) {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      await apiLogout(doServerCall);
    } catch (e) {
      // ignore server errors, continue to clear client state
    } finally {
      clearAuthToken();
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {}
      dispatch({ type: ACTIONS.CLEAR_USER });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }

  async function refreshDashboard() {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const data = await get('/user/dashboard');
      // expected shape: { pairs, royalty, levelIncome, wallet, pv, bv }
      dispatch({ type: ACTIONS.SET_DASHBOARD, payload: data });
      return data;
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message || 'Failed to fetch dashboard' });
      throw err;
    }
  }

  async function fetchGenealogy(params = {}) {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const data = await get('/user/genealogy', params);
      // expected: array of nodes
      dispatch({ type: ACTIONS.SET_GENEALOGY, payload: data });
      return data;
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message || 'Failed to fetch genealogy' });
      throw err;
    }
  }

  async function fetchIncomes(params = {}) {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const data = await get('/user/incomes', params);
      dispatch({ type: ACTIONS.SET_INCOMES, payload: data });
      return data;
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message || 'Failed to fetch incomes' });
      throw err;
    }
  }

  async function fetchEpins() {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const data = await get('/user/epins');
      dispatch({ type: ACTIONS.SET_EPINS, payload: data });
      return data;
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message || 'Failed to fetch EPINs' });
      throw err;
    }
  }

  async function purchasePackage(packageKey, paymentPayload = {}) {
    // packageKey: 'Silver'|'Gold'|'Ruby'
    // paymentPayload: { method, orderId, razorpayPaymentId, etc. } optional depending if payment required
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const pkg = PACKAGES[packageKey];
      if (!pkg) throw new Error('Invalid package selected');
      const body = { package: packageKey, ...paymentPayload };
      const data = await post('/purchase', body);
      // On success, you may want to refresh dashboard and incomes
      await refreshDashboard().catch(() => {});
      await fetchIncomes().catch(() => {});
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      return data;
    } catch (err) {
      const msg = err?.message || 'Purchase failed';
      dispatch({ type: ACTIONS.SET_ERROR, payload: msg });
      throw err;
    }
  }

  async function activateEpin(epinCode, placementId = null, packageKey = 'Silver') {
    // Use EPIN to activate an existing user package (front-end calls backend)
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const body = { epin: epinCode, placementId, package: packageKey };
      const data = await post('/epin/activate', body);
      // refresh data
      await refreshDashboard().catch(() => {});
      await fetchEpins().catch(() => {});
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      return data;
    } catch (err) {
      const msg = err?.message || 'EPIN activation failed';
      dispatch({ type: ACTIONS.SET_ERROR, payload: msg });
      throw err;
    }
  }

  // Simple helper to add UI notification
  function addNotification({ id, type = 'info', message }) {
    const note = { id: id || Date.now(), type, message, date: new Date().toISOString() };
    dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: note });
    // auto-clear after 10s
    setTimeout(() => dispatch({ type: ACTIONS.CLEAR_NOTIFICATION, payload: note.id }), 10000);
  }

  // update local wallet value quickly on client (optimistic)
  function updateWallet(amount) {
    const newWallet = Number((state.dashboard.wallet || 0) + Number(amount));
    dispatch({ type: ACTIONS.UPDATE_WALLET, payload: newWallet });
  }

  // ----------------------
  // Helper selectors (for UI)
  // ----------------------
  function getPackageInfo(key) {
    return PACKAGES[key] || null;
  }

  function getCurrentSessionIndex(now = new Date()) {
    // Returns index (0..7) of current session or null
    // We compare only hours:minutes based on local time.
    const minutes = (h, m) => h * 60 + m;
    const nMin = now.getHours() * 60 + now.getMinutes();
    for (let i = 0; i < SESSIONS.length; i++) {
      const [sh, sm] = SESSIONS[i].start.split(':').map(Number);
      const [eh, em] = SESSIONS[i].end.split(':').map(Number);
      let sMin = minutes(sh, sm);
      let eMin = minutes(eh === 0 ? 24 : eh, em); // treat 00:00 as 24:00 for last session
      if (nMin >= sMin && nMin < eMin) return i;
    }
    return null;
  }

  function canEarnPairForPackage(pkgKey) {
    // Simplified capping check: this should ideally consult backend session tracker
    // Frontend can't be authoritative — but we can show UI hint based on dashboard.pairs and capping
    const pkg = PACKAGES[pkgKey];
    if (!pkg) return false;
    const perDayCapping = pkg.capping * SESSIONS.length; // 1 pair per session * sessions
    // This uses dashboard.pairs as total pairs today (approx). Backend must enforce exact rule.
    return (state.dashboard.pairs || 0) < perDayCapping;
  }

  // ----------------------
  // Exported actions object
  // ----------------------
  const actions = {
    login,
    signup,
    logout,
    refreshDashboard,
    fetchGenealogy,
    fetchIncomes,
    fetchEpins,
    purchasePackage,
    activateEpin,
    addNotification,
    updateWallet,
    getPackageInfo,
    canEarnPairForPackage,
    // low-level
    setUser: (user, token) => {
      setAuthToken(token);
      persistAuth(user, token);
      dispatch({ type: ACTIONS.SET_USER, payload: { user, token } });
    },
  };

  // ----------------------
  // Provider value
  // ----------------------
  const value = { state, actions };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
