// scripts/verify_frontend.js
import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const expected = [
  "package.json","vite.config.js","tailwind.config.js","postcss.config.js","index.html",
  "src/main.jsx","src/App.jsx","src/routes.jsx","src/api/axiosConfig.js","src/api/sessionApi.js",
  "src/utils/sessionTimer.js","src/utils/redGreenHelper.js","src/redux/sessionSlice.js",
  "src/components/SessionClock.jsx","src/pages/pvbv/RenewalStatus.jsx","src/pages/PageTemplate.jsx"
];

const missing = [];
const empty = [];
const warnings = [];

for (const rel of expected) {
  const fp = path.join(projectRoot, rel);
  if (!fs.existsSync(fp)) {
    missing.push(rel);
    continue;
  }
  try {
    const stat = fs.statSync(fp);
    if (stat.size === 0) { empty.push(rel); continue; }
    const content = fs.readFileSync(fp, "utf8");
    if (rel.endsWith(".jsx") || rel.endsWith(".js")) {
      if (/export\s+default|React/.test(content) === false) {
        warnings.push(rel + " (no default export / no React import detected)");
      }
    }
  } catch (e) {
    warnings.push(rel + " (read error)");
  }
}

console.log("\n=== FRONTEND VERIFY REPORT ===\n");
console.log("Checked files:", expected.length);
console.log("Missing files:", missing.length);
missing.forEach(f=>console.log("  MISSING:", f));
console.log("\nEmpty files:", empty.length);
empty.forEach(f=>console.log("  EMPTY:", f));
console.log("\nWarnings:", warnings.length);
warnings.forEach(w=>console.log("  WARN:", w));
console.log("\nIf missing/empty/warn exist, paste the report here and I will fix the exact files one-by-one.");
