import {
  completeBananaQuota,
  releaseBananaQuota,
  sendBananaEvents,
} from "./banana-client";
import { getDatabase } from "./database";
import type { JobRow, JobStatus } from "./types";

type OutboxAction = "event_batch" | "quota_complete" | "quota_release";
type OutboxRow = {
  id: number;
  event_id: string;
  action: OutboxAction;
  payload_json: string;
  attempts: number;
};

let flushTimer: NodeJS.Timeout | null = null;
let flushing = false;
let dispatcherStarted = false;

const insert = (
  eventId: string,
  action: OutboxAction,
  payload: Record<string, unknown>,
) => {
  const now = Date.now();
  getDatabase()
    .prepare(
      `INSERT INTO service_outbox(event_id,action,payload_json,attempts,next_attempt_at,created_at,updated_at)
       VALUES(?,?,?,0,?,?,?) ON CONFLICT(event_id) DO NOTHING`,
    )
    .run(eventId, action, JSON.stringify(payload), now, now, now);
  scheduleOutboxFlush();
};

export const enqueueQuotaRelease = (
  reservationId: string,
  metadata: Record<string, unknown>,
) => {
  if (!reservationId) return;
  insert(`quota:${reservationId}:release`, "quota_release", {
    reservationId,
    metadata,
  });
};

export const enqueueJobLifecycle = (
  jobId: string,
  status: JobStatus,
  metadata: Record<string, unknown> = {},
) => {
  const job = getDatabase()
    .prepare("SELECT * FROM jobs WHERE id=?")
    .get(jobId) as JobRow | undefined;
  if (!job || !job.owner_id.startsWith("banana:")) return;
  const eventId = `upscale-job:${job.id}:${status}`;
  insert(eventId, "event_batch", {
    events: [
      {
        eventId,
        type: `upscale.job.${status}`,
        principalId: job.owner_id,
        jobId: job.id,
        reservationId: job.quota_reservation_id || "",
        status,
        units: job.usage_units || job.input_count || 1,
        occurredAt: new Date(job.updated_at).toISOString(),
        metadata: {
          mode: job.mode,
          model: job.model,
          scale: job.scale,
          inputCount: job.input_count,
          ...metadata,
        },
      },
    ],
  });
  if (!job.quota_reservation_id) return;
  if (status === "succeeded") {
    insert(
      `quota:${job.quota_reservation_id}:complete`,
      "quota_complete",
      { reservationId: job.quota_reservation_id, metadata: { jobId } },
    );
  } else if (status === "failed" || status === "canceled") {
    enqueueQuotaRelease(job.quota_reservation_id, { jobId, status });
  }
};

const deliver = async (row: OutboxRow) => {
  const payload = JSON.parse(row.payload_json) as {
    events?: Array<Record<string, unknown>>;
    reservationId?: string;
    metadata?: Record<string, unknown>;
  };
  if (row.action === "event_batch") {
    await sendBananaEvents(payload.events || []);
  } else if (row.action === "quota_complete") {
    await completeBananaQuota(payload.reservationId || "", payload.metadata);
  } else {
    await releaseBananaQuota(payload.reservationId || "", payload.metadata);
  }
};

export const flushOutbox = async () => {
  if (flushing) return;
  flushing = true;
  try {
    const database = getDatabase();
    const rows = database
      .prepare(
        `SELECT id,event_id,action,payload_json,attempts FROM service_outbox
         WHERE delivered_at IS NULL AND next_attempt_at<=? ORDER BY id LIMIT 20`,
      )
      .all(Date.now()) as OutboxRow[];
    for (const row of rows) {
      try {
        await deliver(row);
        const now = Date.now();
        database
          .prepare(
            "UPDATE service_outbox SET delivered_at=?,updated_at=?,last_error=NULL WHERE id=?",
          )
          .run(now, now, row.id);
      } catch (error) {
        const attempts = row.attempts + 1;
        const delay = Math.min(15 * 60_000, 1000 * 2 ** Math.min(attempts, 9));
        database
          .prepare(
            `UPDATE service_outbox SET attempts=?,next_attempt_at=?,updated_at=?,last_error=? WHERE id=?`,
          )
          .run(
            attempts,
            Date.now() + delay,
            Date.now(),
            String((error as Error)?.message || "delivery_failed").slice(0, 500),
            row.id,
          );
      }
    }
  } finally {
    flushing = false;
  }
};

export const scheduleOutboxFlush = () => {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushOutbox();
  }, 50);
  flushTimer.unref();
};

export const ensureOutboxDispatcher = () => {
  if (dispatcherStarted) return;
  dispatcherStarted = true;
  scheduleOutboxFlush();
  const timer = setInterval(() => void flushOutbox(), 5_000);
  timer.unref();
};
