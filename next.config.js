/**
 * @type {import('next').NextConfig}
 **/

const isWebTarget = process.env.UPSCAYL_TARGET === "web";
const webBasePath = process.env.UPSCAYL_WEB_BASE_PATH || "";

const nextConfig = {
  output: isWebTarget ? undefined : "export",
  basePath: isWebTarget ? webBasePath : undefined,
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
