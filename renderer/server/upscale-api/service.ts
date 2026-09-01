import type { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { MODELS } from "@common/models-list";
import { apiConfig, getModelsPath, getUpscaylBinaryPath } from "./config";
import { getDatabase } from "./database";
import { UpscaleApiError } from "./errors";
import { readImageDimensions } from "./image-info";
import { safeDownloadName, streamFile } from "./storage";
import type {
  ApiPrincipal,
  JobOptions,
  JobRow,
  JobStatus,
  UploadRow,
} from "./types";
import { requestWorkerCancellation, scheduleWorker } from "./worker";
import { reserveBananaQuota } from "./banana-client";
import { getSoftwareVulkanInfo } from "./runtime-env";
import {
  enqueueJobLifecycle,
  enqueueQuotaRelease,
} from "./outbox";
import { parsePageLimit, parseQueueStatuses } from "./validation";

const publicApiBase = () => `${process.env.UPSCAYL_WEB_BASE_PATH || ""}/api/v1`;

const terminalStatuses = new Set([
  "succeeded",
  "failed",
  "canceled",
  "expired",
]);

export const serializeJob = (job: JobRow) => {
  const database = getDatabase();
  const queuePosition =
    job.status === "queued"
      ? Number(
          (
            database
              .prepare(
                "SELECT COUNT(*) AS count FROM jobs WHERE status='queued' AND created_at<=?",
              )
              .get(job.created_at) as { count: number }
          ).count,
        )
      : null;
  const remainingMs = job.estimated_completion_at
    ? job.estimated_completion_at - Date.now()
    : null;
  const estimatedRemainingSeconds =
    job.status === "succeeded"
      ? 0
      : remainingMs && remainingMs > 0
        ? Math.ceil(remainingMs / 1000)
        : null;
  return {
    id: job.id,
    mode: job.mode,
    model: job.model,
    scale: job.scale,
    outputFormat: job.output_format,
    status: job.status,
    progress: Number(job.progress.toFixed(2)),
    estimatedRemainingSeconds,
    queuePosition,
    inputCount: job.input_count,
    result:
      job.status === "succeeded"
        ? {
            url: `${publicApiBase()}/jobs/${job.id}/result`,
            fileName: job.output_name,
            mimeType: job.output_mime,
            size: job.output_size,
            expiresAt: job.expires_at,
          }
        : null,
    error: job.error_code
      ? { code: job.error_code, message: job.error_message }
      : null,
    createdAt: job.created_at,
    startedAt: job.started_at,
    updatedAt: job.updated_at,
    completedAt: job.completed_at,
    expiresAt: job.expires_at,
  };
};

type QueueJobRow = JobRow & { input_names?: string | null };

const serializeQueueJob = (job: QueueJobRow) => ({
  ...serializeJob(job),
  inputFileNames: job.input_names
    ? job.input_names.split("\n").filter(Boolean)
    : [],
});

const assertOutputBudget = async (
  options: JobOptions,
  uploads: UploadRow[],
) => {
  for (const upload of uploads) {
    const dimensions = await readImageDimensions(upload.storage_path);
    const factor =
      options.mode === "double" ? options.scale ** 2 : options.scale;
    const width = options.customWidth || dimensions.width * factor;
    const height = options.customWidth
      ? Math.round((options.customWidth * dimensions.height) / dimensions.width)
      : dimensions.height * factor;
    if (width * height > apiConfig.maxOutputPixels) {
      throw new UpscaleApiError(
        400,
        "OUTPUT_PIXEL_LIMIT_EXCEEDED",
        `Predicted output ${width}x${height} exceeds the ${apiConfig.maxOutputPixels} pixel limit.`,
      );
    }
    if (
      options.mode === "double" &&
      options.customWidth &&
      dimensions.width * options.scale * dimensions.height * options.scale >
        apiConfig.maxOutputPixels
    ) {
      throw new UpscaleApiError(
        400,
        "INTERMEDIATE_PIXEL_LIMIT_EXCEEDED",
        "The first pass of this double job exceeds the output pixel limit.",
      );
    }
  }
};

export const createJob = async (
  principal: ApiPrincipal,
  options: JobOptions,
  idempotencyKey?: string,
) => {
  const database = getDatabase();
  const normalizedIdempotency = idempotencyKey?.trim() || null;
  if (normalizedIdempotency && normalizedIdempotency.length > 128) {
    throw new UpscaleApiError(
      400,
      "INVALID_IDEMPOTENCY_KEY",
      "Idempotency-Key must be at most 128 characters.",
    );
  }
  if (normalizedIdempotency) {
    const existing = database
      .prepare("SELECT * FROM jobs WHERE owner_id=? AND idempotency_key=?")
      .get(principal.id, normalizedIdempotency) as JobRow | undefined;
    if (existing) return { job: existing, replayed: true };
  }
  const placeholders = options.uploadIds.map(() => "?").join(",");
  const uploads = database
    .prepare(
      `SELECT * FROM uploads WHERE owner_id=? AND id IN (${placeholders}) AND expires_at>?`,
    )
    .all(principal.id, ...options.uploadIds, Date.now()) as UploadRow[];
  if (uploads.length !== options.uploadIds.length) {
    throw new UpscaleApiError(
      404,
      "UPLOAD_NOT_FOUND",
      "One or more uploads do not exist, expired, or belong to another principal.",
    );
  }
  const orderedUploads = options.uploadIds.map(
    (id) => uploads.find((upload) => upload.id === id)!,
  );
  await assertOutputBudget(options, orderedUploads);
  const id = randomUUID();
  const now = Date.now();
  let quotaReservationId: string | null = null;
  if (principal.kind === "banana_api_key") {
    const quota = await reserveBananaQuota({
      principalId: principal.id,
      idempotencyKey: `upscale-job:${id}`,
      units: orderedUploads.length,
      metadata: {
        jobId: id,
        mode: options.mode,
        model: options.model,
        scale: options.scale,
      },
    });
    quotaReservationId = quota.reservation.id;
  }
  database.exec("BEGIN IMMEDIATE");
  try {
    const activeCount = (
      database
        .prepare(
          "SELECT COUNT(*) AS count FROM jobs WHERE status IN ('queued','processing')",
        )
        .get() as { count: number }
    ).count;
    if (activeCount >= apiConfig.maxQueueDepth) {
      throw new UpscaleApiError(
        429,
        "QUEUE_FULL",
        "Upscale queue is full. Try again later.",
        { maxQueueDepth: apiConfig.maxQueueDepth },
      );
    }
    database
      .prepare(
        `INSERT INTO jobs(id,owner_id,idempotency_key,mode,model,scale,output_format,compression,custom_width,
         tile_size,tta,status,progress,input_count,cancel_requested,created_at,updated_at,expires_at,
         quota_reservation_id,usage_units)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,'queued',0,?,0,?,?,?,?,?)`,
      )
      .run(
        id,
        principal.id,
        normalizedIdempotency,
        options.mode,
        options.model,
        options.scale,
        options.outputFormat,
        options.compression,
        options.customWidth,
        options.tileSize,
        options.tta ? 1 : 0,
        orderedUploads.length,
        now,
        now,
        now + apiConfig.resultTtlMs,
        quotaReservationId,
        orderedUploads.length,
      );
    orderedUploads.forEach((upload, index) => {
      database
        .prepare(
          "INSERT INTO job_uploads(job_id,upload_id,position) VALUES(?,?,?)",
        )
        .run(id, upload.id, index);
      database
        .prepare("UPDATE uploads SET consumed=1 WHERE id=?")
        .run(upload.id);
    });
    database
      .prepare(
        "INSERT INTO job_events(job_id,event_type,payload_json,created_at) VALUES(?,'queued',NULL,?)",
      )
      .run(id, now);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    if (quotaReservationId) {
      enqueueQuotaRelease(quotaReservationId, {
        jobId: id,
        reason: "job_create_failed",
      });
    }
    if ((error as Error).message.includes("UNIQUE constraint failed")) {
      const existing = database
        .prepare("SELECT * FROM jobs WHERE owner_id=? AND idempotency_key=?")
        .get(principal.id, normalizedIdempotency) as JobRow | undefined;
      if (existing) return { job: existing, replayed: true };
    }
    throw error;
  }
  enqueueJobLifecycle(id, "queued");
  scheduleWorker();
  return {
    job: database.prepare("SELECT * FROM jobs WHERE id=?").get(id) as JobRow,
    replayed: false,
  };
};

export const getOwnedJob = (principal: ApiPrincipal, id: string) => {
  const job = getDatabase()
    .prepare("SELECT * FROM jobs WHERE id=? AND owner_id=?")
    .get(id, principal.id) as JobRow | undefined;
  if (!job)
    throw new UpscaleApiError(404, "JOB_NOT_FOUND", "Job was not found.");
  return job;
};

export const listJobs = (
  principal: ApiPrincipal,
  limitValue: unknown,
  cursorValue: unknown,
  statusValue: unknown,
) => {
  const database = getDatabase();
  const limit = Math.min(100, Math.max(1, Number(limitValue) || 20));
  const cursor = Number(cursorValue) || Date.now() + 1;
  const status = typeof statusValue === "string" ? statusValue : null;
  if (
    status &&
    ![
      "queued",
      "processing",
      "succeeded",
      "failed",
      "canceled",
      "expired",
    ].includes(status)
  ) {
    throw new UpscaleApiError(
      400,
      "INVALID_STATUS",
      "Invalid job status filter.",
    );
  }
  const jobs = database
    .prepare(
      `SELECT * FROM jobs WHERE owner_id=? AND created_at<? ${status ? "AND status=?" : ""}
       ORDER BY created_at DESC LIMIT ?`,
    )
    .all(
      ...(status
        ? [principal.id, cursor, status, limit + 1]
        : [principal.id, cursor, limit + 1]),
    ) as JobRow[];
  const hasMore = jobs.length > limit;
  const page = jobs.slice(0, limit);
  return {
    data: page.map(serializeJob),
    pagination: {
      limit,
      hasMore,
      nextCursor: hasMore ? page[page.length - 1].created_at : null,
    },
  };
};

export const listQueueJobs = (
  principal: ApiPrincipal,
  query: {
    q?: unknown;
    status?: unknown;
    page?: unknown;
    limit?: unknown;
  },
) => {
  const database = getDatabase();
  const { page, limit, offset } = parsePageLimit(query.page, query.limit);
  const statuses = parseQueueStatuses(query.status);
  const search = typeof query.q === "string" ? query.q.trim() : "";
  if (search.length > 128) {
    throw new UpscaleApiError(
      400,
      "INVALID_SEARCH",
      "Queue search must be at most 128 characters.",
    );
  }

  const where = ["j.owner_id=?"];
  const params: unknown[] = [principal.id];
  if (statuses?.length) {
    where.push(`j.status IN (${statuses.map(() => "?").join(",")})`);
    params.push(...statuses);
  }
  if (search) {
    const like = `%${search}%`;
    where.push(
      "(j.id LIKE ? OR j.model LIKE ? OR j.output_name LIKE ? OR u.original_name LIKE ?)",
    );
    params.push(like, like, like, like);
  }
  const whereSql = where.join(" AND ");
  const total = (
    database
      .prepare(
        `SELECT COUNT(DISTINCT j.id) AS count
         FROM jobs j
         LEFT JOIN job_uploads ju ON ju.job_id=j.id
         LEFT JOIN uploads u ON u.id=ju.upload_id
         WHERE ${whereSql}`,
      )
      .get(...params) as { count: number }
  ).count;
  const rows = database
    .prepare(
      `SELECT j.*, GROUP_CONCAT(u.original_name, '\n') AS input_names
       FROM jobs j
       LEFT JOIN job_uploads ju ON ju.job_id=j.id
       LEFT JOIN uploads u ON u.id=ju.upload_id
       WHERE ${whereSql}
       GROUP BY j.id
       ORDER BY j.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as QueueJobRow[];
  return {
    data: rows.map(serializeQueueJob),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: offset + rows.length < total,
    },
  };
};

export const queueSummary = (principal: ApiPrincipal) => {
  const rows = getDatabase()
    .prepare(
      "SELECT status, COUNT(*) AS count FROM jobs WHERE owner_id=? GROUP BY status",
    )
    .all(principal.id) as Array<{ status: JobStatus; count: number }>;
  const statuses: Record<JobStatus, number> = {
    queued: 0,
    processing: 0,
    succeeded: 0,
    failed: 0,
    canceled: 0,
    expired: 0,
  };
  rows.forEach((row) => {
    statuses[row.status] = row.count;
  });
  return {
    total: Object.values(statuses).reduce((sum, count) => sum + count, 0),
    active: statuses.queued + statuses.processing,
    statuses,
  };
};

export const createQueueJobs = async (
  principal: ApiPrincipal,
  options: JobOptions,
  idempotencyKey?: string,
) => {
  const normalizedIdempotency = idempotencyKey?.trim() || "";
  const placeholders = options.uploadIds.map(() => "?").join(",");
  const uploads = getDatabase()
    .prepare(
      `SELECT * FROM uploads WHERE owner_id=? AND id IN (${placeholders}) AND expires_at>?`,
    )
    .all(principal.id, ...options.uploadIds, Date.now()) as UploadRow[];
  if (uploads.length !== options.uploadIds.length) {
    throw new UpscaleApiError(
      404,
      "UPLOAD_NOT_FOUND",
      "One or more uploads do not exist, expired, or belong to another principal.",
    );
  }
  const orderedUploads = options.uploadIds.map(
    (id) => uploads.find((upload) => upload.id === id)!,
  );
  await assertOutputBudget(
    { ...options, mode: "single" },
    orderedUploads,
  );
  const activeCount = (
    getDatabase()
      .prepare(
        "SELECT COUNT(*) AS count FROM jobs WHERE status IN ('queued','processing')",
      )
      .get() as { count: number }
  ).count;
  if (activeCount + options.uploadIds.length > apiConfig.maxQueueDepth) {
    throw new UpscaleApiError(
      429,
      "QUEUE_FULL",
      "Upscale queue does not have enough free slots for this batch.",
      {
        maxQueueDepth: apiConfig.maxQueueDepth,
        activeCount,
        requested: options.uploadIds.length,
      },
    );
  }
  const jobs = [];
  for (let index = 0; index < options.uploadIds.length; index += 1) {
    const uploadId = options.uploadIds[index];
    const result = await createJob(
      principal,
      { ...options, mode: "single", uploadIds: [uploadId] },
      normalizedIdempotency
        ? `${normalizedIdempotency}:queue:${index}`
        : undefined,
    );
    jobs.push(result);
  }
  return {
    data: jobs.map((item) => serializeJob(item.job)),
    replayed: jobs.every((item) => item.replayed),
  };
};

export const cancelQueueJobs = (
  principal: ApiPrincipal,
  jobIds: string[],
) => ({
  data: jobIds.map((jobId) => serializeJob(cancelJob(principal, jobId))),
});

export const retryQueueJob = async (
  principal: ApiPrincipal,
  id: string,
  idempotencyKey?: string,
) => {
  const job = getOwnedJob(principal, id);
  if (!terminalStatuses.has(job.status)) {
    throw new UpscaleApiError(
      409,
      "JOB_NOT_TERMINAL",
      "Only terminal jobs can be retried.",
    );
  }
  const uploads = getDatabase()
    .prepare(
      `SELECT u.*
       FROM job_uploads ju
       JOIN uploads u ON u.id=ju.upload_id
       WHERE ju.job_id=?
       ORDER BY ju.position ASC`,
    )
    .all(id) as UploadRow[];
  if (!uploads.length) {
    throw new UpscaleApiError(
      404,
      "UPLOAD_NOT_FOUND",
      "The original upload for this queue job was not found.",
    );
  }
  const result = await createJob(
    principal,
    {
      mode: job.mode,
      uploadIds: uploads.map((upload) => upload.id),
      model: job.model,
      scale: job.scale,
      outputFormat: job.output_format,
      compression: job.compression,
      customWidth: job.custom_width,
      tileSize: job.tile_size,
      tta: Boolean(job.tta),
    },
    idempotencyKey,
  );
  return {
    job: serializeJob(result.job),
    replayed: result.replayed,
    retriedFrom: id,
  };
};

export const cancelJob = (principal: ApiPrincipal, id: string) => {
  const database = getDatabase();
  const job = getOwnedJob(principal, id);
  if (terminalStatuses.has(job.status)) return job;
  const now = Date.now();
  if (job.status === "queued") {
    database
      .prepare(
        "UPDATE jobs SET status='canceled',cancel_requested=1,error_code='JOB_CANCELED',error_message='Job was canceled.',completed_at=?,updated_at=? WHERE id=?",
      )
      .run(now, now, id);
    enqueueJobLifecycle(id, "canceled");
  } else {
    database
      .prepare("UPDATE jobs SET cancel_requested=1,updated_at=? WHERE id=?")
      .run(now, id);
    requestWorkerCancellation(id);
  }
  return database.prepare("SELECT * FROM jobs WHERE id=?").get(id) as JobRow;
};

export const deleteJobResult = async (principal: ApiPrincipal, id: string) => {
  const database = getDatabase();
  const job = getOwnedJob(principal, id);
  if (job.status !== "succeeded" && job.status !== "expired") {
    throw new UpscaleApiError(
      409,
      "RESULT_NOT_READY",
      "Job does not have a deletable result.",
    );
  }
  await fs.rm(join(apiConfig.dataDir, "jobs", id), {
    recursive: true,
    force: true,
  });
  database
    .prepare(
      "UPDATE jobs SET status='expired',output_path=NULL,output_size=NULL,updated_at=? WHERE id=?",
    )
    .run(Date.now(), id);
  enqueueJobLifecycle(id, "expired", { reason: "result_deleted" });
};

export const sendJobResult = async (
  principal: ApiPrincipal,
  id: string,
  res: NextApiResponse,
) => {
  const job = getOwnedJob(principal, id);
  if (job.status === "expired") {
    throw new UpscaleApiError(410, "RESULT_EXPIRED", "Job result has expired.");
  }
  if (job.status !== "succeeded" || !job.output_path || !job.output_name) {
    throw new UpscaleApiError(
      409,
      "RESULT_NOT_READY",
      "Job result is not available.",
    );
  }
  try {
    await fs.access(job.output_path);
  } catch {
    throw new UpscaleApiError(410, "RESULT_EXPIRED", "Job result has expired.");
  }
  res.setHeader("Content-Type", job.output_mime || "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeDownloadName(job.output_name)}"`,
  );
  res.setHeader("Content-Length", String(job.output_size || 0));
  res.setHeader("Cache-Control", "private, no-store");
  streamFile(job.output_path).pipe(res);
};

export const health = async () => {
  const database = getDatabase();
  const [binary, models] = await Promise.all([
    fs
      .access(getUpscaylBinaryPath())
      .then(() => true)
      .catch(() => false),
    fs
      .access(getModelsPath())
      .then(() => true)
      .catch(() => false),
  ]);
  const queue = database
    .prepare(
      "SELECT SUM(status='queued') AS queued,SUM(status='processing') AS processing FROM jobs",
    )
    .get() as { queued: number | null; processing: number | null };
  const disk = await fs.statfs(apiConfig.dataDir);
  return {
    status: binary && models ? "ok" : "degraded",
    database: "ok",
    worker: {
      concurrency: 1,
      queued: queue.queued || 0,
      processing: queue.processing || 0,
    },
    runtime: { binary, models, softwareVulkan: getSoftwareVulkanInfo() },
    storage: {
      availableBytes: disk.bavail * disk.bsize,
      dataDirReady: true,
    },
    timestamp: Date.now(),
  };
};

export const models = () => ({
  data: Object.keys(MODELS).map((id) => ({
    id,
    scales: [2, 3, 4],
    outputFormats: ["png", "jpg", "webp"],
  })),
  limits: {
    maxFileBytes: apiConfig.maxFileBytes,
    maxBatchFiles: apiConfig.maxBatchFiles,
    maxQueueDepth: apiConfig.maxQueueDepth,
    maxOutputPixels: apiConfig.maxOutputPixels,
    resultTtlSeconds: Math.floor(apiConfig.resultTtlMs / 1000),
  },
});
