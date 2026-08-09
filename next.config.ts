import type { NextConfig } from "next";

import "./src/env";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 600,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
