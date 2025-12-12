// src/utils.js
// Utility helpers & constants for Hybrid MLM frontend
// Includes: package defs, session timings, pair logic, rank/royalty helpers,
// formatting utils, small validators.
//
// Language: English + some Hindi comments for clarity where business-specific.

// ---------------------------
// Configuration / Constants
// ---------------------------

// Packages as per plan (one-time purchase)
export const PACKAGES = {
  SILVER: { key: 'silver', label: 'Silver', price: 35, pv: 35, pairIncome: 10, cappingPerSession: 1 },
  GOLD: { key: 'gold', label: 'Gold', price: 155, pv: 155, pairIncome: 50, cappingPerSession: 1 },
  RUBY: { key: 'ruby', label: 'Ruby', price: 1250, pv: 1250, pairIncome: 500, cappingPerSession: 1 },
};

export const PACKAGE_LIST = [PACKAGES.SILVER, PACKAGES.GOLD, PACKAGES.RUBY];

// 8 daily sessions timings (local times). end is exclusive.
export const SESSION_TIMINGS = [
  { id: 1, start: '06:00', end: '08:15' },
  { id: 2, start: '08:15', end: '10:30' },
  { id: 3, start: '10:30', end: '12:45' },
  { id: 4, start: '12:45', end: '15:00' },
  { id: 5, start: '15:00', end: '17:15' },
  { id: 6, start: '17:15', end: '19:30' },
  { id: 7, start: '19:30', end: '21:45' },
  { id: 8, start: '21:45', end: '00:00' }, // note: crosses midnight logically
];

// Rank definitions & cumulative royalty % per rank (example values based on plan).
// The plan: Star joining gives 3% until ₹35 (special case) then rank-wise 1%..8% continuously.
// We'll encode a cumulative percentage map and provide computeRoyalty to calculate final %.
export const RANKS = [
  { key: 'star', label: 'Star', royaltyPct: 0.01 },           // 1%
  { key: 'silverStar', label: 'Silver Star', royaltyPct: 0.02 }, // 2%
  { key: 'goldStar', label: 'Gold Star', royaltyPct: 0.03 },     // 3%
  { key: 'rubyStar', label: 'Ruby Star', royaltyPct: 0.04 },     // 4%
  { key: 'emeraldStar', label: 'Emerald Star', royaltyPct: 0.05 }, //5%
  { key: 'diamondStar', label: 'Diamond Star', royaltyPct: 0.06 }, //6%
  { key: 'crownStar', label: 'Crown Star', royaltyPct: 0.07 },     //7%
  { key: 'ambassadorStar', label: 'Ambassador Star', royaltyPct: 0.08 }, //8%
  { key: 'companyStar', label: 'Company Star', royaltyPct: 0.09 }, //9% (if needed)
];

// Business-specific small config for royalty special rule
export const ROYALTY_CONFIG = {
  // special: when user only has Star (joining), they get 3% until Rs 35 (this is a plan detail).
  joiningStarFixedPct: 0.03,
  joiningStarCapAmount: 35,
  // For cumulative royalty, we'll sum rank percentages (as per user's achieved ranks),
  // but ensure joiningStar rule is respected if applicable.
  cumulative: true,
};

// ---------------------------
// Date / Time Utilities
// ---------------------------

/**
 * parse "HH:MM" into today's Date object (local).
 * If time crosses midnight and is logically next day, handle in logic using compare functions.
 */
export function parseTimeToToday(timeStr) {
  const [hh, mm] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d;
}

/**
 * Check if current local time is within [start, end) where start/end are "HH:MM".
 * Handles midnight crossing (end <= start => end is next day).
 */
export function isNowInRange(startStr, endStr) {
  const now = new Date();
  const start = parseTimeToToday(startStr);
  let end = parseTimeToToday(endStr);
  if (end <= start) end.setDate(end.getDate() + 1); // crosses midnight
  return now >= start && now < end;
}

/**
 * Get current session object from SESSION_TIMINGS according to local time.
 * Returns session object or null.
 */
export function getCurrentSessionFromTimings() {
  for (const s of SESSION_TIMINGS) {
    if (isNowInRange(s.start, s.end)) return s;
  }
  return null;
}

/**
 * Get next session from now (timings list). If none left today, returns first session of next day.
 */
export function getNextSessionFromTimings() {
  const now = new Date();
  for (const s of SESSION_TIMINGS) {
    const start = parseTimeToToday(s.start);
    let end = parseTimeToToday(s.end);
    if (end <= start) end.setDate(end.getDate() + 1);
    if (end > now) return s;
  }
  // fallback: return first session
  return SESSION_TIMINGS[0];
}

// ---------------------------
// Formatting Helpers
// ---------------------------

/** Format number as INR currency (simple) */
export function formatCurrencyINR(value) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  } catch (e) {
    return `₹${Math.round(Number(value) || 0)}`;
  }
}

/** Small date formatter */
export function formatDateShort(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ---------------------------
// Package / Pair helpers
// ---------------------------

/** Get package definition by key */
export function getPackage(key) {
  return PACKAGE_LIST.find(p => p.key === String(key).toLowerCase()) || null;
}

/** Given a packageKey, return pair income */
export function getPairIncomeForPackage(key) {
  const pkg = getPackage(key);
  return pkg ? pkg.pairIncome : 0;
}

/**
 * Check if user can create/earn more pairs in current session for given package.
 * userSessionPairsCount = number of pairs already counted/created for that user+package in the current session.
 * respects cappingPerSession from package
 */
export function canEarnMorePairsInSession(packageKey, userSessionPairsCount) {
  const pkg = getPackage(packageKey);
  if (!pkg) return false;
  const cap = pkg.cappingPerSession ?? 1;
  const count = Number(userSessionPairsCount || 0);
  return count < cap;
}

/**
 * Decide whether a new pair (leftPV + rightPV) is green.
 * Business: pair becomes green only when opposite leg matches (simple check: both sides >= package PV)
 * We implement a simple rule: if min(leftPV, rightPV) >= packagePV => green
 * This can be replaced by backend logic; frontend uses this for quick UI.
 */
export function isPairGreen({ leftPV = 0, rightPV = 0, packageKey }) {
  const pkg = getPackage(packageKey);
  if (!pkg) return false;
  const required = pkg.pv || 0;
  return Math.min(Number(leftPV), Number(rightPV)) >= Number(required);
}

// ---------------------------
// Rank & Royalty helpers
// ---------------------------

/**
 * Return list of ranks user has achieved (by key), based on their rank level.
 * Example input: userRanks = ['star','silverStar','goldStar'] or highestRankKey = 'goldStar'
 * We'll provide helper to compute cumulative royalty percentage.
 */

/** get rank object by key */
export function getRankObj(key) {
  return RANKS.find(r => r.key === key) || null;
}

/**
 * computeRoyaltyPercent(userRankKeys, earnedAmount)
 * - userRankKeys: array of rank keys user has achieved (e.g. ['star', 'silverStar'])
 * - earnedAmount: numeric amount that may be used for joiningStar special rule (Rs35 cap)
 *
 * Returns object: { pct: 0.03, breakdown: [{key, pct}], specialApplied: bool }
 *
 * Rules implemented (best-effort from your plan):
 * - If user has 'star' only (or has star among ranks) they get joiningStarFixedPct (3%) until joiningStarCapAmount (35).
 * - In cumulative mode (ROYALTY_CONFIG.cumulative==true), sum rank.royaltyPct for all achieved ranks.
 * - The returned pct is capped to sensible values (not exceeding 1).
 */
export function computeRoyaltyPercent(userRankKeys = [], earnedAmount = 0) {
  const achieved = Array.isArray(userRankKeys) ? userRankKeys : [];
  const breakdown = [];
  let specialApplied = false;

  // If user has 'star' present and earnedAmount <= joiningStarCapAmount then apply special joining rule
  if (achieved.includes('star') && earnedAmount <= ROYALTY_CONFIG.joiningStarCapAmount) {
    specialApplied = true;
    breakdown.push({ key: 'star_joining_special', pct: ROYALTY_CONFIG.joiningStarFixedPct });
    // If additional ranks exist, they still continue to give cumulative royalty (as per plan: cumulative never stops)
    const otherRanks = achieved.filter(k => k !== 'star');
    for (const rk of otherRanks) {
      const rankObj = getRankObj(rk);
      if (rankObj && rankObj.royaltyPct) breakdown.push({ key: rk, pct: rankObj.royaltyPct });
    }
  } else {
    // Normal cumulative
    for (const rk of achieved) {
      const rankObj = getRankObj(rk);
      if (rankObj && rankObj.royaltyPct) breakdown.push({ key: rk, pct: rankObj.royaltyPct });
    }
  }

  // Sum the percentages
  const pct = breakdown.reduce((acc, b) => acc + (b.pct || 0), 0);

  return {
    pct,
    breakdown,
    specialApplied,
  };
}

/**
 * computeRoyaltyAmount(userRankKeys, bvAmount)
 * - bvAmount: the BV/CTO amount which royalty % applies to (bv-based incomes)
 */
export function computeRoyaltyAmount(userRankKeys = [], bvAmount = 0) {
  const { pct } = computeRoyaltyPercent(userRankKeys, bvAmount);
  const amount = Number(bvAmount || 0) * (pct || 0);
  return { amount, pct };
}

// ---------------------------
// Small validators & helpers
// ---------------------------

/** Validate mobile number (basic) */
export function validateMobile(mobile) {
  if (!mobile) return false;
  const s = String(mobile).trim();
  // simple India-style: 10 digits, may start with 6-9
  return /^[6-9]\d{9}$/.test(s);
}

/** Validate email (simple) */
export function validateEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

/** Simple uid generator for client-side temporary ids */
export function uid(prefix = '') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------
// Example small calculators used by UI
// ---------------------------

/**
 * calculatePairPayoutsForUserSession(userPackages, leftPV, rightPV)
 * - userPackages: array of packageKey strings the user owns/active (e.g. ['silver','gold'])
 * - returns array of payout objects for packages that would pay if this pair becomes green
 */
export function calculatePairPayoutsForUserSession(userPackages = [], leftPV = 0, rightPV = 0) {
  const results = [];
  for (const pk of userPackages) {
    const pkg = getPackage(pk);
    if (!pkg) continue;
    const green = isPairGreen({ leftPV, rightPV, packageKey: pk });
    results.push({
      packageKey: pk,
      packageLabel: pkg.label,
      pairIncome: pkg.pairIncome,
      willPay: green,
    });
  }
  return results;
}

/**
 * compact helper to compute total daily max pair income for a given package
 * (capping * sessionsPerDay * pairIncome)
 */
export function dailyMaxIncomeForPackage(packageKey, sessionsPerDay = SESSION_TIMINGS.length) {
  const pkg = getPackage(packageKey);
  if (!pkg) return 0;
  return pkg.cappingPerSession * sessionsPerDay * pkg.pairIncome;
}

// ---------------------------
// Export default utility object (optional)
// ---------------------------
const Utils = {
  PACKAGES,
  PACKAGE_LIST,
  SESSION_TIMINGS,
  RANKS,
  ROYALTY_CONFIG,

  // formatting
  formatCurrencyINR,
  formatDateShort,

  // timing
  parseTimeToToday,
  isNowInRange,
  getCurrentSessionFromTimings,
  getNextSessionFromTimings,

  // packages/pair
  getPackage,
  getPairIncomeForPackage,
  canEarnMorePairsInSession,
  isPairGreen,
  calculatePairPayoutsForUserSession,
  dailyMaxIncomeForPackage,

  // ranks/royalty
  getRankObj,
  computeRoyaltyPercent,
  computeRoyaltyAmount,

  // misc
  validateMobile,
  validateEmail,
  uid,
};

export default Utils;
