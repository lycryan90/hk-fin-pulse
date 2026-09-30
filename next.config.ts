import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables self-contained Linux portable packages (see scripts/make-portable-linux.sh)
  output: "standalone",
};

export default nextConfig;
