# Upscale Agent API README

This file is for MCP servers, AI agents, and automation workers that need to use
MTips5s Upscale without coupling to the Upscale runtime.

## Hard boundary

Agents must use either:

- Banana MCP at `https://bb.1nutnhan.com/mcp`
- Upscale public API v1 at `https://bb.1nutnhan.com/upscale/api/v1`

Agents must not read or mount Upscale source, SQLite databases, Docker volumes,
runtime folders, job output folders, or service env files. Treat upload IDs, job
IDs and result URLs as opaque API values.

## Discovery APIs

Use these unauthenticated metadata endpoints before implementing a client:

```text
GET /agent/manifest
GET /agent/workflow
```

`/agent/manifest` returns the current base URL, endpoint map, auth header,
accepted key prefixes, MCP tool names, model IDs, service limits, terminal
statuses, retryable HTTP codes and documentation pointers.

`/agent/workflow` returns the ordered flow an agent should follow:

1. Discover contract.
2. Check health and model limits.
3. Upload image bytes.
4. Create async job with an idempotency key.
5. Poll job status until terminal.
6. Download result if succeeded.
7. Cancel only when the user explicitly asks to stop.

Example:

```bash
curl https://bb.1nutnhan.com/upscale/api/v1/agent/manifest
curl https://bb.1nutnhan.com/upscale/api/v1/agent/workflow
```

## Auth

All processing endpoints require:

```text
X-API-Key: <bbmcp_or_up_key>
```

Use Banana-managed `bbmcp_` keys for MCP/agent work. Legacy `up_` keys exist
only for migration. Never log, print, save, or return raw API keys to users.

## Processing Flow

Upload one image:

```bash
curl -H "X-API-Key: $UPSCAYL_API_KEY" \
  -F "file=@image.png;type=image/png" \
  https://bb.1nutnhan.com/upscale/api/v1/uploads
```

Create a job from the returned upload ID:

```bash
curl -H "X-API-Key: $UPSCAYL_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: agent-job-001" \
  -d '{
    "mode": "single",
    "uploadIds": ["UPLOAD_UUID"],
    "model": "upscayl-standard-4x",
    "scale": 2,
    "outputFormat": "png"
  }' \
  https://bb.1nutnhan.com/upscale/api/v1/jobs
```

Poll:

```bash
curl -H "X-API-Key: $UPSCAYL_API_KEY" \
  https://bb.1nutnhan.com/upscale/api/v1/jobs/JOB_UUID
```

Terminal statuses are `succeeded`, `failed`, `canceled` and `expired`.
Successful jobs include `result.url`; download that URL with the same API key.

Cancel only on explicit user request:

```bash
curl -X DELETE -H "X-API-Key: $UPSCAYL_API_KEY" \
  https://bb.1nutnhan.com/upscale/api/v1/jobs/JOB_UUID
```

Closing a browser tab, worker, or MCP connection must not cancel a job. Once
`POST /jobs` returns a job ID, the Upscale server owns processing and the agent
should checkpoint the job ID and resume polling later.

## Queue Helper Flow

When an agent needs a Queue screen or per-image rows, prefer these API helpers
instead of reading storage or inferring state:

```text
GET /queue/summary
GET /queue/jobs?q=<search>&status=queued,processing&page=1&limit=20
POST /queue/jobs
POST /queue/jobs/cancel
POST /queue/jobs/{jobId}/retry
```

`POST /queue/jobs` accepts the same model/scale/output options as `POST /jobs`
plus multiple `uploadIds`, and creates one `single` job per upload ID so each
image has independent progress from 0-100%. Use `Idempotency-Key` when retrying
bulk creation; the API scopes each item under that key.

`GET /queue/jobs` returns `inputFileNames`, `pagination.total`,
`pagination.totalPages`, status, progress, ETA, result and error metadata for
each row. Use `POST /queue/jobs/cancel` only when the user explicitly stops jobs.
Use `POST /queue/jobs/{jobId}/retry` only for terminal jobs.

## Banana MCP Tool Mapping

Banana exposes these local MCP tools, all backed by the Upscale public API:

| MCP tool | Upscale API |
|---|---|
| `upscale_upload` | `POST /uploads` |
| `upscale_create_job` | `POST /jobs` |
| `upscale_get_job` | `GET /jobs/{jobId}` |
| `upscale_cancel_job` | `DELETE /jobs/{jobId}` |
| `upscale_download_result` | `GET /jobs/{jobId}/result` |

The MCP adapter relays the caller's `bbmcp_` key in memory only.

## Retry Rules

- Retry temporary network errors, 408, 409 result-not-ready, 429, and 5xx with
  backoff.
- Use `Idempotency-Key` when retrying job creation.
- Do not retry invalid auth, forbidden ownership, unsupported image type,
  missing upload, or output pixel limit errors without changing inputs.

## Related Contracts

- Public OpenAPI: `docs/upscale-api-v1.openapi.yaml`
- Internal read-only API: `docs/upscale-internal-api-v1.openapi.yaml`
- Human operations guide: `docs/upscale-api-v1.md`
