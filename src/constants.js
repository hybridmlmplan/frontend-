// ============================================================
// HYBRID MLM PLAN – GLOBAL FRONTEND CONSTANTS
// This file is the master source of truth for the frontend.
// ============================================================

// ===============================
// API CONFIG
// ===============================
export const API_BASE = "https://backend-24ch.onrender.com/api";

// ===============================
// PACKAGES
// ===============================
export const PACKAGES = {
  SILVER: {
    name: "Silver",
    price: 35,
    pv: 35,
    pairIncome: 10,
    capping: 1, // per session
    code: "SP",
  },
  GOLD: {
    name: "Gold",
    price: 155,
    pv: 155,
    pairIncome: 50,
    capping: 1,
    code: "GP",
  },
  RUBY: {
    name: "Ruby",
    price: 1250,
    pv: 1250,
    pairIncome: 500,
    capping: 1,
    code: "RP",
  },
};

// ===============================
// EPIN SYSTEM
// ===============================
export const EPIN_RULES = {
  unlimitedTransfer: true,
  noExpiry: true,
};

// ===============================
// SESSION TIMINGS (8 SESSIONS)
// ===============================
export const SESSIONS = [
  { start: "06:00", end: "08:15" },
  { start: "08:15", end: "10:30" },
  { start: "10:30", end: "12:45" },
  { start: "12:45", end: "15:00" },
  { start: "15:00", end: "17:15" },
  { start: "17:15", end: "19:30" },
  { start: "19:30", end: "21:45" },
  { start: "21:45", end: "00:00" },
];

// ===============================
// RANK INCOME TABLE
// ===============================
export const RANKS = {
  SILVER: [
    { name: "Star", income: 10 },
    { name: "Silver Star", income: 20 },
    { name: "Gold Star", income: 40 },
    { name: "Ruby Star", income: 80 },
    { name: "Emerald Star", income: 160 },
    { name: "Diamond Star", income: 320 },
    { name: "Crown Star", income: 640 },
    { name: "Ambassador Star", income: 1280 },
    { name: "Company Star", income: 2560 },
  ],
  GOLD: [
    { name: "Star", income: 50 },
    { name: "Silver Star", income: 100 },
    { name: "Gold Star", income: 200 },
    { name: "Ruby Star", income: 400 },
    { name: "Emerald Star", income: 800 },
    { name: "Diamond Star", income: 1600 },
    { name: "Crown Star", income: 3200 },
    { name: "Ambassador Star", income: 6400 },
    { name: "Company Star", income: 12800 },
  ],
  RUBY: [
    { name: "Star", income: 500 },
    { name: "Silver Star", income: 1000 },
    { name: "Gold Star", income: 2000 },
    { name: "Ruby Star", income: 4000 },
    { name: "Emerald Star", income: 8000 },
    { name: "Diamond Star", income: 16000 },
    { name: "Crown Star", income: 32000 },
    { name: "Ambassador Star", income: 64000 },
    { name: "Company Star", income: 128000 },
  ],
};

// ===============================
// LEVEL SYSTEM
// ===============================
export const LEVEL_SYSTEM = {
  STAR1: { requirement: 10, levels: 1, ctoBV: 1.0 },
  STAR2: { requirement: 70, levels: 2, ctoBV: 1.1 },
  STAR3: { requirement: 200, levels: 3, ctoBV: 1.2 },
  LEVEL_INCOME: 0.5, // 0.5% BV per level (from 1 to 10)
};

// ===============================
// ROYALTY (only for Silver ranks)
// ===============================
export const ROYALTY = {
  initial: 3, // up to ₹35
  sliding: {
    // continuous royalties
    Star: 1,
    SilverStar: 2,
    GoldStar: 3,
    RubyStar: 4,
    EmeraldStar: 5,
    DiamondStar: 6,
    CrownStar: 7,
    AmbassadorStar: 8,
    CompanyStar: 8,
  },
};

// ===============================
// FUNDS
// ===============================
export const FUNDS = {
  CAR: {
    percent: 2,
    eligibleFrom: "Ruby Star",
  },
  HOUSE: {
    percent: 2,
    eligibleFrom: "Diamond Star",
  },
  TRAVEL: {
    national: "Ruby Star",
    international: "Diamond Star",
  },
};

// ===============================
// BINARY SYSTEM RULES
// ===============================
export const BINARY = {
  pvBased: true,
  redGreenCycle: true,
  infiniteCycle: true,
  matchRule: "Left PV + Right PV = Pair",
};

// ===============================
// FRANCHISE SYSTEM
// ===============================
export const FRANCHISE = {
  referrerPercent: 1,
  holderPercentMin: 5,
};

// ===============================
// WALLET TYPES
// ===============================
export const WALLETS = {
  BINARY: "binary_wallet",
  RANK: "rank_wallet",
  LEVEL: "level_wallet",
  ROYALTY: "royalty_wallet",
  FUND: "fund_wallet",
  FRANCHISE: "franchise_wallet",
};

// ===============================
// SIGNUP FIELDS
// ===============================
export const SIGNUP_FIELDS = [
  "name",
  "email",
  "phone",
  "sponsorId",
  "placementId",
  "placementSide",
];

// ===============================
// PLACEHOLDER UTIL
// ===============================
export const getSessionIndex = () => {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < SESSIONS.length; i++) {
    const [h1, m1] = SESSIONS[i].start.split(":").map(Number);
    const [h2, m2] = SESSIONS[i].end.split(":").map(Number);

    const start = h1 * 60 + m1;
    const end = h2 * 60 + m2;

    if (current >= start && current < end) return i;
  }
  return -1;
};
