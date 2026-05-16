/**
 * exFAT Trace Patch — loaded during `pnpm dev` via dev.cjs
 *
 * Next.js 15 writes a .next/trace file via fs.createWriteStream on every
 * startup. On exFAT, if the file was left behind by a crashed previous run,
 * Windows returns EPERM instead of letting the new process truncate it,
 * crashing the dev server before it starts.
 *
 * This patch intercepts fs.createWriteStream for the trace file path and:
 *  1. Tries to delete an existing trace file so Next.js gets a clean open.
 *  2. If the stream errors with EPERM anyway, silently swallows the error
 *     (tracing is not critical for local development).
 */

const fs = require("fs");
const path = require("path");
const { Writable } = require("stream");

const _createWriteStream = fs.createWriteStream.bind(fs);

function isTracePath(filePath) {
  const str = typeof filePath === "string" ? filePath : String(filePath ?? "");
  return /[/\\]\.next[/\\]trace$/.test(str);
}

function noopWritable() {
  return new Writable({
    write(_chunk, _enc, cb) { cb(); },
    final(cb) { cb(); },
  });
}

fs.createWriteStream = function patchedCreateWriteStream(filePath, options) {
  if (!isTracePath(filePath)) {
    return _createWriteStream(filePath, options);
  }

  const strPath = typeof filePath === "string" ? filePath : String(filePath);

  // Ensure .next exists, then remove any stale trace file
  try {
    fs.mkdirSync(path.dirname(strPath), { recursive: true });
    fs.unlinkSync(strPath);
  } catch {
    // File didn't exist or couldn't be removed — proceed anyway
  }

  // Try to open normally; if EPERM fires on the stream, swallow it
  try {
    const stream = _createWriteStream(filePath, options);
    stream.on("error", (err) => {
      if (err.code === "EPERM") {
        // Suppress — trace output is non-critical on local exFAT dev
        if (!stream.destroyed) stream.destroy();
      } else {
        // Re-emit real errors so they're not silently lost
        process.nextTick(() => { throw err; });
      }
    });
    return stream;
  } catch (err) {
    if (err.code === "EPERM") {
      return noopWritable();
    }
    throw err;
  }
};
