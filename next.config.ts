import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  webpack(config) {
    // exFAT does not support symlinks; readlink returns EISDIR instead of
    // EINVAL, which crashes webpack's resolver and snapshot system.
    config.resolve = { ...config.resolve, symlinks: false };
    config.cache = false;
    return config;
  },
};

export default nextConfig;
