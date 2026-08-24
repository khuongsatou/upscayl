import { tmpdir } from "os";
import { resolve } from "path";

const numberFromEnv = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const apiConfig = {
  dataDir: resolve(
    process.env.UPSCAYL_API_DATA_DIR ||
      resolve(tmpdir(), "mtips5s-upscale-api-v1"),
  ),
  maxFileBytes: numberFromEnv("UPSCAYL_API_MAX_FILE_BYTES", 25 * 1024 * 1024),
  maxBatchFiles: numberFromEnv("UPSCAYL_API_MAX_BATCH_FILES", 10),
  maxQueueDepth: numberFromEnv("UPSCAYL_API_MAX_QUEUE_DEPTH", 20),
  maxOutputPixels: numberFromEnv("UPSCAYL_API_MAX_OUTPUT_PIXELS", 50_000_000),
  uploadTtlMs: numberFromEnv("UPSCAYL_API_UPLOAD_TTL_MS", 60 * 60 * 1000),
  resultTtlMs: numberFromEnv("UPSCAYL_API_RESULT_TTL_MS", 24 * 60 * 60 * 1000),
  jobTimeoutMs: numberFromEnv("UPSCAYL_API_JOB_TIMEOUT_MS", 60 * 60 * 1000),
  estimatedMsPerMegapixel: numberFromEnv(
    "UPSCAYL_API_ESTIMATED_MS_PER_MEGAPIXEL",
    160_000,
  ),
  cleanupIntervalMs: numberFromEnv(
    "UPSCAYL_API_CLEANUP_INTERVAL_MS",
    5 * 60 * 1000,
  ),
  anonymousRateLimitPerHour: numberFromEnv(
    "UPSCAYL_API_ANONYMOUS_RATE_LIMIT",
    5000,
  ),
  allowAnonymousWeb:
    process.env.UPSCAYL_API_ALLOW_ANONYMOUS_WEB === "true" ||
    process.env.NODE_ENV !== "production",
  bananaPlatformApiBaseUrl: (
    process.env.BANANA_PLATFORM_API_BASE_URL ||
    "http://127.0.0.1:8110/api/platform/v1"
  ).replace(/\/+$/, ""),
  bananaPlatformServiceKey:
    process.env.UPSCALE_TO_BANANA_SERVICE_KEY || "",
  bananaAuthTimeoutMs: numberFromEnv("BANANA_AUTH_TIMEOUT_MS", 3000),
  bananaAuthCacheTtlMs: numberFromEnv("BANANA_AUTH_CACHE_TTL_MS", 10_000),
  bananaAuthNegativeCacheTtlMs: numberFromEnv(
    "BANANA_AUTH_NEGATIVE_CACHE_TTL_MS",
    2_000,
  ),
  bananaToUpscaleServiceKey:
    process.env.BANANA_TO_UPSCALE_SERVICE_KEY || "",
};

export const getServerPlatform = () => {
  if (process.platform === "darwin") return "mac";
  if (process.platform === "win32") return "win";
  return "linux";
};

export const getUpscaylBinaryPath = () => {
  const binary =
    process.platform === "win32" ? "upscayl-bin.exe" : "upscayl-bin";
  return resolve(
    process.cwd(),
    "resources",
    getServerPlatform(),
    "bin",
    binary,
  );
};

export const getModelsPath = () =>
  resolve(process.cwd(), "resources", "models");
