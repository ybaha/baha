// next.config.js
const { withContentlayer } = require("next-contentlayer2");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { mdxRs: false },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "49.13.116.247",
      },
      {
        protocol: "https",
        hostname: "poshet.nl",
      },
    ],
  },
};

module.exports = withContentlayer(nextConfig);
