import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "**",
      },
    ],
    qualities: [50, 75, 90, 100],
  },
  allowedDevOrigins: ["**"],
};

export default nextConfig;
