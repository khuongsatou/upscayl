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
    "scale": 4,
    "outputFormat": "png"
  }' \
  https://bb.1nutnhan.com/upscale/api/v1/jobs
```

Poll `GET /jobs/{jobId}` until `status` is terminal. Successful jobs contain `result.url`. Cancel with `DELETE /jobs/{jobId}` and delete an output early with `DELETE /jobs/{jobId}/result`.

The full contract is in [upscale-api-v1.openapi.yaml](./upscale-api-v1.openapi.yaml).
Banana reads cross-principal health, queue and job state only through the
read-only [Upscale Internal API](./upscale-internal-api-v1.openapi.yaml).

Against a running non-production server, the contract smoke suite can be run with:

```bash
UPSCAYL_API_TEST_URL=http://127.0.0.1:3042/api/v1 \
UPSCAYL_API_TEST_KEY=test-api-key \
npm run api:v1:test
```

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

The legacy `/api/upscayl` endpoint remains a synchronous compatibility adapter over the same queue. It returns `Deprecation`, `Sunset`, and successor-version headers.
