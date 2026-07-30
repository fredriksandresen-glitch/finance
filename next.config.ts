import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
