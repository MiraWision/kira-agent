import type { NextConfig } from "next";

/**
 * Static export served from GitHub Project Pages at
 * https://mirawision.github.io/askkira — hence the basePath. Moving to a
 * custom domain later is two changes: empty this, and drop a CNAME in public/.
 */
const nextConfig: NextConfig = {
  output: "export",
  // The tool and its docs site are separate npm projects in one repo; without
  // this, Turbopack picks the parent lockfile as the workspace root.
  turbopack: { root: import.meta.dirname },
  basePath: "/askkira",
  // Folder-per-route output so Pages serves every route with no rewrite rules.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
