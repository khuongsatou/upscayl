import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { authenticateRequest, enforceRateLimit } from "./auth";
import { UpscaleApiError, sendApiError } from "./errors";
import {
  cancelJob,
  createJob,
  deleteJobResult,
  getOwnedJob,
  health,
  listJobs,
  models,
  sendJobResult,
  serializeJob,
} from "./service";
import { storeUpload } from "./storage";
import { readJsonBody, validateJobOptions } from "./validation";
import { ensureWorker } from "./worker";

const firstHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const routeParts = (req: NextApiRequest) => {
  const route = req.query.route;
  return (Array.isArray(route) ? route : route ? [route] : []).filter(Boolean);
};

const configureCors = (req: NextApiRequest, res: NextApiResponse) => {
  const origin = firstHeader(req.headers.origin);
  const allowed = (process.env.UPSCAYL_API_CORS_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (origin && allowed.includes(origin)) {
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
