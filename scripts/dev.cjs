/**
 * Dev-server wrapper for exFAT drives.
 *
 * Applies the readlink patch (same reason as build.cjs) and the new
 * trace-file patch before spawning `next dev`, so the dev server starts
 * cleanly even after a crash leaves a stale .next/trace on exFAT.
 */

const path = require("path");
const os = require("os");
const fs = require("fs");
const { spawn } = require("child_process");

const patchReadlink = path.resolve(__dirname, "patch-readlink.cjs");
const patchTrace = path.resolve(__dirname, "patch-trace.cjs");
const nextBin = path.resolve(__dirname, "../node_modules/next/dist/bin/next");

// Copy patches to space-free temp paths so --require works without quoting issues
const tmpReadlink = path.join(os.tmpdir(), "patch-readlink-dn.cjs");
const tmpTrace = path.join(os.tmpdir(), "patch-trace-dn.cjs");
fs.copyFileSync(patchReadlink, tmpReadlink);
fs.copyFileSync(patchTrace, tmpTrace);

const child = spawn(
  process.execPath,
  ["--require", tmpReadlink, "--require", tmpTrace, nextBin, "dev"],
  { stdio: "inherit", env: process.env }
);

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));

child.on("exit", (code) => process.exit(code ?? 0));
