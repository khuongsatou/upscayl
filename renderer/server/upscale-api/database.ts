import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { createHash } from "crypto";
import { apiConfig } from "./config";

type Database = any;

declare global {
  // eslint-disable-next-line no-var
  var __upscaleApiDatabase: Database | undefined;
}

const schema = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT NOT NULL DEFAULT 'read,write',
  active INTEGER NOT NULL DEFAULT 1,
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 10000,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER
);

CREATE TABLE IF NOT EXISTS rate_windows (
  principal_id TEXT NOT NULL,
  category TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL,
  PRIMARY KEY (principal_id, category, window_start)
);

CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  extension TEXT NOT NULL,
  size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  consumed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_upload_owner ON uploads(owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  idempotency_key TEXT,
  mode TEXT NOT NULL CHECK(mode IN ('single','double','batch')),
  model TEXT NOT NULL,
  scale INTEGER NOT NULL,
  output_format TEXT NOT NULL,
  compression INTEGER NOT NULL,
  custom_width INTEGER,
  tile_size INTEGER NOT NULL,
  tta INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('queued','processing','succeeded','failed','canceled','expired')),
  progress REAL NOT NULL DEFAULT 0,
  estimated_completion_at INTEGER,
  input_count INTEGER NOT NULL,
  output_path TEXT,
  output_mime TEXT,
  output_name TEXT,
  output_size INTEGER,
  error_code TEXT,
  error_message TEXT,
  cancel_requested INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,
  expires_at INTEGER NOT NULL,
  quota_reservation_id TEXT,
  usage_units INTEGER NOT NULL DEFAULT 1,
  UNIQUE(owner_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_jobs_queue ON jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_owner ON jobs(owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS job_uploads (
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  upload_id TEXT NOT NULL REFERENCES uploads(id),
  position INTEGER NOT NULL,
  PRIMARY KEY(job_id, upload_id)
);

CREATE TABLE IF NOT EXISTS job_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS service_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  action TEXT NOT NULL CHECK(action IN ('event_batch','quota_complete','quota_release')),
  payload_json TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL,
  delivered_at INTEGER,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_service_outbox_pending
ON service_outbox(delivered_at, next_attempt_at, id);
`;

const ensureColumn = (
  database: Database,
  table: string,
  column: string,
  definition: string,
) => {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  if (!columns.some((item) => item.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

export const hashApiKey = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export const getDatabase = (): Database => {
  if (globalThis.__upscaleApiDatabase) return globalThis.__upscaleApiDatabase;
  mkdirSync(apiConfig.dataDir, { recursive: true });
  const sqlite = eval("require")("node:sqlite");
  const databasePath = join(apiConfig.dataDir, "upscale-api.sqlite");
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = new sqlite.DatabaseSync(databasePath);
  database.exec(schema);
  ensureColumn(database, "jobs", "quota_reservation_id", "TEXT");
  ensureColumn(database, "jobs", "usage_units", "INTEGER NOT NULL DEFAULT 1");
  const interruptedCanceledJobs = database
    .prepare(
      "SELECT * FROM jobs WHERE status='processing' AND cancel_requested=1",
    )
    .all() as Array<{
      id: string;
      owner_id: string;
      mode: string;
      model: string;
      scale: number;
      input_count: number;
      quota_reservation_id: string | null;
      usage_units: number;
    }>;
  database
    .prepare(
      "UPDATE jobs SET status='canceled',error_code='JOB_CANCELED',error_message='Job was canceled.',completed_at=?,updated_at=? WHERE status='processing' AND cancel_requested=1",
    )
    .run(Date.now(), Date.now());
  const recoveryTime = Date.now();
  for (const job of interruptedCanceledJobs) {
    if (!job.owner_id.startsWith("banana:")) continue;
    const eventId = `upscale-job:${job.id}:canceled`;
    database
      .prepare(
        `INSERT INTO service_outbox(event_id,action,payload_json,attempts,next_attempt_at,created_at,updated_at)
         VALUES(?, 'event_batch', ?, 0, ?, ?, ?) ON CONFLICT(event_id) DO NOTHING`,
      )
      .run(
        eventId,
        JSON.stringify({
          events: [
            {
              eventId,
              type: "upscale.job.canceled",
              principalId: job.owner_id,
              jobId: job.id,
              reservationId: job.quota_reservation_id || "",
              status: "canceled",
              units: job.usage_units || job.input_count || 1,
              occurredAt: new Date(recoveryTime).toISOString(),
              metadata: {
                mode: job.mode,
                model: job.model,
                scale: job.scale,
                inputCount: job.input_count,
                reason: "service_restart_after_cancel",
              },
            },
          ],
        }),
        recoveryTime,
        recoveryTime,
        recoveryTime,
      );
    if (job.quota_reservation_id) {
      database
        .prepare(
          `INSERT INTO service_outbox(event_id,action,payload_json,attempts,next_attempt_at,created_at,updated_at)
           VALUES(?, 'quota_release', ?, 0, ?, ?, ?) ON CONFLICT(event_id) DO NOTHING`,
        )
        .run(
          `quota:${job.quota_reservation_id}:release`,
          JSON.stringify({
            reservationId: job.quota_reservation_id,
            metadata: {
              jobId: job.id,
              status: "canceled",
              reason: "service_restart_after_cancel",
            },
          }),
          recoveryTime,
          recoveryTime,
          recoveryTime,
        );
    }
  }
  database
    .prepare(
      "UPDATE jobs SET status='queued', progress=0, estimated_completion_at=NULL, started_at=NULL, updated_at=? WHERE status='processing' AND cancel_requested=0",
    )
    .run(Date.now());

  const bootstrapKey = process.env.UPSCAYL_API_BOOTSTRAP_KEY;
  if (bootstrapKey) {
    database
      .prepare(
        `INSERT INTO api_keys(id,name,key_hash,scopes,active,rate_limit_per_hour,created_at)
         VALUES('bootstrap','Bootstrap API key',?,'read,write,admin',1,10000,?)
         ON CONFLICT(id) DO UPDATE SET key_hash=excluded.key_hash, active=1`,
      )
      .run(hashApiKey(bootstrapKey), Date.now());
  }
  globalThis.__upscaleApiDatabase = database;
  return database;
};

export const databasePathForCli = () =>
  join(apiConfig.dataDir, "upscale-api.sqlite");
