// src/utils/redGreenHelper.js
/**
 * Red-Green helper utilities for Hybrid MLM plan
 *
 * NOTE:
 *  - This is a client-side utility / simulation helper.
 *  - THE SERVER MUST BE THE SOURCE OF TRUTH for final matching, payouts and wallet updates.
 *
 * Pair object shape:
 * {
 *   id: string,               // unique id (uuid recommended)
 *   userId: string,           // owner user id
 *   packageKey: 'silver'|'gold'|'ruby',
 *   pv: number,               // PV value contributed by this pair node (usually package PV)
 *   side: 'left'|'right',
 *   status: 'red'|'green',    // red = pending, green = paid
 *   sessionIdx: number,       // 1..8 (which session this pair belongs to)
 *   createdAt: ISOString,
 *   meta: { ... }             // optional meta (placement info etc.)
 * }
 */

const PACKAGES = {
  silver: { pv: 35, pairIncome: 10, cappingPerSession: 1 },
  gold: { pv: 155, pairIncome: 50, cappingPerSession: 1 },
  ruby: { pv: 1250, pairIncome: 500, cappingPerSession: 1 },
};

/* ---------- Utility helpers ---------- */

/**
 * safe clone (shallow deep for arrays of plain objects)
 */
function cloneArrayOfObjects(arr) {
  return arr.map((o) => ({ ...o, meta: o.meta ? { ...o.meta } : {} }));
}

/**
 * simple groupBy
 */
function groupBy(list, keyFn) {
  return list.reduce((acc, item) => {
    const k = keyFn(item);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {});
}

/**
 * count how many green pairs for given session & package
 */
function countGreenPairsInSession(pairs, sessionIdx, packageKey) {
  return (pairs || []).filter(
    (p) => p.sessionIdx === sessionIdx && p.packageKey === packageKey && p.status === "green"
  ).length;
}

/* ---------- Core functions ---------- */

/**
 * Create a new pair node object (does not mutate arrays)
 * @param {Object} opts { id, userId, packageKey, side, sessionIdx, meta }
 * @returns {Object} pair
 */
export function createPair(opts = {}) {
  const { id, userId, packageKey = "silver", side = "left", sessionIdx = 1, meta = {} } = opts;
  if (!["left", "right"].includes(side)) throw new Error("side must be 'left' or 'right'");
  if (!PACKAGES[packageKey]) throw new Error("unknown packageKey");
  return {
    id: id || `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    userId,
    packageKey,
    pv: PACKAGES[packageKey].pv,
    side,
    status: "red",
    sessionIdx,
    createdAt: new Date().toISOString(),
    meta: { ...meta },
  };
}

/**
 * Find a candidate opposite pair for given pair in the same session/package.
 * Selection rules (greedy/simple):
 *  - opposite side (left vs right)
 *  - same packageKey
 *  - status === 'red'
 *  - not same userId (optional: avoid self-matching)
 *  - prefer oldest created (FIFO)
 *
 * @param {Array} pairs - array of pair objects
 * @param {Object} pair - the pair to find opposite for
 * @param {Object} [opts] - { avoidSameUser = true }
 * @returns {Object|null} opposite pair or null
 */
export function findOppositeCandidate(pairs, pair, opts = {}) {
  const { avoidSameUser = true } = opts;
  if (!pair) return null;
  const oppositeSide = pair.side === "left" ? "right" : "left";
  const candidates = pairs
    .filter(
      (p) =>
        p.sessionIdx === pair.sessionIdx &&
        p.packageKey === pair.packageKey &&
        p.side === oppositeSide &&
        p.status === "red" &&
        (!avoidSameUser || p.userId !== pair.userId)
    )
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // oldest first

  return candidates.length ? candidates[0] : null;
}

/**
 * Match two pairs (left + right) and mark both as green.
 * Returns an income record that should be given to the 'smaller' party or per business rules.
 *
 * Business assumption (based on plan):
 *  - When a left and right pair match, the income amount is PACKAGE.pairIncome (for that package)
 *  - Both nodes become "green" (paid) for that session round
 *
 * @param {Array} pairs - array of pair objects (will not be mutated)
 * @param {Object} leftPair - left node object
 * @param {Object} rightPair - right node object
 * @returns {Object} { updatedPairs, income } where updatedPairs is new array and income is { amount, packageKey, leftPairId, rightPairId, sessionIdx, timestamp }
 */
export function matchPairs(pairs, leftPair, rightPair) {
  if (!leftPair || !rightPair) throw new Error("both pairs required");
  if (leftPair.packageKey !== rightPair.packageKey)
    throw new Error("packageKey mismatch for matching");
  if (leftPair.sessionIdx !== rightPair.sessionIdx)
    throw new Error("sessionIdx mismatch for matching");
  // make shallow clone of pairs array and update nodes
  const cloned = cloneArrayOfObjects(pairs);
  const pkg = PACKAGES[leftPair.packageKey];
  const idxLeft = cloned.findIndex((p) => p.id === leftPair.id);
  const idxRight = cloned.findIndex((p) => p.id === rightPair.id);
  if (idxLeft === -1 || idxRight === -1) {
    throw new Error("pair not found in the provided pairs array");
  }
  // mark both as green
  cloned[idxLeft] = { ...cloned[idxLeft], status: "green", greenAt: new Date().toISOString() };
  cloned[idxRight] = { ...cloned[idxRight], status: "green", greenAt: new Date().toISOString() };

  const income = {
    amount: pkg.pairIncome,
    packageKey: leftPair.packageKey,
    leftPairId: leftPair.id,
    rightPairId: rightPair.id,
    sessionIdx: leftPair.sessionIdx,
    timestamp: new Date().toISOString(),
  };

  return { updatedPairs: cloned, income };
}

/**
 * Process matching for a single session.
 *
 * Algorithm (greedy):
 *  - For given sessionIdx, for each packageKey:
 *     - Respect per-session capping (PACKAGE.cappingPerSession)
 *     - Iterate unprocessed red pairs in FIFO order
 *     - For each red pair, find an opposite candidate and match via matchPairs()
 *     - Stop when per-package capping reaches
 *
 * Note:
 *  - This function does optimistic, deterministic client-side matching to preview results.
 *  - Server must validate and perform authoritative matching & payouts.
 *
 * @param {Array} pairs - all pair nodes (will not be mutated)
 * @param {number} sessionIdx - 1..8
 * @param {Object} [opts] - { packageCappingOverride: { silver:1,... }, avoidSameUser = true }
 * @returns {Object} { updatedPairs, incomes, matchedCountByPackage }
 */
export function processSessionMatching(pairs, sessionIdx, opts = {}) {
  const { packageCappingOverride = {}, avoidSameUser = true } = opts;
  let working = cloneArrayOfObjects(pairs);
  const incomes = [];
  const matchedCountByPackage = {};

  // for each package, run capping-limited matching
  for (const packageKey of Object.keys(PACKAGES)) {
    const capping =
      typeof packageCappingOverride[packageKey] === "number"
        ? packageCappingOverride[packageKey]
        : PACKAGES[packageKey].cappingPerSession;

    matchedCountByPackage[packageKey] = countGreenPairsInSession(working, sessionIdx, packageKey);

    // find red nodes in this session/package in FIFO order
    let redList = working
      .filter(
        (p) =>
          p.sessionIdx === sessionIdx && p.packageKey === packageKey && p.status === "red"
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // iterate and attempt matches until capping reached or no candidates
    for (let i = 0; i < redList.length && matchedCountByPackage[packageKey] < capping; i++) {
      // refresh candidate (skip if already matched in previous iteration)
      const candidate = redList[i];
      // ensure candidate still red in working copy
      const still = working.find((p) => p.id === candidate.id);
      if (!still || still.status !== "red") continue;

      // find opposite
      const opposite = findOppositeCandidate(working, still, { avoidSameUser });
      if (!opposite) continue; // can't match this node now

      // perform match
      const { updatedPairs, income } = matchPairs(working, still.side === "left" ? still : opposite, still.side === "left" ? opposite : still);
      working = updatedPairs;
      incomes.push(income);
      matchedCountByPackage[packageKey] += 1;

      // after match, remove the matched nodes from redList (so loop doesn't rematch)
      redList = redList.filter((r) => r.id !== still.id && r.id !== opposite.id);
      // keep i at -1 because next iteration i++ will move to proper index after filter; but easiest to just continue
    }
  }

  return {
    updatedPairs: working,
    incomes,
    matchedCountByPackage,
  };
}

/**
 * Reset red/green cycles for a particular user's package (e.g., after package completes in plan).
 * Behavior:
 *  - Option A (default): mark all pairs for that user & package back to 'red' except the ones created after `sinceDate` (if provided)
 *  - Option B: remove green flag / create new red nodes as needed.
 *
 * @param {Array} pairs - array of pair objects
 * @param {string} userId
 * @param {string} packageKey
 * @param {Object} [opts] - { sinceDate: ISOString|null, keepRecent = true }
 * @returns {Array} new pairs array
 */
export function resetPackageCycle(pairs, userId, packageKey, opts = {}) {
  const { sinceDate = null, keepRecent = true } = opts;
  const cloned = cloneArrayOfObjects(pairs);
  for (let i = 0; i < cloned.length; i++) {
    const p = cloned[i];
    if (p.userId === userId && p.packageKey === packageKey) {
      if (sinceDate && keepRecent) {
        if (new Date(p.createdAt) < new Date(sinceDate)) {
          cloned[i] = { ...p, status: "red", resetAt: new Date().toISOString() };
        }
      } else {
        // reset all
        cloned[i] = { ...p, status: "red", resetAt: new Date().toISOString() };
      }
    }
  }
  return cloned;
}

/* ---------- Small helpers for UI / validation ---------- */

/**
 * Validate whether a new pair can be accepted in a session (client-side check)
 * Checks:
 *  - sessionIdx in 1..8
 *  - packageKey valid
 *  - per-session capping not exceeded (based on existing pairs array)
 *
 * @param {Array} pairs
 * @param {{ packageKey: string, sessionIdx: number }} opts
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canAcceptPair(pairs, { packageKey, sessionIdx }) {
  if (!PACKAGES[packageKey]) return { ok: false, reason: "invalid package" };
  if (!(sessionIdx >= 1 && sessionIdx <= 8)) return { ok: false, reason: "invalid session" };
  const existingGreen = countGreenPairsInSession(pairs, sessionIdx, packageKey);
  if (existingGreen >= PACKAGES[packageKey].cappingPerSession) {
    return { ok: false, reason: "capping reached for package in this session" };
  }
  return { ok: true };
}

/* ---------- Exports ---------- */

export const RedGreenUtils = {
  PACKAGES,
  createPair,
  findOppositeCandidate,
  matchPairs,
  processSessionMatching,
  resetPackageCycle,
  canAcceptPair,
  countGreenPairsInSession,
  groupBy,
};

export default RedGreenUtils;

/* ---------- Example usage (comments) ----------

import RedGreenUtils from './utils/redGreenHelper';

const pairs = [];
pairs.push(RedGreenUtils.createPair({ userId: 'u1', packageKey: 'silver', side: 'left', sessionIdx: 1 }));
pairs.push(RedGreenUtils.createPair({ userId: 'u2', packageKey: 'silver', side: 'right', sessionIdx: 1 }));
const { updatedPairs, incomes } = RedGreenUtils.processSessionMatching(pairs, 1);
console.log(incomes); // [{ amount: 10, packageKey: 'silver', leftPairId:..., rightPairId:... }]

Remember: After simulation, call backend endpoint to run authoritative engine and record payouts/wallet changes.
*/
