// next.config.js
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,
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

module.exports = nextConfig;
