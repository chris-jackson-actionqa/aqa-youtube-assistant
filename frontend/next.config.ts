import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Don't run ESLint during production builds in CI
    // ESLint is already run as part of unit tests
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't type-check during production builds in CI
    // Type checking is already done during development and unit tests
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
