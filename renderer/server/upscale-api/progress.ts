import { apiConfig } from "./config";
import { getDatabase } from "./database";
import { readImageDimensions } from "./image-info";
import type { JobRow, UploadRow } from "./types";

export const updateJobProgress = (
  jobId: string,
  progress: number,
  measured: boolean,
) => {
  const database = getDatabase();
  const job = database
    .prepare(
      "SELECT progress,started_at,estimated_completion_at,status FROM jobs WHERE id=?",
    )
    .get(jobId) as
    | {
        progress: number;
        started_at: number;
        estimated_completion_at: number | null;
        status: string;
      }
    | undefined;
  if (!job || job.status !== "processing") return;
  const now = Date.now();
  const normalized = Math.min(100, Math.max(0, progress));
  const nextProgress = Math.max(job.progress, normalized);
  let completionAt = job.estimated_completion_at;
  if (measured && normalized > 0 && normalized < 100) {
    const sample =
      now + ((now - job.started_at) * (100 - normalized)) / normalized;
    completionAt = completionAt
      ? Math.round(completionAt * 0.65 + sample * 0.35)
      : Math.round(sample);
  }
  database
    .prepare(
      "UPDATE jobs SET progress=?,estimated_completion_at=?,updated_at=? WHERE id=? AND status='processing'",
    )
    .run(nextProgress, completionAt, now, jobId);
};

const outputPixelsFor = async (job: JobRow, upload: UploadRow) => {
  const dimensions = await readImageDimensions(upload.storage_path);
  const scaledPixels =
    dimensions.width * job.scale * dimensions.height * job.scale;
  const finalPixels = job.custom_width
    ? job.custom_width *
      Math.round((job.custom_width * dimensions.height) / dimensions.width)
    : job.mode === "double"
      ? scaledPixels * job.scale * job.scale
      : scaledPixels;
  return job.mode === "double" ? scaledPixels + finalPixels : finalPixels;
};

const estimateJobDurationMs = async (job: JobRow, uploads: UploadRow[]) => {
  const pixelCounts = await Promise.all(
    uploads.map((upload) => outputPixelsFor(job, upload)),
  );
  const workloadPixels = pixelCounts.reduce((sum, pixels) => sum + pixels, 0);
  const ttaMultiplier = job.tta ? 2 : 1;
  return Math.min(
    apiConfig.jobTimeoutMs * 0.9,
    Math.max(
      15_000,
      (workloadPixels / 1_000_000) *
        apiConfig.estimatedMsPerMegapixel *
        ttaMultiplier,
    ),
  );
};

export const startEstimatedProgress = async (
  job: JobRow,
  uploads: UploadRow[],
) => {
  const database = getDatabase();
  const estimatedDurationMs = await estimateJobDurationMs(job, uploads);
  const startedAt = job.started_at || Date.now();
  database
    .prepare(
      "UPDATE jobs SET estimated_completion_at=?,updated_at=? WHERE id=? AND status='processing'",
    )
    .run(startedAt + estimatedDurationMs, Date.now(), job.id);

  const timer = setInterval(() => {
    const row = database
      .prepare("SELECT status,estimated_completion_at FROM jobs WHERE id=?")
      .get(job.id) as
      | { status: string; estimated_completion_at: number | null }
      | undefined;
    if (!row || row.status !== "processing") {
      clearInterval(timer);
      return;
    }
    const now = Date.now();
    const elapsedMs = Math.max(0, now - startedAt);
    const fallbackProgress = Math.min(
      95,
      (elapsedMs / estimatedDurationMs) * 95,
    );
    updateJobProgress(job.id, fallbackProgress, false);
    if (
      row.estimated_completion_at !== null &&
      row.estimated_completion_at <= now
    ) {
      const extensionMs = Math.max(15_000, estimatedDurationMs * 0.25);
      database
        .prepare(
          "UPDATE jobs SET estimated_completion_at=?,updated_at=? WHERE id=? AND status='processing'",
        )
        .run(now + extensionMs, now, job.id);
    }
  }, 500);
  timer.unref();
  return () => clearInterval(timer);
};
