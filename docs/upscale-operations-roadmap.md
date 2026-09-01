# Upscale Operations Roadmap

This roadmap records the remaining production gates after the API v1,
software-Vulkan and CPU guardrail releases.

## Current Production Baseline

- Public app/API: `https://bb.1nutnhan.com/upscale`
- Legacy route: `https://veo3.1nutnhan.com/upscale` redirects to `bb`
- Active release: `20260824-software-vulkan-auto`
- Worker profile: CPU-only Mesa llvmpipe/lavapipe
- Worker concurrency: 1
- Production output limit: 2.5 output megapixels
- Production ETA fallback: 800,000 ms per output megapixel
- Secret-free smoke command: `npm run api:v1:status`

## Legacy Migration Cleanup

Do not remove legacy behavior until all gates pass:

- `veo3` redirect access logs show no meaningful traffic for at least 7 days.
- Legacy `up_` key usage is zero or tied only to known internal smoke tests.
- Banana/MCP clients use `bbmcp_` keys and pass upload/create/poll/download.
- Bootstrap/operator keys have been rotated and old canary keys revoked.
- A rollback note exists for restoring the old redirect/key path if needed.

Cleanup order:

1. Announce the sunset date to known internal clients.
2. Revoke unused legacy `up_` keys.
3. Keep `veo3` redirect for one additional observation window.
4. Remove or narrow the redirect only after logs confirm no active clients.

## Major Dependency Upgrade Gate

The remaining production-scope audit items require breaking upgrades. Do not run
`npm audit fix --force` directly on production.

Upgrade candidates:

- Electron 43.x for Electron/extract-zip advisories.
- exiftool-vendored 37.x for argument-injection hardening.
- eslint-config-next 16.x for the remaining glob advisory.

Required validation:

- Desktop `npm run build` and Electron launch on macOS.
- Web `npm run web:build` and production-style `web:start`.
- API contract smoke for upload/create/status/result/cancel.
- Model comparison images and web checkpoint resume flow.
- Exif metadata copy flow with paths containing spaces.

## Scale Strategy Gate

The current CPU-only VPS is protected but not fast. Raise limits or concurrency
only after one of these paths is chosen:

- Move worker to a GPU host while keeping API v1 stable.
- Add a separate worker service that pulls from the same queue with strict
  ownership, storage and cancel/recovery semantics.
- Keep CPU-only mode and treat it as a small-image demo tier.

Before increasing limits:

- Benchmark small, medium and large jobs on the target hardware.
- Tune `UPSCAYL_API_ESTIMATED_MS_PER_MEGAPIXEL`.
- Recheck `UPSCAYL_API_MAX_OUTPUT_PIXELS`.
- Verify cancel kills the native process group.
- Verify restart recovery, result TTL cleanup and Banana outbox delivery.
