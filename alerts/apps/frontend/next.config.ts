import { Routes } from "@/lib/routes";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: Routes.ALERT_LIST,
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
