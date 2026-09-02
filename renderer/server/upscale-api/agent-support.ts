import type { NextApiRequest } from "next";
import { models } from "./service";

const firstHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const requestBaseUrl = (req: NextApiRequest) => {
  const configured = String(process.env.UPSCAYL_API_PUBLIC_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");
  if (configured) return configured;
  const host = firstHeader(req.headers["x-forwarded-host"]) || req.headers.host;
  const protocol = firstHeader(req.headers["x-forwarded-proto"]) || "https";
  const basePath = process.env.UPSCAYL_WEB_BASE_PATH || "";
  return host ? `${protocol}://${host}${basePath}/api/v1` : `${basePath}/api/v1`;
};

const endpoints = Object.freeze({
  health: { method: "GET", path: "/health", auth: false },
  models: { method: "GET", path: "/models", auth: false },
  upload: { method: "POST", path: "/uploads", auth: true },
  createJob: { method: "POST", path: "/jobs", auth: true },
  listJobs: { method: "GET", path: "/jobs", auth: true },
  getJob: { method: "GET", path: "/jobs/{jobId}", auth: true },
  cancelJob: { method: "DELETE", path: "/jobs/{jobId}", auth: true },
  downloadResult: { method: "GET", path: "/jobs/{jobId}/result", auth: true },
  deleteResult: { method: "DELETE", path: "/jobs/{jobId}/result", auth: true },
  queueSummary: { method: "GET", path: "/queue/summary", auth: true },
  listQueueJobs: { method: "GET", path: "/queue/jobs", auth: true },
  createQueueJobs: { method: "POST", path: "/queue/jobs", auth: true },
  cancelQueueJobs: { method: "POST", path: "/queue/jobs/cancel", auth: true },
  retryQueueJob: {
    method: "POST",
    path: "/queue/jobs/{jobId}/retry",
    auth: true,
  },
  agentManifest: { method: "GET", path: "/agent/manifest", auth: false },
  agentWorkflow: { method: "GET", path: "/agent/workflow", auth: false },
});

const terminalStatuses = Object.freeze([
  "succeeded",
  "failed",
  "canceled",
  "expired",
]);

export const agentManifest = (req: NextApiRequest) => {
  const catalog = models();
  return {
    service: "mtips5s-upscale",
    apiVersion: "v1",
    contractVersion: "2026-08-24.agent.1",
    baseUrl: requestBaseUrl(req),
    auth: {
      header: "X-API-Key",
      acceptedKeyPrefixes: ["bbmcp_", "up_"],
      preferredKeyPrefix: "bbmcp_",
      note: "Agents must never persist, print, or expose raw API keys.",
    },
    endpoints,
    mcp: {
      recommendedEndpoint: "https://bb.1nutnhan.com/mcp",
      transport: "streamable-http",
      tools: [
        "upscale_health",
        "upscale_list_models",
        "upscale_upload",
        "upscale_create_job",
        "upscale_get_job",
        "upscale_cancel_job",
        "upscale_download_result",
        "upscale_delete_result",
        "upscale_queue_summary",
        "upscale_queue_list",
        "upscale_queue_create",
        "upscale_queue_cancel",
        "upscale_queue_retry",
      ],
    },
    models: catalog.data,
    limits: catalog.limits,
    statuses: {
      terminal: terminalStatuses,
      retryableHttp: [408, 409, 425, 429, 500, 502, 503, 504],
      failClosedAuth: true,
    },
    documentation: {
      agentReadme: "docs/upscale-agent-api-readme.md",
      openapi: "docs/upscale-api-v1.openapi.yaml",
      humanReadme: "docs/upscale-api-v1.md",
    },
  };
};

export const agentWorkflow = (req: NextApiRequest) => ({
  service: "mtips5s-upscale",
  apiVersion: "v1",
  baseUrl: requestBaseUrl(req),
  workflow: [
    {
      step: "discover",
      request: endpoints.agentManifest,
      purpose: "Read contract, limits, model IDs, terminal statuses, and MCP tool names.",
    },
    {
      step: "preflight",
      requests: [endpoints.health, endpoints.models],
      purpose: "Check runtime readiness and output limits before uploading.",
    },
    {
      step: "upload",
      request: endpoints.upload,
      contentType: "multipart/form-data",
      purpose: "Upload one PNG, JPEG, or WEBP and store the returned upload id.",
    },
    {
      step: "create_job",
      request: endpoints.createJob,
      contentType: "application/json",
      headers: ["Idempotency-Key"],
      purpose: "Create an async server-side job from upload ids.",
    },
    {
      step: "create_queue_jobs",
      request: endpoints.createQueueJobs,
      contentType: "application/json",
      headers: ["Idempotency-Key"],
      optional: true,
      purpose:
        "Create one single-image job per upload id for Queue-style per-image progress.",
    },
    {
      step: "inspect_queue",
      requests: [endpoints.queueSummary, endpoints.listQueueJobs],
      optional: true,
      purpose:
        "Read Queue counts and paginated/searchable/filterable job rows without touching storage directly.",
    },
    {
      step: "poll",
      request: endpoints.getJob,
      intervalMs: 1000,
      backoffAfterSeconds: 60,
      stopWhenStatusIn: terminalStatuses,
      purpose: "Poll progress, ETA, queue position, result metadata, and errors.",
    },
    {
      step: "download",
      request: endpoints.downloadResult,
      when: "job.status == 'succeeded' && job.result != null",
      purpose: "Download the binary image or ZIP result through the API.",
    },
    {
      step: "cancel",
      request: endpoints.cancelJob,
      when: "user explicitly asks to stop a queued or processing job",
      purpose: "Cancellation is explicit; closing a client must not cancel jobs.",
    },
  ],
  rules: [
    "Use the API or Banana MCP tools only; do not read Upscale SQLite, runtime folders, Docker volumes, or source modules.",
    "Treat job IDs and upload IDs as opaque strings.",
    "Use an Idempotency-Key for create_job retries.",
    "After create_job succeeds, keep polling even if the original upload/create connection closes.",
    "Never retry invalid auth, forbidden ownership, unsupported image type, or output pixel limit errors without changing inputs.",
  ],
});
