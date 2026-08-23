/**
 * @type {import('next').NextConfig}
 **/

const nextConfig = {
  output: process.env.UPSCAYL_TARGET === "web" ? undefined : "export",
  images: {
    unoptimized: true,
  },
  experimental: {
    externalDir: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = nextConfig;
