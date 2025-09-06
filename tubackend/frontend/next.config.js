/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/': __dirname + '/',
    };
    return config;
  },
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  },
  // Removed experimental.appDir as it's now stable
  output: 'standalone',
  // Handle TypeScript type checking
  typescript: {
    // Set to true to ignore TypeScript errors during build
    ignoreBuildErrors: false,
  },
  // Handle ESLint
  eslint: {
    // Set to true to ignore ESLint errors during build
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
