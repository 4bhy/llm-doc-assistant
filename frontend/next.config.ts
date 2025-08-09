import type { NextConfig } from "next";

/**
 * Next.js configuration with API proxy, environment variables, and production optimizations
 */
const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Optimize production builds
  swcMinify: true,
  
  // Configure server-side environment variables
  serverRuntimeConfig: {
    // Private server-only variables
    NODE_ENV: process.env.NODE_ENV,
  },
  
  // Configure client-side environment variables (exposed to the browser)
  publicRuntimeConfig: {
    // Public variables accessible in browser
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },
  
  // API route proxy configuration for development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/:path*' || 'http://localhost:3001/api/:path*',
      },
    ];
  },
  
  // Image optimization configuration
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
