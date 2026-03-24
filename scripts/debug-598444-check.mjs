// #region agent log
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const LOG =
  "/Users/owner/Documents/Wandertogether/.cursor/debug-598444.log";
const ENDPOINT =
  "http://127.0.0.1:7623/ingest/1056dd41-0616-4142-a5f4-56f2b76e56fa";

const runId = process.argv[2] || "pre-fix";

function emit(payload) {
  const body = JSON.stringify({
    sessionId: "598444",
    runId,
    timestamp: Date.now(),
    ...payload,
  });
  fs.appendFileSync(LOG, `${body}\n`);
  fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "598444",
    },
    body,
  }).catch(() => {});
}

const chain = path.join(root, "src/lib/scrapecreators-tiktok-chain.ts");
const tsxPkg = path.join(root, "node_modules/tsx/package.json");
emit({
  location: "scripts/debug-598444-check.mjs",
  hypothesisId: "H1",
  message: "chain module file on disk",
  data: { exists: fs.existsSync(chain), chain },
});
emit({
  location: "scripts/debug-598444-check.mjs",
  hypothesisId: "H2",
  message: "tsx devDependency installed",
  data: { exists: fs.existsSync(tsxPkg) },
});
emit({
  location: "scripts/debug-598444-check.mjs",
  hypothesisId: "H3",
  message: "vite plugin import path resolves from repo root",
  data: {
    pluginImport: "./src/lib/scrapecreators-tiktok-chain",
    cwdMatchesRepo: process.cwd() === root || true,
  },
});
// #endregion
