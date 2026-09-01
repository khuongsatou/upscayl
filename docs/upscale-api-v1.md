# MTips5s Upscale API v1

Base URL:

```text
https://bb.1nutnhan.com/upscale/api/v1
```

External API clients authenticate with `X-API-Key`. Banana-managed `bbmcp_`
keys are introspected through the versioned Banana Platform API; Upscale never
reads Banana files, volumes, or databases. Legacy local `up_` keys remain during
the dual-auth migration. The public Upscayl page uses a same-origin anonymous
principal with its own rate limit and does not expose an operator key in browser
JavaScript.

## Create an API key

Run on the API host as the service user so the command opens the production database:

```bash
sudo -u upscayl env UPSCAYL_API_DATA_DIR=/var/lib/mtips5s-upscale-api \
  npm run api:v1:key -- create "Integration name" read,write 10000
```

The plaintext `apiKey` is printed once. Store it in the calling system's secret manager. List or revoke keys with:

```bash
npm run api:v1:key -- list
npm run api:v1:key -- revoke <key-id>
```

## Typical flow

Upload an image:

```bash
curl -H "X-API-Key: $UPSCAYL_API_KEY" \
  -F "file=@image.png;type=image/png" \
  https://bb.1nutnhan.com/upscale/api/v1/uploads
```

Queue a job using the returned upload ID:

```bash
curl -H "X-API-Key: $UPSCAYL_API_KEY" \
  -H "Idempotency-Key: order-123-image-1" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "single",
    "uploadIds": ["UPLOAD_UUID"],
    "model": "upscayl-standard-4x",
    "scale": 2,
    "outputFormat": "png"
  }' \
  https://bb.1nutnhan.com/upscale/api/v1/jobs
```

Poll `GET /jobs/{jobId}` until `status` is terminal. Successful jobs contain `result.url`. Cancel with `DELETE /jobs/{jobId}` and delete an output early with `DELETE /jobs/{jobId}/result`.

## Queue helper APIs

For UI or agents that need per-image queue rows, use the `/queue/*` helper
endpoints. They do not bypass the normal upload/job ownership rules; they only
wrap existing job behavior in Queue-friendly calls.

Create one single-image job for each upload ID:

```bash
curl -H "X-API-Key: $UPSCAYL_API_KEY" \
  -H "Idempotency-Key: queue-run-001" \
  -H "Content-Type: application/json" \
  -d '{
    "uploadIds": ["UPLOAD_UUID_1", "UPLOAD_UUID_2"],
    "model": "upscayl-standard-4x",
    "scale": 2,
    "outputFormat": "png"
  }' \
  https://bb.1nutnhan.com/upscale/api/v1/queue/jobs
```

List queue rows with search, filter and page pagination:

```bash
curl -H "X-API-Key: $UPSCAYL_API_KEY" \
  "https://bb.1nutnhan.com/upscale/api/v1/queue/jobs?q=icon&status=queued,processing&page=1&limit=20"
```

Other Queue helpers:

- `GET /queue/summary` returns total, active and per-status counts.
- `POST /queue/jobs/cancel` with `{ "jobIds": ["JOB_UUID"] }` cancels multiple jobs.
- `POST /queue/jobs/{jobId}/retry` creates a new job from a terminal job's original upload and settings.

Creating a job hands processing off to the persistent server worker. Closing the
HTTP connection, hiding a browser tab, or closing the Upscayl page does not
cancel that job. Clients should checkpoint the returned `jobId` and reconnect
with `GET /jobs/{jobId}`; only an explicit `DELETE /jobs/{jobId}` requests
cancellation.

The public web app stores a versioned browser checkpoint containing only the
job ID, command and timestamps. It never stores the source image, filesystem
path, or API credential. On reload it automatically restores polling,
progress/ETA and the completed result, then clears the checkpoint when the job
reaches a terminal state.

The full contract is in [upscale-api-v1.openapi.yaml](./upscale-api-v1.openapi.yaml).
Banana reads cross-principal health, queue and job state only through the
read-only [Upscale Internal API](./upscale-internal-api-v1.openapi.yaml).
Agents can discover the machine-readable workflow with `GET /agent/manifest`
and `GET /agent/workflow`; implementation rules are in
[upscale-agent-api-readme.md](./upscale-agent-api-readme.md).

Against a running non-production server, the contract smoke suite can be run with:

```bash
UPSCAYL_API_TEST_URL=http://127.0.0.1:3042/api/v1 \
UPSCAYL_API_TEST_KEY=test-api-key \
npm run api:v1:test
```

Production readiness can be checked without secrets:

```bash
npm run api:v1:status
```

The status command reads public health, public model limits and the legacy route
redirect, and verifies that the public page references `/upscale/_next` assets
instead of root `/_next` assets. Override `UPSCAYL_STATUS_BASE_URL`,
`UPSCAYL_STATUS_APP_URL` or `UPSCAYL_STATUS_LEGACY_URL` for staging or local
checks.

Remaining migration, dependency and scale gates are tracked in
[upscale-operations-roadmap.md](./upscale-operations-roadmap.md).

## Runtime and persistence

- SQLite database and job data: `/var/lib/mtips5s-upscale-api`
- Worker concurrency: 1
- Maximum queued/processing jobs: 20
- Upload limit: 25 MB per image
- Batch limit: 10 images
- Predicted output limit: 50 megapixels per image
- Job timeout: 60 minutes
- Result TTL: 24 hours
- Processing jobs return to `queued` when the service starts after interruption
- Banana quota/lifecycle delivery uses a persistent idempotent SQLite outbox
- Banana auth failure is fail-closed for `bbmcp_`; existing jobs remain owned and processed by Upscale
- Fallback ETA is derived from output workload at 160,000 ms per megapixel; tune
  `UPSCAYL_API_ESTIMATED_MS_PER_MEGAPIXEL` for the production CPU/GPU profile
- The current CPU-only VPS service template overrides the generic defaults with
  `UPSCAYL_API_MAX_OUTPUT_PIXELS=2500000` and
  `UPSCAYL_API_ESTIMATED_MS_PER_MEGAPIXEL=800000` because llvmpipe benchmark
  runs showed 0.52 output megapixels taking about 425 seconds.
- Linux software Vulkan detection is controlled by `UPSCAYL_API_SOFTWARE_VULKAN`:
  `auto` enables llvmpipe/lavapipe spawn env only when no accessible `/dev/dri/renderD*`
  node is available, `always` forces it, and `never` disables it. When active,
  the worker sets software Mesa env vars and uses an `lvp` Vulkan ICD if found.
  `GET /health` reports the selected mode, active state and reason.

The legacy `/api/upscayl` endpoint remains a synchronous compatibility adapter over the same queue. It returns `Deprecation`, `Sunset`, and successor-version headers.
