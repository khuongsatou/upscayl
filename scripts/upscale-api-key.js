#!/usr/bin/env node
const { randomBytes, randomUUID, createHash } = require("crypto");
const { mkdirSync } = require("fs");
const { tmpdir } = require("os");
const { resolve, join } = require("path");
const { DatabaseSync } = require("node:sqlite");

const dataDir = resolve(
  process.env.UPSCAYL_API_DATA_DIR ||
    resolve(tmpdir(), "mtips5s-upscale-api-v1"),
);
mkdirSync(dataDir, { recursive: true });
const database = new DatabaseSync(join(dataDir, "upscale-api.sqlite"));
database.exec(`
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT NOT NULL DEFAULT 'read,write',
  active INTEGER NOT NULL DEFAULT 1,
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 10000,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER
);`);

const command = process.argv[2];
if (command === "create") {
  const name = process.argv[3] || "API key";
  const scopes = process.argv[4] || "read,write";
  const rateLimit = Number(process.argv[5] || 10000);
  if (!/^(read|write|admin)(,(read|write|admin))*$/.test(scopes)) {
    throw new Error(
      "Scopes must be a comma-separated subset of read,write,admin.",
    );
  }
  if (!Number.isInteger(rateLimit) || rateLimit < 1) {
    throw new Error("Rate limit must be a positive integer.");
  }
  const id = randomUUID();
  const secret = `up_${randomBytes(32).toString("base64url")}`;
  const hash = createHash("sha256").update(secret).digest("hex");
  database
    .prepare(
      "INSERT INTO api_keys(id,name,key_hash,scopes,active,rate_limit_per_hour,created_at) VALUES(?,?,?,?,1,?,?)",
    )
    .run(id, name, hash, scopes, rateLimit, Date.now());
  console.log(
    JSON.stringify({ id, name, scopes, rateLimit, apiKey: secret }, null, 2),
  );
  console.error(
    "Save apiKey now; it is never stored in plaintext and cannot be shown again.",
  );
} else if (command === "list") {
  console.log(
    JSON.stringify(
      database
        .prepare(
          "SELECT id,name,scopes,active,rate_limit_per_hour AS rateLimitPerHour,created_at AS createdAt,last_used_at AS lastUsedAt FROM api_keys ORDER BY created_at DESC",
        )
        .all(),
      null,
      2,
    ),
  );
} else if (command === "revoke") {
  const id = process.argv[3];
  if (!id) throw new Error("Usage: npm run api:v1:key -- revoke <id>");
  const result = database
    .prepare("UPDATE api_keys SET active=0 WHERE id=?")
    .run(id);
  if (!result.changes) throw new Error("API key was not found.");
  console.log(JSON.stringify({ id, active: false }));
} else {
  console.log(`Usage:
  npm run api:v1:key -- create "Key name" [read,write,admin] [rateLimitPerHour]
  npm run api:v1:key -- list
  npm run api:v1:key -- revoke <id>`);
}

database.close();
