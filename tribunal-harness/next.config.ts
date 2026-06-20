import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
    // Pin the file-tracing root to this app directory. A sibling lockfile exists
    // one level up, so Next would otherwise infer the wrong workspace root and warn.
    outputFileTracingRoot: path.join(__dirname),
    // Enable server-side features for API routes
    serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
