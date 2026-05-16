/**
 * Build wrapper for exFAT drives.
 *
 * Loads the readlink patch before invoking next build so the webpack
 * compilation phase (which calls fs.readlink via enhanced-resolve) works
 * on exFAT.
 *
 * LIMITATION: The "Collecting page data" phase of next build calls Node.js's
 * C++ realpath binding directly — below all JavaScript hooks — and cannot be
 * patched. Local production builds therefore fail on exFAT after compilation.
 *
 * WORKAROUND: Use `pnpm dev` for local development (works fine) and rely on
 * Vercel for production builds (Vercel runs on Linux, no exFAT limitation).
 */

const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");

const patchPath = path.resolve(__dirname, "patch-readlink.cjs");
const nextBin = path.resolve(__dirname, "../node_modules/next/dist/bin/next");

// Copy patch to a space-free path so --require works without quoting issues
const tempPatch = path.join(os.tmpdir(), "patch-readlink-dn.cjs").replace(/\\/g, "/");
fs.copyFileSync(patchPath, tempPatch);

require(tempPatch);

console.warn(
  "\n⚠  Running on exFAT (D:). Compilation will succeed but " +
  '"Collecting page data" will fail.\n' +
  "   For full production builds, push to GitHub and use Vercel.\n"
);

try {
  execFileSync(process.execPath, ["--require", tempPatch, nextBin, "build"], {
    stdio: "inherit",
    env: process.env,
  });
} catch {
  process.exit(1);
}
