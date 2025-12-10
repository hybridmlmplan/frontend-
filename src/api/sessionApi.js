// src/api/sessionApi.js
import api from "./axiosConfig";

/**
 * Frontend API helpers for session & pair status
 * Expected backend endpoints:
 * GET /session/current         -> { sessionIndex: 1..8, start: ISO, end: ISO }
 * GET /session/status          -> { sessionIndex, processedPairs, pendingPairsCount, pairs: [...] }
 * GET /user/pairs              -> user pair list with red/green status
 * GET /pv/summary              -> PV summary
 */

export const getCurrentSession = async () => {
  const r = await api.get("/session/current");
  return r.data;
};

export const getSessionStatus = async () => {
  const r = await api.get("/session/status");
  return r.data;
};

export const getUserPairs = async () => {
  const r = await api.get("/user/pairs");
  return r.data;
};

export const getPVSummary = async () => {
  const r = await api.get("/pv/summary");
  return r.data;
};

export default {
  getCurrentSession,
  getSessionStatus,
  getUserPairs,
  getPVSummary
};
