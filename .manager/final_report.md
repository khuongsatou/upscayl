# Final Report

| Field | Value |
|---|---|
| Date | 2026-08-23 |
| PM Verdict | Done |
| Scope | Bootstrap `.agent`, `.manager`, `.feedback` |

## Summary

- Da tao bo van hanh du an theo phong IT voi PM la dau moi.
- Da them UX/Customer Reviewer de danh gia giao dien va chuc nang.
- Da them Rule Splitting File va cac rule/workflow thong dung de ho tro bao tri, QA, release va feedback.

## Remaining Risk

- Day la bo template van hanh; cac task sau can cap nhat state thuc te theo tung viec.

## 2026-08-23 Web Runtime Refactor

| Field | Value |
|---|---|
| PM Verdict | Done |
| Scope | Add browser/web runtime support without changing UI |

## Summary

- Renderer now uses a shared runtime bridge instead of direct `window.electron` calls.
- Electron behavior is preserved through the existing preload API.
- Browser mode can run with `npm run web:dev` or production `web:build`/`web:start`.
- Web upscale requests are posted to a configurable backend endpoint while image preview uses browser File APIs.

## Remaining Risk

- The browser runtime requires a real `/api/upscayl` or `NEXT_PUBLIC_UPSCAYL_WEB_API_URL` implementation to perform NCNN upscaling.

## 2026-08-23 Web Upscale Backend

| Field | Value |
|---|---|
| PM Verdict | Done |
| Scope | Implement local web upscale backend |

## Summary

- `/api/upscayl` now performs real local NCNN upscaling for web single, double, and batch jobs.
- Web UI receives image blobs for single/double and zip blobs for batch.
- Validation covered direct API calls, Playwright UI flows, web build, and Electron/static build.

## Remaining Risk

- Production deployment still needs to run on hosts that include compatible `resources/<platform>/bin/upscayl-bin`, model files, and GPU/Vulkan support.

## 2026-08-24 VPS Web Deployment

| Field | Value |
|---|---|
| PM Verdict | Go with limitations |
| Scope | Deploy Upscayl web tai `https://veo3.1nutnhan.com/upscale` |

## Summary

- HTTPS route, Next service va native Linux upscale backend dang hoat dong.
- Giao dien duoc giu nguyen va browser smoke test khong co console error.
- systemd tu dong khoi dong lai service; Nginx giu nguyen cac route hien co cua domain.
- Real API smoke test tao thanh cong anh PNG 512x512 tu input 128x128.

## Remaining Risk

- Chi co Vulkan CPU `llvmpipe`, khong phu hop workload anh lon hoac nhieu nguoi dung.
- Endpoint public chua co authentication/rate limit theo danh tinh.
- Production dependency audit van con advisory high/critical va can duoc xu ly trong dot hardening rieng.

## 2026-08-24 Web Progress Reporting

| Field | Value |
|---|---|
| PM Verdict | Done |
| Scope | Live 0-100 progress for web upscale jobs |

## Summary

- Public web UI now shows progress during model loading and native image processing.
- Single, double, batch and abort paths passed VPS smoke tests.
- Release `20260824-progress2` is active; previous releases remain available for rollback.

## 2026-08-24 Non-blocking Progress Bar

| Field | Value |
|---|---|
| PM Verdict | Done |
| Scope | Replace blocking upscale overlay with an interactive progress bar |

## Summary

- Upscale progress no longer blocks the image or application controls.
- The compact bar retains live percentage and Stop behavior.
- Release `20260824-nonblocking-progress` is active on the public route.

## 2026-08-24 Model Comparison Image Hotfix

| Field | Value |
|---|---|
| PM Verdict | Done |
| Scope | Restore Select AI Model comparison images on web |

## Summary

- Runtime-aware public asset URLs preserve Electron and fix the `/upscale` web route.
- All thumbnail and zoom images passed production Playwright validation.
- Release `20260824-model-images` is active and previous release remains available for rollback.

## 2026-08-24 Web Upscale ETA

| Field | Value |
|---|---|
| PM Verdict | Done |
| Scope | Add estimated remaining time to web upscale progress |

## Summary

- Web progress bar now shows a localized remaining-time estimate after the first native tile sample.
- ETA counts down every second and is recalibrated by later tile progress for single, double and batch jobs.
- Electron keeps its existing percentage payload and UI behavior.
- Production release `20260824-eta2` is active; public API and browser smoke tests passed.

## Remaining Risk

- ETA is approximate because tile cost can vary by image content, model and host load.
- The VPS still uses CPU `llvmpipe`; large images remain slow even though progress is now easier to understand.

## 2026-08-24 Upscale Route Migration

| Field | Value |
|---|---|
| PM Verdict | Done |
| Scope | Move public Upscayl route from `veo3` to `bb` |

## Summary

- `https://bb.1nutnhan.com/upscale` is now the active public page and API route.
- Existing `bb` root, WebSocket, certificate and health behavior are preserved.
- Old `veo3` page/API paths return HTTP 308 to the matching `bb` URL.
- Nginx config, public assets and a real upscale request passed production QA.

## Remaining Risk

- Keep the old redirect until external bookmarks and integrations have migrated to `bb`.

## 2026-08-24 Upscale API v1

| Field | Value |
|---|---|
| PM Verdict | Done / Release Go |
| Scope | Async Upscale REST API v1, web migration and production deployment |

## Summary

- API v1 tai `https://bb.1nutnhan.com/upscale/api/v1` da hoat dong voi API key/scopes/rate limit, SQLite queue, persistent jobs, cancel, result/history, TTL cleanup va restart recovery.
- Browser same-origin dung cung API ma khong lo operator key; Electron IPC va legacy synchronous endpoint duoc giu tuong thich.
- Progress khong con dung khi binary im lang; production hien percentage va ETA dem nguoc, sau do tra anh Before/After.
- Release `20260824-api-v1d` dang active, systemd `NRestarts=0`, Nginx pass, khong job/binary treo va khong warning/error journal.
- OpenAPI, huong dan, key CLI va contract smoke script da duoc ban giao trong repo.

## Remaining Risk

- CPU-only `llvmpipe` gioi han throughput; concurrency 1 va queue 20 la guardrail co chu dich.
- ETA chi la uoc tinh va can tune `UPSCAYL_API_ESTIMATED_MS_PER_MEGAPIXEL` neu doi hardware/model profile.
- Can tiep tuc giu route redirect cu trong giai doan migration va xoay bootstrap key theo chinh sach van hanh.
