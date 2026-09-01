const {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} = require("next/constants");

/**
 * @param {string} phase
 * @returns {import('next').NextConfig}
 **/
const createNextConfig = (phase) => {
  const isWebTarget = process.env.UPSCAYL_TARGET === "web";
  const webBasePath = process.env.UPSCAYL_WEB_BASE_PATH || "";
  const webDistDir =
    phase === PHASE_DEVELOPMENT_SERVER ? ".next-web-dev" : ".next-web";

  const nextConfig = {
    output: isWebTarget ? undefined : "export",
    basePath: isWebTarget ? webBasePath : undefined,
    distDir:
      isWebTarget &&
      (phase === PHASE_DEVELOPMENT_SERVER ||
        phase === PHASE_PRODUCTION_BUILD ||
        phase === PHASE_PRODUCTION_SERVER)
        ? webDistDir
        : undefined,
    env: {
      NEXT_PUBLIC_UPSCAYL_WEB_BASE_PATH: isWebTarget ? webBasePath : "",
    },
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

  return nextConfig;
};

module.exports = createNextConfig;
