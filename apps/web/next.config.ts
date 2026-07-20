import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile the shared workspace packages instead of requiring them to
  // pre-build — keeps dev loop fast across the monorepo boundary.
  transpilePackages: ["@codea-srm/core", "@codea-srm/db"],
};

export default nextConfig;
