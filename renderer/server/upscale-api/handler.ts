import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import {
  authenticateRequest,
  enforceRateLimit,
  isAllowedLocalMacBridgeOrigin,
} from "./auth";
import { apiConfig } from "./config";
import { UpscaleApiError, sendApiError } from "./errors";
import {
  cancelJob,
  cancelQueueJobs,
  createQueueJobs,
  createJob,
  deleteJobResult,
  getOwnedJob,
  health,
  listJobs,
  listQueueJobs,
  models,
  queueSummary,
  retryQueueJob,
  sendJobResult,
  serializeJob,
} from "./service";
import { storeUpload } from "./storage";
import {
  parseJobIdList,
  readJsonBody,
  validateJobOptions,
  validateQueueCreateOptions,
} from "./validation";
import { ensureWorker } from "./worker";
import { agentManifest, agentWorkflow } from "./agent-support";

const firstHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const routeParts = (req: NextApiRequest) => {
  const route = req.query.route;
  return (Array.isArray(route) ? route : route ? [route] : []).filter(Boolean);
};

const configureCors = (req: NextApiRequest, res: NextApiResponse) => {
  const origin = firstHeader(req.headers.origin);
  if (
    origin &&
    (apiConfig.corsOrigins.includes(origin) ||
      isAllowedLocalMacBridgeOrigin(req))
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type,X-API-Key,Idempotency-Key",
    );
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  }
};

export const handleUpscaleApiV1 = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  const requestId = firstHeader(req.headers["x-request-id"]) || randomUUID();
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  configureCors(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  ensureWorker();
  const parts = routeParts(req);
  try {
    if (req.method === "GET" && parts.length === 1 && parts[0] === "health") {
      const data = await health();
      res.status(data.status === "ok" ? 200 : 503).json(data);
      return;
    }
    if (req.method === "GET" && parts.length === 1 && parts[0] === "models") {
      res.status(200).json(models());
      return;
    }
    if (
      req.method === "GET" &&
      parts.length === 2 &&
      parts[0] === "agent" &&
      parts[1] === "manifest"
    ) {
      res.status(200).json(agentManifest(req));
      return;
    }
    if (
      req.method === "GET" &&
      parts.length === 2 &&
      parts[0] === "agent" &&
      parts[1] === "workflow"
    ) {
      res.status(200).json(agentWorkflow(req));
      return;
    }
    if (
      parts[0] === "queue" &&
      parts.length === 2 &&
      parts[1] === "summary" &&
      req.method === "GET"
    ) {
      const principal = await authenticateRequest(req, "read");
      enforceRateLimit(principal, "read");
      res.status(200).json(queueSummary(principal));
      return;
    }
    if (
      parts[0] === "queue" &&
      parts.length === 2 &&
      parts[1] === "jobs" &&
      req.method === "GET"
    ) {
      const principal = await authenticateRequest(req, "read");
      enforceRateLimit(principal, "read");
      res.status(200).json(
        listQueueJobs(principal, {
          q: req.query.q,
          status: req.query.status,
          page: req.query.page,
          limit: req.query.limit,
        }),
      );
      return;
    }
    if (
      parts[0] === "queue" &&
      parts.length === 2 &&
      parts[1] === "jobs" &&
      req.method === "POST"
    ) {
      const principal = await authenticateRequest(req, "write");
      enforceRateLimit(principal, "create");
      const result = await createQueueJobs(
        principal,
        validateQueueCreateOptions(await readJsonBody(req)),
        firstHeader(req.headers["idempotency-key"]),
      );
      res.setHeader("Idempotency-Replayed", result.replayed ? "true" : "false");
      res.status(result.replayed ? 200 : 202).json(result);
      return;
    }
    if (
      parts[0] === "queue" &&
      parts.length === 3 &&
      parts[1] === "jobs" &&
      parts[2] === "cancel" &&
      req.method === "POST"
    ) {
      const principal = await authenticateRequest(req, "write");
      enforceRateLimit(principal, "delete");
      res
        .status(200)
        .json(cancelQueueJobs(principal, parseJobIdList(await readJsonBody(req))));
      return;
    }
    if (
      parts[0] === "queue" &&
      parts.length === 4 &&
      parts[1] === "jobs" &&
      parts[3] === "retry" &&
      req.method === "POST"
    ) {
      const principal = await authenticateRequest(req, "write");
      enforceRateLimit(principal, "create");
      const result = await retryQueueJob(
        principal,
        parts[2],
        firstHeader(req.headers["idempotency-key"]),
      );
      res.setHeader("Idempotency-Replayed", result.replayed ? "true" : "false");
      res.status(result.replayed ? 200 : 202).json(result);
      return;
    }
    if (req.method === "POST" && parts.length === 1 && parts[0] === "uploads") {
      const principal = await authenticateRequest(req, "write");
      enforceRateLimit(principal, "upload");
      const upload = await storeUpload(req, principal);
      res.status(201).json({
        id: upload.id,
        fileName: upload.original_name,
        mimeType: upload.mime_type,
        size: upload.size,
        expiresAt: upload.expires_at,
      });
      return;
    }
    if (parts[0] === "jobs" && parts.length === 1 && req.method === "POST") {
      const principal = await authenticateRequest(req, "write");
      enforceRateLimit(principal, "create");
      const options = validateJobOptions(await readJsonBody(req));
      const result = await createJob(
        principal,
        options,
        firstHeader(req.headers["idempotency-key"]),
      );
      res.setHeader("Idempotency-Replayed", result.replayed ? "true" : "false");
      res.status(result.replayed ? 200 : 202).json(serializeJob(result.job));
      return;
    }
    if (parts[0] === "jobs" && parts.length === 1 && req.method === "GET") {
      const principal = await authenticateRequest(req, "read");
      enforceRateLimit(principal, "read");
      res
        .status(200)
        .json(
          listJobs(
            principal,
            req.query.limit,
            req.query.cursor,
            req.query.status,
          ),
        );
      return;
    }
    if (parts[0] === "jobs" && parts.length === 2 && req.method === "GET") {
      const principal = await authenticateRequest(req, "read");
      enforceRateLimit(principal, "read");
      res.status(200).json(serializeJob(getOwnedJob(principal, parts[1])));
      return;
    }
    if (parts[0] === "jobs" && parts.length === 2 && req.method === "DELETE") {
      const principal = await authenticateRequest(req, "write");
      enforceRateLimit(principal, "delete");
      res.status(200).json(serializeJob(cancelJob(principal, parts[1])));
      return;
    }
    if (
      parts[0] === "jobs" &&
      parts.length === 3 &&
      parts[2] === "result" &&
      req.method === "GET"
    ) {
      const principal = await authenticateRequest(req, "read");
      enforceRateLimit(principal, "read");
      await sendJobResult(principal, parts[1], res);
      return;
    }
    if (
      parts[0] === "jobs" &&
      parts.length === 3 &&
      parts[2] === "result" &&
      req.method === "DELETE"
    ) {
      const principal = await authenticateRequest(req, "write");
      enforceRateLimit(principal, "delete");
      await deleteJobResult(principal, parts[1]);
      res.status(204).end();
      return;
    }
    throw new UpscaleApiError(
      404,
      "ENDPOINT_NOT_FOUND",
      "API endpoint was not found.",
    );
  } catch (error) {
    sendApiError(res, requestId, error);
  }
};
