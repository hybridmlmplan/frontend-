export function formatCurrency(x) {
  return typeof x === "number" ? `₹${x.toFixed(2)}` : x;
}
