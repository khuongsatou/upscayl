#!/usr/bin/env node
const { readFileSync, writeFileSync } = require("fs");
const { basename, resolve } = require("path");

const base = process.env.UPSCAYL_API_TEST_URL || "http://127.0.0.1:3042/api/v1";
const apiKey = process.env.UPSCAYL_API_TEST_KEY || "test-api-key";
const fixture = resolve(
  process.env.UPSCAYL_API_TEST_IMAGE || "scripts/baboon.png",
);
const headers = { "X-API-Key": apiKey };

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const json = async (response) => {
  const data = await response.json();
  if (!response.ok)
    throw new Error(`${response.status}: ${JSON.stringify(data)}`);
  return data;
};
const upload = async (path = fixture) => {
  const form = new FormData();
  form.append(
    "file",
    new Blob([readFileSync(path)], { type: "image/png" }),
    basename(path),
  );
  return json(
    await fetch(`${base}/uploads`, { method: "POST", headers, body: form }),
  );
};
const waitForJob = async (id) => {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const job = await json(await fetch(`${base}/jobs/${id}`, { headers }));
    if (job.status === "succeeded") return job;
    if (["failed", "canceled", "expired"].includes(job.status)) {
      throw new Error(
        `Job ${id} ended as ${job.status}: ${JSON.stringify(job.error)}`,
      );
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error(`Timed out waiting for job ${id}.`);
};

(async () => {
  const health = await json(await fetch(`${base}/health`));
  assert(health.status === "ok", "Health must be ok.");
  const unauthorized = await fetch(`${base}/jobs`);
  assert(unauthorized.status === 401, "History must require authentication.");
  const invalidForm = new FormData();
  invalidForm.append(
    "file",
    new Blob([Buffer.from("not an image")], { type: "image/png" }),
    "fake.png",
  );
  const invalidUpload = await fetch(`${base}/uploads`, {
    method: "POST",
    headers,
    body: invalidForm,
  });
  assert(
    invalidUpload.status === 400,
    "Magic-byte validation must reject fake images.",
  );

  const singleUpload = await upload();
  const idempotencyKey = `contract-${Date.now()}`;
  const payload = {
    mode: "single",
    uploadIds: [singleUpload.id],
    model: "upscayl-standard-4x",
    scale: 4,
    outputFormat: "png",
    tileSize: 64,
  };
  const invalidJob = await fetch(`${base}/jobs`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, scale: 9 }),
  });
  assert(invalidJob.status === 400, "Invalid scale must be rejected.");
  const create = await fetch(`${base}/jobs`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
  assert(create.status === 202, "New job must return 202.");
  const job = await create.json();
  const replay = await fetch(`${base}/jobs`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
  assert(replay.status === 200, "Idempotency replay must return 200.");
  assert(
    replay.headers.get("idempotency-replayed") === "true",
    "Replay header missing.",
  );
  assert((await replay.json()).id === job.id, "Replay returned another job.");
  const completed = await waitForJob(job.id);
  assert(
    completed.progress === 100 && completed.result?.url,
    "Completed result metadata missing.",
  );
  const result = await fetch(new URL(completed.result.url, base), { headers });
  assert(
    result.ok && result.headers.get("content-type") === "image/png",
    "Result download failed.",
  );
  const output = Buffer.from(await result.arrayBuffer());
  assert(
    output
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    "Result is not PNG.",
  );
  writeFileSync("/tmp/upscale-api-v1-contract-result.png", output);
  const history = await json(await fetch(`${base}/jobs?limit=10`, { headers }));
  assert(
    history.data.some((item) => item.id === job.id),
    "Job missing from history.",
  );
  const deleted = await fetch(`${base}/jobs/${job.id}/result`, {
    method: "DELETE",
    headers,
  });
  assert(deleted.status === 204, "Result deletion must return 204.");
  const expired = await json(
    await fetch(`${base}/jobs/${job.id}`, { headers }),
  );
  assert(expired.status === "expired", "Deleted result must mark job expired.");
  console.log(
    JSON.stringify(
      { status: "pass", jobId: job.id, outputBytes: output.length },
      null,
      2,
    ),
  );
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
