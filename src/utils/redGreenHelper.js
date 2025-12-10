// src/utils/redGreenHelper.js
// Helpers to interpret user's pair items and their red/green state
// Pair object expected: { _id, packageCode: 'silver'|'gold'|'ruby', side: 'L'|'R', isGreen: boolean, matchedWith, createdAt }

export function summarizePairs(pairs = []) {
  const summary = { silver: { red: 0, green: 0 }, gold: { red: 0, green: 0 }, ruby: { red: 0, green: 0 } };
  for (const p of pairs) {
    const pc = (p.packageCode || "silver").toLowerCase();
    if (p.isGreen) summary[pc].green++;
    else summary[pc].red++;
  }
  return summary;
}

export function nextPendingPairs(pairs = []) {
  // return earliest red pairs (sorted)
  return pairs.filter(p => !p.isGreen).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
}
