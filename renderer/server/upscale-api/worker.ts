import { spawn, ChildProcess } from "child_process";
import { constants, promises as fs } from "fs";
import { basename, join, parse } from "path";
import { ZipArchive } from "archiver";
import getModelScale from "@common/check-model-scale";
import { apiConfig, getModelsPath, getUpscaylBinaryPath } from "./config";
import { getDatabase } from "./database";
import { startEstimatedProgress, updateJobProgress } from "./progress";
import { buildUpscaylSpawnEnv } from "./runtime-env";
import type { JobRow, UploadRow } from "./types";
import {
  enqueueJobLifecycle,
  ensureOutboxDispatcher,
} from "./outbox";

type WorkerRuntime = {
  runningJobId: string | null;
  child: ChildProcess | null;
  scheduled: boolean;
  cleanupTimer: NodeJS.Timeout | null;
  exitHandlerRegistered: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var __upscaleApiWorker: WorkerRuntime | undefined;
}

const runtime = (): WorkerRuntime => {
  if (!globalThis.__upscaleApiWorker) {
    globalThis.__upscaleApiWorker = {
      runningJobId: null,
      child: null,
      scheduled: false,
      cleanupTimer: null,
      exitHandlerRegistered: false,
    };
  }
  return globalThis.__upscaleApiWorker;
};

const event = (jobId: string, type: string, payload?: unknown) => {
  getDatabase()
    .prepare(
      "INSERT INTO job_events(job_id,event_type,payload_json,created_at) VALUES(?,?,?,?)",
    )
    .run(
      jobId,
      type,
      payload === undefined ? null : JSON.stringify(payload),
      Date.now(),
    );
};

const killChild = (child: ChildProcess, signal: NodeJS.Signals = "SIGTERM") => {
  if (!child.pid) return;
  try {
    if (process.platform !== "win32") process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    try {
      child.kill(signal);
    } catch {
      // Process already exited.
    }
  }
};

const runBinary = (
  jobId: string,
  args: string[],
  mapProgress: (progress: number) => number,
) =>
  new Promise<void>((resolve, reject) => {
    const state = runtime();
    const child = spawn(getUpscaylBinaryPath(), args.filter(Boolean), {
      cwd: process.cwd(),
      detached: process.platform !== "win32",
      env: buildUpscaylSpawnEnv(),
    });
    state.child = child;
    let settled = false;
    const timeout = setTimeout(() => {
      killChild(child);
      finish(new Error("JOB_TIMEOUT"));
    }, apiConfig.jobTimeoutMs);
    timeout.unref();
    const cancelPoll = setInterval(() => {
      const row = getDatabase()
        .prepare("SELECT cancel_requested FROM jobs WHERE id=?")
        .get(jobId) as { cancel_requested: number } | undefined;
      if (row?.cancel_requested) killChild(child);
    }, 500);
    cancelPoll.unref();

    const cleanup = () => {
      clearInterval(cancelPoll);
      clearTimeout(timeout);
      if (state.child === child) state.child = null;
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const onOutput = (data: Buffer) => {
      const text = data.toString();
      const percentages = text.match(/\d+(?:\.\d+)?%/g) || [];
      percentages.forEach((value) =>
        updateJobProgress(
          jobId,
          mapProgress(Number(value.replace("%", ""))),
          true,
        ),
      );
    };
    child.stdout.on("data", onOutput);
    child.stderr.on("data", onOutput);
    child.on("error", (error) => finish(error));
    child.on("close", (code, signal) => {
      const cancelRequested = getDatabase()
        .prepare("SELECT cancel_requested FROM jobs WHERE id=?")
        .get(jobId) as { cancel_requested: number } | undefined;
      if (cancelRequested?.cancel_requested) {
        finish(new Error("JOB_CANCELED"));
      } else if (code === 0) {
        finish();
      } else {
        finish(
          new Error(
            `Upscayl process exited with code ${code ?? "unknown"} (${signal ?? "no signal"}).`,
          ),
        );
      }
    });
  });

const buildArgs = (job: JobRow, inputPath: string, outputPath: string) => {
  const scale = String(job.scale);
  const includeScale = getModelScale(job.model) !== scale && !job.custom_width;
  return [
    "-i",
    inputPath,
    "-o",
    outputPath,
    includeScale ? "-s" : "",
    includeScale ? scale : "",
    "-m",
    getModelsPath(),
    "-n",
    job.model,
    "-f",
    job.output_format,
    job.custom_width ? "-w" : "",
    job.custom_width ? String(job.custom_width) : "",
    "-c",
    String(job.compression),
    job.tile_size ? "-t" : "",
    job.tile_size ? String(job.tile_size) : "",
    job.tta ? "-x" : "",
  ];
};

const archiveOutputs = async (directory: string, outputPath: string) => {
  const entries = (await fs.readdir(directory, { withFileTypes: true })).filter(
    (entry) => entry.isFile(),
  );
  if (!entries.length) throw new Error("Batch job produced no output files.");
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const stream = (await import("fs")).createWriteStream(outputPath);
  archive.pipe(stream);
  entries.forEach((entry) =>
    archive.file(join(directory, entry.name), { name: entry.name }),
  );
  await new Promise<void>((resolve, reject) => {
    stream.on("close", resolve);
    stream.on("error", reject);
    archive.on("error", reject);
    archive.finalize().catch(reject);
  });
};

const processJob = async (job: JobRow) => {
  const database = getDatabase();
  const uploads = database
    .prepare(
      `SELECT u.* FROM uploads u JOIN job_uploads ju ON ju.upload_id=u.id
       WHERE ju.job_id=? ORDER BY ju.position`,
    )
    .all(job.id) as UploadRow[];
  if (uploads.length !== job.input_count)
    throw new Error("Job input is missing.");
  const stopEstimatedProgress = await startEstimatedProgress(job, uploads);
  const jobDirectory = join(apiConfig.dataDir, "jobs", job.id);
  const inputDirectory = join(jobDirectory, "input");
  const outputDirectory = join(jobDirectory, "output");
  await fs.mkdir(inputDirectory, { recursive: true });
  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.access(getUpscaylBinaryPath(), constants.X_OK);
  await fs.access(getModelsPath(), constants.R_OK);
  const inputPaths: string[] = [];
  for (let index = 0; index < uploads.length; index += 1) {
    const upload = uploads[index];
    const inputPath = join(
      inputDirectory,
      `${String(index + 1).padStart(3, "0")}_${upload.original_name}`,
    );
    await fs.copyFile(upload.storage_path, inputPath);
    inputPaths.push(inputPath);
  }

  let resultPath: string;
  let outputName: string;
  let outputMime: string;
  if (job.mode === "batch") {
    let completed = 0;
    let previous = 0;
    await runBinary(
      job.id,
      buildArgs(job, inputDirectory, outputDirectory),
      (progress) => {
        if (progress < previous && previous >= 100) completed += 1;
        previous = progress;
        return ((completed + progress / 100) / uploads.length) * 100;
      },
    );
    resultPath = join(jobDirectory, "result.zip");
    await archiveOutputs(outputDirectory, resultPath);
    outputName = `upscayl-${job.id}.zip`;
    outputMime = "application/zip";
  } else {
    const sourceName = parse(uploads[0].original_name).name || "image";
    outputName = `${sourceName}_upscayl_${job.mode === "double" ? `${job.scale * job.scale}x` : `${job.scale}x`}_${job.model}.${job.output_format}`;
    resultPath = join(outputDirectory, outputName);
    if (job.mode === "double") {
      const firstPass = join(
        outputDirectory,
        `first-pass.${job.output_format}`,
      );
      const firstPassJob = job.custom_width
        ? ({ ...job, custom_width: null } as JobRow)
        : job;
      await runBinary(
        job.id,
        buildArgs(firstPassJob, inputPaths[0], firstPass),
        (value) => value / 2,
      );
      await runBinary(
        job.id,
        buildArgs(job, firstPass, resultPath),
        (value) => 50 + value / 2,
      );
      await fs.rm(firstPass, { force: true });
    } else {
      await runBinary(
        job.id,
        buildArgs(job, inputPaths[0], resultPath),
        (value) => value,
      );
    }
    outputMime =
      job.output_format === "jpg" ? "image/jpeg" : `image/${job.output_format}`;
  }
  const stat = await fs.stat(resultPath);
  stopEstimatedProgress();
  const now = Date.now();
  database
    .prepare(
      `UPDATE jobs SET status='succeeded',progress=100,estimated_completion_at=?,output_path=?,output_mime=?,
       output_name=?,output_size=?,completed_at=?,updated_at=? WHERE id=?`,
    )
    .run(now, resultPath, outputMime, outputName, stat.size, now, now, job.id);
  event(job.id, "succeeded", { outputSize: stat.size });
  enqueueJobLifecycle(job.id, "succeeded", { outputSize: stat.size });
};

const claimNextJob = (): JobRow | undefined => {
  const database = getDatabase();
  database.exec("BEGIN IMMEDIATE");
  try {
    const job = database
      .prepare(
        "SELECT * FROM jobs WHERE status='queued' AND cancel_requested=0 ORDER BY created_at LIMIT 1",
      )
      .get() as JobRow | undefined;
    if (job) {
      const now = Date.now();
      database
        .prepare(
          "UPDATE jobs SET status='processing',started_at=?,updated_at=? WHERE id=? AND status='queued'",
        )
        .run(now, now, job.id);
      job.status = "processing";
      job.started_at = now;
      job.updated_at = now;
    }
    database.exec("COMMIT");
    return job;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
};

const processNext = async () => {
  const state = runtime();
  state.scheduled = false;
  if (state.runningJobId) return;
  const job = claimNextJob();
  if (!job) return;
  state.runningJobId = job.id;
  event(job.id, "processing");
  enqueueJobLifecycle(job.id, "processing");
  try {
    await processJob(job);
  } catch (error) {
    const message = (error as Error).message || "Upscale job failed.";
    const canceled = message === "JOB_CANCELED";
    const timeout = message === "JOB_TIMEOUT";
    const now = Date.now();
    getDatabase()
      .prepare(
        `UPDATE jobs SET status=?,error_code=?,error_message=?,completed_at=?,updated_at=? WHERE id=?`,
      )
      .run(
        canceled ? "canceled" : "failed",
        canceled
          ? "JOB_CANCELED"
          : timeout
            ? "JOB_TIMEOUT"
            : "PROCESSING_FAILED",
        canceled
          ? "Job was canceled."
          : timeout
            ? "Job exceeded its time limit."
            : message.slice(0, 2000),
        now,
        now,
        job.id,
      );
    event(job.id, canceled ? "canceled" : "failed", {
      code: timeout ? "JOB_TIMEOUT" : undefined,
    });
    enqueueJobLifecycle(job.id, canceled ? "canceled" : "failed", {
      code: timeout ? "JOB_TIMEOUT" : undefined,
    });
    await fs
      .rm(join(apiConfig.dataDir, "jobs", job.id), {
        recursive: true,
        force: true,
      })
      .catch(() => undefined);
  } finally {
    state.runningJobId = null;
    state.child = null;
    scheduleWorker();
  }
};

export const scheduleWorker = () => {
  const state = runtime();
  if (state.scheduled || state.runningJobId) return;
  state.scheduled = true;
  setTimeout(() => {
    void processNext().catch(() => {
      state.scheduled = false;
      setTimeout(scheduleWorker, 1000).unref();
    });
  }, 0).unref();
};

export const requestWorkerCancellation = (jobId: string) => {
  const state = runtime();
  if (state.runningJobId === jobId && state.child) {
    killChild(state.child);
    setTimeout(() => {
      if (state.runningJobId === jobId && state.child)
        killChild(state.child, "SIGKILL");
    }, 3000).unref();
  }
};

export const cleanupExpiredData = async () => {
  const database = getDatabase();
  const now = Date.now();
  const uploads = database
    .prepare(
      `SELECT u.id,u.storage_path FROM uploads u WHERE u.expires_at<?
       AND NOT EXISTS(
         SELECT 1 FROM job_uploads ju JOIN jobs j ON j.id=ju.job_id
         WHERE ju.upload_id=u.id AND j.status IN ('queued','processing')
       )`,
    )
    .all(now) as Array<{ id: string; storage_path: string }>;
  for (const upload of uploads) {
    await fs.rm(upload.storage_path, { force: true }).catch(() => undefined);
    database
      .prepare(
        "DELETE FROM uploads WHERE id=? AND NOT EXISTS(SELECT 1 FROM job_uploads WHERE upload_id=?)",
      )
      .run(upload.id, upload.id);
  }
  const jobs = database
    .prepare("SELECT id FROM jobs WHERE status='succeeded' AND expires_at<?")
    .all(now) as Array<{ id: string }>;
  for (const job of jobs) {
    await fs
      .rm(join(apiConfig.dataDir, "jobs", job.id), {
        recursive: true,
        force: true,
      })
      .catch(() => undefined);
    database
      .prepare(
        "UPDATE jobs SET status='expired',output_path=NULL,output_size=NULL,updated_at=? WHERE id=?",
      )
      .run(now, job.id);
    enqueueJobLifecycle(job.id, "expired");
  }
  database
    .prepare("DELETE FROM rate_windows WHERE window_start<?")
    .run(now - 2 * 3_600_000);
};

export const ensureWorker = () => {
  getDatabase();
  ensureOutboxDispatcher();
  const state = runtime();
  if (!state.exitHandlerRegistered) {
    state.exitHandlerRegistered = true;
    process.once("exit", () => {
      if (state.child) killChild(state.child, "SIGTERM");
    });
  }
  scheduleWorker();
  if (!state.cleanupTimer) {
    state.cleanupTimer = setInterval(
      () => void cleanupExpiredData(),
      apiConfig.cleanupIntervalMs,
    );
    state.cleanupTimer.unref();
    void cleanupExpiredData();
  }
};
