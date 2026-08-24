import type { NextApiRequest, NextApiResponse } from "next";
import { ELECTRON_COMMANDS } from "@common/electron-commands";
import { apiConfig } from "@/server/upscale-api/config";
import { getDatabase } from "@/server/upscale-api/database";
import { UpscaleApiError } from "@/server/upscale-api/errors";
import {
  cancelJob,
  createJob,
  sendJobResult,
  serializeJob,
} from "@/server/upscale-api/service";
import { storeLegacyMultipart } from "@/server/upscale-api/storage";
import type { ApiPrincipal, JobMode, JobRow } from "@/server/upscale-api/types";
import { validateJobOptions } from "@/server/upscale-api/validation";
import { ensureWorker } from "@/server/upscale-api/worker";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const principalFor = (legacyJobId: string): ApiPrincipal => ({
  id: `legacy:${legacyJobId}`,
  kind: "internal",
  scopes: new Set(["read", "write"]),
  rateLimitPerHour: Number.MAX_SAFE_INTEGER,
});

const findLegacyJob = (legacyJobId: string) =>
  getDatabase()
    .prepare("SELECT * FROM jobs WHERE owner_id=? AND idempotency_key=?")
    .get(`legacy:${legacyJobId}`, legacyJobId) as JobRow | undefined;

const modeForCommand = (command: string): JobMode => {
  if (command === ELECTRON_COMMANDS.DOUBLE_UPSCAYL) return "double";
  if (command === ELECTRON_COMMANDS.FOLDER_UPSCAYL) return "batch";
  if (command === ELECTRON_COMMANDS.UPSCAYL) return "single";
  throw new UpscaleApiError(
    400,
    "UNSUPPORTED_COMMAND",
    "Unsupported legacy upscale command.",
  );
};

const waitForTerminalJob = async (
  principal: ApiPrincipal,
  jobId: string,
  req: NextApiRequest,
) => {
  let aborted = false;
  req.once("aborted", () => {
    aborted = true;
    cancelJob(principal, jobId);
  });
  const deadline = Date.now() + apiConfig.jobTimeoutMs + 60_000;
  while (Date.now() < deadline) {
    const job = getDatabase()
      .prepare("SELECT * FROM jobs WHERE id=? AND owner_id=?")
      .get(jobId, principal.id) as JobRow;
    if (job.status === "succeeded") return job;
    if (["failed", "canceled", "expired"].includes(job.status)) {
      throw new UpscaleApiError(
        job.status === "canceled" ? 499 : 500,
        job.error_code || "LEGACY_JOB_FAILED",
        job.error_message || `Legacy job ${job.status}.`,
      );
    }
    if (aborted) {
      throw new UpscaleApiError(499, "JOB_CANCELED", "Job was canceled.");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  cancelJob(principal, jobId);
  throw new UpscaleApiError(504, "JOB_TIMEOUT", "Legacy request timed out.");
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader("Deprecation", "true");
  res.setHeader("Sunset", "Mon, 23 Nov 2026 00:00:00 GMT");
  res.setHeader(
    "Link",
    `<${process.env.UPSCAYL_WEB_BASE_PATH || ""}/api/v1>; rel="successor-version"`,
  );
  res.setHeader("Cache-Control", "no-store");
  ensureWorker();
  const legacyJobId = firstValue(req.query.jobId);
  if (!legacyJobId || !UUID_PATTERN.test(legacyJobId)) {
    res.status(400).send("A valid upscale job ID is required.");
    return;
  }
  const principal = principalFor(legacyJobId);

  if (req.method === "GET") {
    const job = findLegacyJob(legacyJobId);
    if (!job) {
      res.status(404).json({ error: "Upscale job progress is not available." });
      return;
    }
    const serialized = serializeJob(job);
    res.status(200).json({
      progress: serialized.progress,
      status:
        job.status === "succeeded"
          ? "done"
          : job.status === "queued" || job.status === "processing"
            ? "running"
            : "error",
      updatedAt: job.updated_at,
      startedAt: job.started_at || job.created_at,
      estimatedRemainingSeconds: serialized.estimatedRemainingSeconds,
    });
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).send("Method not allowed.");
    return;
  }

  try {
    const parsed = await storeLegacyMultipart(req, principal);
    const command = firstValue(parsed.fields.command);
    const payloadText = firstValue(parsed.fields.payload);
    if (!command || !payloadText) {
      throw new UpscaleApiError(
        400,
        "MISSING_LEGACY_PAYLOAD",
        "Missing legacy command or payload.",
      );
    }
    const payload = JSON.parse(payloadText);
    const options = validateJobOptions({
      mode: modeForCommand(command),
      uploadIds: parsed.uploads.map((upload) => upload.id),
      model: payload.model,
      scale: Number(payload.scale),
      outputFormat:
        payload.saveImageAs === "jpeg" ? "jpg" : payload.saveImageAs,
      compression: Number(payload.compression || 0),
      customWidth: payload.useCustomWidth ? Number(payload.customWidth) : null,
      tileSize: Number(payload.tileSize || 0),
      tta: Boolean(payload.ttaMode),
    });
    const created = await createJob(principal, options, legacyJobId);
    const completed = await waitForTerminalJob(principal, created.job.id, req);
    await sendJobResult(principal, completed.id, res);
  } catch (error) {
    if (!res.headersSent) {
      const normalized =
        error instanceof UpscaleApiError
          ? error
          : new UpscaleApiError(
              500,
              "LEGACY_INTERNAL_ERROR",
              (error as Error).message || "Legacy upscale failed.",
            );
      res
        .status(normalized.status === 499 ? 500 : normalized.status)
        .send(normalized.message);
    }
  }
};

export default handler;
