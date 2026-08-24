#!/usr/bin/env node
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const bananaApiKey = "bbmcp_contract_test_key";
const upscaleToBananaKey = "contract-upscale-to-banana";
const bananaToUpscaleKey = "contract-banana-to-upscale";
const received = { introspections: 0, reservations: [], finalized: [], events: [] };
let bananaAvailable = true;

const json = (res, status, payload) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
};

const readJson = (req) => new Promise((resolve, reject) => {
  let body = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    try { resolve(body ? JSON.parse(body) : {}); } catch (error) { reject(error); }
  });
  req.on("error", reject);
});

const banana = http.createServer(async (req, res) => {
  if (req.headers["x-service-key"] !== upscaleToBananaKey) {
    json(res, 401, { error: { code: "UNAUTHORIZED", message: "invalid service key" } });
    return;
  }
  const pathname = new URL(req.url, "http://127.0.0.1").pathname;
  if (!bananaAvailable) {
    json(res, 503, { error: { code: "TEMPORARILY_UNAVAILABLE" } });
    return;
  }
  const body = req.method === "POST" ? await readJson(req) : {};
  if (pathname === "/api/platform/v1/keys/introspect") {
    received.introspections += 1;
    json(res, 200, body.apiKey === bananaApiKey ? {
      active: true,
      principal: {
        id: "banana:contract-key-id",
        keyId: "contract-key-id",
        keyPrefix: "bbmcp_contr…_key",
        kind: "banana_api_key",
        scopes: ["read", "write"],
        rateLimitPerHour: 1000,
      },
    } : { active: false });
    return;
  }
  if (pathname === "/api/platform/v1/quota/reservations") {
    const reservation = {
      id: `reservation-${received.reservations.length + 1}`,
      principalId: body.principalId,
      status: "active",
      units: body.units,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
    received.reservations.push({ ...body, reservation });
    bananaAvailable = false;
    json(res, 201, { reservation, replayed: false });
    return;
  }
  const finalization = pathname.match(/^\/api\/platform\/v1\/quota\/reservations\/([^/]+)\/(complete|release)$/);
  if (finalization) {
    received.finalized.push({ id: finalization[1], action: finalization[2], body });
    json(res, 200, { reservation: { id: finalization[1], status: finalization[2] === "complete" ? "completed" : "released" } });
    return;
  }
  if (pathname === "/api/platform/v1/events/batch") {
    received.events.push(...body.events);
    json(res, 202, { accepted: body.events.map((event) => event.eventId), duplicates: [] });
    return;
  }
  json(res, 404, { error: { code: "NOT_FOUND" } });
});

const listen = (server) => new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => resolve(server.address()));
});

const close = (server) => new Promise((resolve) => server.close(resolve));

const waitFor = async (predicate, timeoutMs = 15_000) => {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await predicate();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError || new Error("Timed out waiting for condition.");
};

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z9ZkAAAAASUVORK5CYII=",
  "base64",
);

(async () => {
  const address = await listen(banana);
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "upscale-banana-contract-"));
  const port = 3137;
  let child = null;
  let logs = "";
  const startUpscale = () => {
    const processHandle = spawn(process.execPath, [
      path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next"),
      "start",
      "renderer",
      "-H",
      "127.0.0.1",
      "-p",
      String(port),
    ], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "production",
        UPSCAYL_TARGET: "web",
        UPSCAYL_API_DATA_DIR: dataDir,
        UPSCAYL_API_ALLOW_ANONYMOUS_WEB: "false",
        BANANA_PLATFORM_API_BASE_URL: `http://127.0.0.1:${address.port}/api/platform/v1`,
        UPSCALE_TO_BANANA_SERVICE_KEY: upscaleToBananaKey,
        BANANA_TO_UPSCALE_SERVICE_KEY: bananaToUpscaleKey,
        BANANA_AUTH_CACHE_TTL_MS: "10000",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    processHandle.stdout.on("data", (chunk) => { logs += chunk; });
    processHandle.stderr.on("data", (chunk) => { logs += chunk; });
    return processHandle;
  };
  const stopUpscale = async () => {
    if (!child || child.exitCode !== null) return;
    const stopped = new Promise((resolve) => child.once("exit", resolve));
    child.kill("SIGTERM");
    await stopped;
  };
  child = startUpscale();
  const base = `http://127.0.0.1:${port}`;
  try {
    await waitFor(async () => (await fetch(`${base}/api/v1/health`)).status < 500);

    const deniedInternal = await fetch(`${base}/api/internal/v1/health`);
    assert.equal(deniedInternal.status, 401);
    const internal = await fetch(`${base}/api/internal/v1/health`, {
      headers: { "X-Service-Key": bananaToUpscaleKey },
    });
    assert.equal(internal.status, 200);
    assert.equal((await internal.json()).integration.bananaAuthConfigured, true);

    const invalid = await fetch(`${base}/api/v1/jobs`, {
      headers: { "X-API-Key": "bbmcp_invalid" },
    });
    assert.equal(invalid.status, 401);

    const form = new FormData();
    form.append("file", new Blob([png], { type: "image/png" }), "pixel.png");
    const uploadResponse = await fetch(`${base}/api/v1/uploads`, {
      method: "POST",
      headers: { "X-API-Key": bananaApiKey },
      body: form,
    });
    const uploadText = await uploadResponse.text();
    assert.equal(uploadResponse.status, 201, uploadText);
    const upload = JSON.parse(uploadText);

    const createResponse = await fetch(`${base}/api/v1/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": bananaApiKey,
        "Idempotency-Key": "contract-job-1",
      },
      body: JSON.stringify({
        mode: "single",
        uploadIds: [upload.id],
        model: "upscayl-standard-4x",
        scale: 2,
        outputFormat: "png",
      }),
    });
    const createText = await createResponse.text();
    assert.ok([200, 202].includes(createResponse.status), createText);
    const job = JSON.parse(createText);
    assert.equal(received.reservations.length, 1);
    assert.equal(received.reservations[0].principalId, "banana:contract-key-id");

    const cancelResponse = await fetch(`${base}/api/v1/jobs/${job.id}`, {
      method: "DELETE",
      headers: { "X-API-Key": bananaApiKey },
    });
    assert.equal(cancelResponse.status, 200, await cancelResponse.text());
    const databasePath = path.join(dataDir, "upscale-api.sqlite");
    await waitFor(() => {
      const database = new DatabaseSync(databasePath, { readOnly: true });
      const pending = database.prepare("SELECT COUNT(*) AS count,MAX(attempts) AS attempts FROM service_outbox WHERE delivered_at IS NULL").get();
      database.close();
      return pending.count > 0 && pending.attempts > 0;
    });

    await stopUpscale();
    bananaAvailable = true;
    child = startUpscale();
    await waitFor(async () => (await fetch(`${base}/api/v1/health`)).status < 500);
    await waitFor(() => received.events.some((event) => event.jobId === job.id), 20_000);
    await waitFor(() => received.finalized.some((item) => item.id === "reservation-1"), 20_000);

    await stopUpscale();
    const reconciliationJobId = "00000000-0000-4000-8000-000000000042";
    {
      const database = new DatabaseSync(databasePath);
      const now = Date.now();
      database.prepare(`INSERT INTO jobs(
        id,owner_id,idempotency_key,mode,model,scale,output_format,compression,custom_width,tile_size,tta,
        status,progress,estimated_completion_at,input_count,output_path,output_mime,output_name,output_size,
        error_code,error_message,cancel_requested,created_at,started_at,updated_at,completed_at,expires_at,
        quota_reservation_id,usage_units
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        reconciliationJobId,
        "banana:contract-key-id",
        "reconciliation-job",
        "single",
        "upscayl-standard-4x",
        2,
        "png",
        0,
        null,
        0,
        0,
        "succeeded",
        100,
        now,
        1,
        null,
        "image/png",
        "reconciled.png",
        1,
        null,
        null,
        0,
        now,
        now,
        now,
        now,
        now + 60_000,
        "reservation-reconcile",
        1,
      );
      database.close();
    }
    child = startUpscale();
    await waitFor(async () => (await fetch(`${base}/api/v1/health`)).status < 500);
    await waitFor(() => received.events.some((event) => event.jobId === reconciliationJobId), 20_000);
    await waitFor(() => received.finalized.some((item) => item.id === "reservation-reconcile" && item.action === "complete"), 20_000);

    const internalJobs = await fetch(`${base}/api/internal/v1/jobs`, {
      headers: { "X-Service-Key": bananaToUpscaleKey },
    });
    assert.equal(internalJobs.status, 200);
    assert.ok((await internalJobs.json()).data.some((item) => item.id === job.id));

    console.log(JSON.stringify({
      ok: true,
      introspections: received.introspections,
      reservations: received.reservations.length,
      finalized: received.finalized.length,
      events: received.events.map((event) => event.type),
      restartRecovery: true,
      terminalReconciliation: true,
    }, null, 2));
  } finally {
    await stopUpscale();
    await close(banana);
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
