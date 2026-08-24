import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID, timingSafeEqual } from "crypto";
import { apiConfig } from "./config";
import { getDatabase } from "./database";
import { UpscaleApiError, sendApiError } from "./errors";
import { health, serializeJob } from "./service";
import type { JobRow, JobStatus } from "./types";

const firstHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const routeParts = (req: NextApiRequest) => {
  const route = req.query.route;
  return (Array.isArray(route) ? route : route ? [route] : []).filter(Boolean);
};

const suppliedServiceKey = (req: NextApiRequest) => {
  const direct = firstHeader(req.headers["x-service-key"]);
  if (direct) return direct.trim();
  const authorization = firstHeader(req.headers.authorization) || "";
  return authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || "";
};

const safeEqual = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
};

const authenticateService = (req: NextApiRequest) => {
  if (!apiConfig.bananaToUpscaleServiceKey) {
    throw new UpscaleApiError(
      503,
      "SERVICE_AUTH_NOT_CONFIGURED",
      "Internal API service authentication is not configured.",
    );
  }
  if (
    !safeEqual(
      suppliedServiceKey(req),
      apiConfig.bananaToUpscaleServiceKey,
    )
  ) {
    throw new UpscaleApiError(
      401,
      "UNAUTHORIZED",
      "Invalid service credential.",
    );
  }
};

const validStatuses = new Set<JobStatus>([
  "queued",
  "processing",
  "succeeded",
  "failed",
  "canceled",
  "expired",
]);

const listInternalJobs = (req: NextApiRequest) => {
  const database = getDatabase();
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const cursor = Number(req.query.cursor) || Date.now() + 1;
  const requestedStatus = firstHeader(req.query.status);
  const status = requestedStatus as JobStatus | undefined;
  if (status && !validStatuses.has(status)) {
    throw new UpscaleApiError(400, "INVALID_STATUS", "Invalid job status filter.");
  }
  const ownerId = String(firstHeader(req.query.ownerId) || "").trim();
  const filters = ["created_at<?"];
  const values: Array<string | number> = [cursor];
  if (status) {
    filters.push("status=?");
    values.push(status);
  }
  if (ownerId) {
    filters.push("owner_id=?");
    values.push(ownerId);
  }
  const jobs = database
    .prepare(
      `SELECT * FROM jobs WHERE ${filters.join(" AND ")} ORDER BY created_at DESC LIMIT ?`,
    )
    .all(...values, limit + 1) as JobRow[];
  const hasMore = jobs.length > limit;
  const page = jobs.slice(0, limit);
  return {
    data: page.map((job) => ({
      ...serializeJob(job),
      ownerId: job.owner_id,
    })),
    pagination: {
      limit,
      hasMore,
      nextCursor: hasMore ? page[page.length - 1].created_at : null,
    },
  };
};

const queueSnapshot = () => {
  const database = getDatabase();
  const rows = database
    .prepare(
      "SELECT * FROM jobs WHERE status IN ('queued','processing') ORDER BY CASE status WHEN 'processing' THEN 0 ELSE 1 END,created_at",
    )
    .all() as JobRow[];
  return {
    concurrency: 1,
    maxDepth: apiConfig.maxQueueDepth,
    queued: rows.filter((job) => job.status === "queued").length,
    processing: rows.filter((job) => job.status === "processing").length,
    jobs: rows.map((job) => ({
      ...serializeJob(job),
      ownerId: job.owner_id,
    })),
    timestamp: Date.now(),
  };
};

export const handleUpscaleInternalApiV1 = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  const requestId = firstHeader(req.headers["x-request-id"]) || randomUUID();
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  try {
    authenticateService(req);
    if (req.method !== "GET") {
      throw new UpscaleApiError(405, "METHOD_NOT_ALLOWED", "Only GET is supported.");
    }
    const parts = routeParts(req);
    if (parts.length === 1 && parts[0] === "health") {
      const runtime = await health();
      res.status(runtime.status === "ok" ? 200 : 503).json({
        ...runtime,
        integration: {
          bananaAuthConfigured: Boolean(apiConfig.bananaPlatformServiceKey),
          internalAuthConfigured: Boolean(
            apiConfig.bananaToUpscaleServiceKey,
          ),
        },
      });
      return;
    }
    if (parts.length === 1 && parts[0] === "queue") {
      res.status(200).json(queueSnapshot());
      return;
    }
    if (parts.length === 1 && parts[0] === "jobs") {
      res.status(200).json(listInternalJobs(req));
      return;
    }
    throw new UpscaleApiError(
      404,
      "ENDPOINT_NOT_FOUND",
      "Internal API endpoint was not found.",
    );
  } catch (error) {
    sendApiError(res, requestId, error);
  }
};
