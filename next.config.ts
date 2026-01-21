import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/watcher', // Adjust this if your repo name is different
};

export default nextConfig;
