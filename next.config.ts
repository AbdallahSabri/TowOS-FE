import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root: a stray package-lock.json in the parent tree
  // otherwise makes Next's root auto-detection ambiguous.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
