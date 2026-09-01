#!/usr/bin/env node

const baseUrl = (
  process.env.UPSCAYL_STATUS_BASE_URL ||
  "https://bb.1nutnhan.com/upscale/api/v1"
).replace(/\/+$/, "");
const legacyUrl =
  process.env.UPSCAYL_STATUS_LEGACY_URL ||
  "https://veo3.1nutnhan.com/upscale";
const appUrl =
  process.env.UPSCAYL_STATUS_APP_URL ||
  baseUrl.replace(/\/api\/v1$/i, "");

const readJson = async (url) => {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const body = await response.text();
  let data = null;
  try {
    data = body ? JSON.parse(body) : null;
  } catch {
    throw new Error(`${url} returned non-JSON HTTP ${response.status}`);
  }
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}: ${body}`);
  }
  return data;
};

const checkLegacyRedirect = async () => {
  const response = await fetch(legacyUrl, { method: "HEAD", redirect: "manual" });
  return {
    url: legacyUrl,
    status: response.status,
    location: response.headers.get("location"),
  };
};

const checkPageAssets = async () => {
  const response = await fetch(appUrl, { headers: { Accept: "text/html" } });
  const html = await response.text();
  if (!response.ok) {
    throw new Error(`${appUrl} returned HTTP ${response.status}`);
  }
  const appPath = new URL(appUrl).pathname.replace(/\/+$/, "");
  const expectedPrefix = `${appPath}/_next/`;
  const hasExpectedAssets = html.includes(expectedPrefix);
  const hasRootNextAssets = /(?:src|href)="\/_next\//.test(html);
  return {
    url: appUrl,
    status: response.status,
    hasExpectedAssets,
    hasRootNextAssets,
    expectedPrefix,
  };
};

(async () => {
  const [health, models, legacyRedirect, pageAssets] = await Promise.all([
    readJson(`${baseUrl}/health`),
    readJson(`${baseUrl}/models`),
    checkLegacyRedirect().catch((error) => ({
      url: legacyUrl,
      error: error.message,
    })),
    checkPageAssets(),
  ]);
  const limits = models.limits || {};
  const summary = {
    checkedAt: new Date().toISOString(),
    baseUrl,
    status: health.status,
    database: health.database,
    worker: health.worker,
    runtime: health.runtime,
    storage: health.storage,
    limits,
    pageAssets,
    legacyRedirect,
  };
  console.log(JSON.stringify(summary, null, 2));

  if (health.status !== "ok") {
    throw new Error(`Health status is ${health.status}`);
  }
  if (!health.runtime?.binary || !health.runtime?.models) {
    throw new Error("Runtime binary/models are not ready.");
  }
  if (!pageAssets.hasExpectedAssets || pageAssets.hasRootNextAssets) {
    throw new Error(
      `Page assets are not built for ${pageAssets.expectedPrefix}.`,
    );
  }
  if (health.worker?.queued || health.worker?.processing) {
    console.error("Upscale worker is not idle.");
    process.exitCode = 2;
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
