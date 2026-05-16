/**
 * exFAT Readlink Patch — loaded during `pnpm build` via build.cjs
 *
 * On exFAT, fs.readlink() returns EISDIR instead of EINVAL for non-symlink
 * paths. webpack/enhanced-resolve expect EINVAL and crash on EISDIR.
 * This patch normalises EISDIR → EINVAL for the webpack compilation phase.
 *
 * NOTE: The "Collecting page data" phase of next build calls realpath at the
 * C++ level (below all JS hooks) and cannot be patched from JavaScript.
 * Production builds are therefore intended to run on Vercel (Linux) rather
 * than locally on this exFAT drive.
 */

const fs = require("fs");

// ─── fs.readlink (async) ──────────────────────────────────────────────────────

const _readlink = fs.readlink.bind(fs);
fs.readlink = function (path, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  _readlink(path, options, function (err, linkString) {
    if (err && err.code === "EISDIR") {
      callback(
        Object.assign(new Error(`EINVAL: invalid argument, readlink '${path}'`), {
          code: "EINVAL",
          syscall: "readlink",
          path,
        })
      );
    } else {
      callback(err, linkString);
    }
  });
};

// ─── fs.readlinkSync ──────────────────────────────────────────────────────────

const _readlinkSync = fs.readlinkSync.bind(fs);
fs.readlinkSync = function (path, options) {
  try {
    return _readlinkSync(path, options);
  } catch (err) {
    if (err && err.code === "EISDIR") {
      throw Object.assign(
        new Error(`EINVAL: invalid argument, readlink '${path}'`),
        { code: "EINVAL", syscall: "readlink", path }
      );
    }
    throw err;
  }
};
