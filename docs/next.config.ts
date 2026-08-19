import type { NextConfig } from "next";

/**
 * Static export served from GitHub Pages behind the askkira.dev CNAME, so no
 * basePath: every route sits at the domain root.
 */
const nextConfig: NextConfig = {
  output: "export",
  // The tool and its docs site are separate npm projects in one repo; without
  // this, Turbopack picks the parent lockfile as the workspace root.
  turbopack: { root: import.meta.dirname },
  // Folder-per-route output so Pages serves every route with no rewrite rules.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
