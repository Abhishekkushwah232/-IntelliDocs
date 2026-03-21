import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse + pdf.js break when bundled (wrong paths like test/data/05-versions-space.pdf).
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
