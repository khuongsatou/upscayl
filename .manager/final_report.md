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

## 2026-08-24 Banana-Upscale API Integration

| Field | Value |
|---|---|
| PM Verdict | Done / Production Go |
| Scope | Tach Banana va Upscale, giao tiep hai chieu chi qua versioned HTTP API |

## Summary

- Banana so huu `bbmcp_` key, shared quota, usage, MCP va dashboard; Upscale so huu upload/job/worker/progress/ETA/cancel/result/TTL.
- Hai dich vu khong chia se repo, DB, JSON store, Docker volume, source import hoac filesystem path.
- Banana Platform API introspection/quota/events, 5 MCP Upscale tools, Upscale dual-auth/internal API va persistent idempotent outbox dang hoat dong production.
- Production E2E qua MCP va public REST deu tao/download PNG that; outbox 9/9 delivered, khong event pending.
- Banana `0.1.44` khop exact source SHA `0086835`; Upscale release `20260824-banana-api2` khop code SHA `8caeade`.

## Migration

- `bbmcp_` la key chinh cho Banana/MCP/Upscale.
- Legacy `up_` van hoat dong trong cua so dual-auth; chi retire sau khi client cu da migrate va metric xac nhan khong con su dung.
- Anonymous same-origin Upscale web duoc giu rieng va da verify.

## 2026-08-24 VPS Synchronization

| Field | Value |
|---|---|
| PM Verdict | Done / Production Go |
| Scope | Dong bo Banana Platform API/MCP va xac minh Upscale production |

## Summary

- Banana Pro `0.1.46`, commit `be09e6176314c9a19541f24515da7f3d6cb88860`, da duoc rebuild va recreate rieng container `banana-pro` sau khi backup `/opt/banana-pro`.
- Banana health, Platform API service auth, key introspection va MCP session initialization deu pass; `tools/list` tra du 5 Upscale tools.
- Canary `bbmcp_` da duoc revoke sau smoke test; MCP tra 401 va introspection tra `active=false` sau revoke.
- Upscale release `20260824-banana-api2` van active; internal health pass, queue rong va outbox `9/9` delivered, `0` pending.
- Public `bb/upscale` va API health tra 200; route cu `veo3/upscale` tiep tuc redirect 308 sang `bb/upscale`.
- `profile-pro` va `mtips5s_verify` van absent/stopped theo operational hold.

## Operational Note

- VPS giu mot server-specific read-only mount cho file model watermark trong `docker-compose.yml`; thay doi dong thoi nay duoc bao ton, khong bi rsync ghi de.

## 2026-08-24 Banana MCP Upscale Boundary

| Field | Value |
|---|---|
| PM Verdict | Done / Production Go |
| Scope | Dam bao MCP Upscale ben Banana chi qua API, khong coupling voi runtime Upscale |

## Summary

- Banana MCP Upscale da duoc xac minh la adapter HTTP rieng, khong import source, khong mount volume, khong doc SQLite/file runtime cua Upscale.
- Production Banana da duoc rebuild/recreate de dong bo `flowkit-socket-service.cjs` co `localToolsHandler` va `transformResponse`.
- MCP config production advertise endpoint chuan `https://bb.1nutnhan.com/mcp`.
- `/mcp` production sau handshake tra 47 tools, gom du 5 tool `upscale_*`; `upscale_get_job` smoke duoc xu ly local va tra loi tu Upscale API.
- `/api/mcp/upscale` production tra OK voi Upscale health `ok`, queue rong.

## Remaining Risk

- Chua chay MCP upload/create anh that trong lan smoke nay de khong tao workload; local contract va production REST/Upscale canary da cover duong xu ly anh.

## 2026-08-24 Agent Support APIs

| Field | Value |
|---|---|
| PM Verdict | Done / Production Go |
| Scope | Public metadata APIs va README cho AI agent/MCP adapter |

## Summary

- Them public `GET /agent/manifest` va `GET /agent/workflow` vao Upscale API v1 de agent discover contract ma khong doc source/runtime.
- Them README `docs/upscale-agent-api-readme.md` voi hard boundary, flow, auth, MCP mapping va retry rules.
- Production release `20260824-agent-api` dang active; manifest/workflow public smoke pass va `api:v1:status` OK.

## Remaining Risk

- Agent support APIs la metadata read-only; upload/create/download production workload van nen smoke rieng khi can test end-to-end bang key that.

## 2026-08-24 Web Checkpoint and Background Processing

| Field | Value |
|---|---|
| PM Verdict | Done / Production Go |
| Scope | Browser checkpoint, auto-resume va background server processing |

## Summary

- Sau khi job duoc tao, web luu checkpoint khong chua secret/anh/path; dong hoac reload tab khong cancel worker tren VPS.
- Mo lai trang tu dong poll job cu, khoi phuc progress/ETA va tai result; loi mang/429/5xx duoc retry, terminal state xoa checkpoint.
- UI chi thong bao co the dong trang sau khi checkpoint da luu; Stop van cancel explicit va Electron khong doi.
- Production release `20260824-checkpoint-bg`, code SHA `88405937c9f4f918e348c3630ad305c1675a2d98`, active voi health 200, queue rong va `NRestarts=0`.
- Canary production xac nhan client tao job roi thoat, client moi resume job succeeded va tai PNG 11,483 bytes; public bundle/browser console deu pass.

## Remaining Risk

- Anonymous checkpoint resume can cung client IP; doi IP hoac xoa site data se mat lien ket browser, nhung server job khong bi huy va result van theo TTL 24 gio.

## 2026-08-24 Software Vulkan Auto Detect

| Field | Value |
|---|---|
| PM Verdict | Done / Production Go |
| Scope | Auto-detect llvmpipe/lavapipe runtime env for web worker |

## Summary

- Web worker now supports `UPSCAYL_API_SOFTWARE_VULKAN=auto|always|never`.
- Linux auto mode enables Mesa software Vulkan only when no accessible render node is available or software driver env is already preset.
- Health response reports the selected mode, active state and reason, so deploy can verify whether CPU software Vulkan is active.
- Service template and API docs now include the option.
- Production release `20260824-software-vulkan-auto` is active; health reports `auto` software Vulkan active through `lvp`, and a real public upscale job returned a 624,031-byte PNG.

## Remaining Risk

- CPU-only software Vulkan is operational but still throughput-limited; run the planned performance profile before increasing traffic or queue/concurrency.

## 2026-08-24 CPU llvmpipe Performance Guardrail

| Field | Value |
|---|---|
| PM Verdict | Done / Production Go |
| Scope | Benchmark CPU llvmpipe and protect production queue from oversized jobs |

## Summary

- Production benchmark confirmed CPU llvmpipe is slow: 125x120 scale4 took 56.2s; 500x261 scale2 took 425s.
- A 960x540 scale2 benchmark was canceled cleanly after ETA rose above 2,000s, validating that larger jobs should not run on this CPU-only VPS.
- Production now uses `UPSCAYL_API_ESTIMATED_MS_PER_MEGAPIXEL=800000` and `UPSCAYL_API_MAX_OUTPUT_PIXELS=2500000`.
- `/api/v1/models` exposes the 2.5MP limit and oversized 1080p scale2 jobs are rejected before spawning `upscayl-bin`.

## Remaining Risk

- This protects the current VPS but does not make it fast; GPU/separate-worker scale work remains needed before serving larger images or higher concurrency.

## 2026-08-24 Dependency Security Hardening

| Field | Value |
|---|---|
| PM Verdict | Done with Follow-up |
| Scope | Reduce production-scope npm advisories without breaking major upgrades |

## Summary

- `npm audit fix --omit=dev` reduced production-scope audit from 25 advisories, including 2 critical, to 6 high and 0 critical/moderate.
- Local `tsc`, `web:build` and full `build` passed after lockfile changes.
- Updated lockfile was deployed to the active VPS release; remote `npm install`, `web:build`, service restart and health checks passed.

## Remaining Risk

- The remaining 6 high advisories require breaking upgrades for Electron, exiftool-vendored and eslint-config-next. Do not force them without a dedicated desktop/web compatibility pass.

## 2026-08-24 Production Status Command

| Field | Value |
|---|---|
| PM Verdict | Done |
| Scope | Secret-free production status smoke command |

## Summary

- Added `npm run api:v1:status` to check public health, worker queue, runtime software Vulkan, model limits and legacy redirect.
- The command passes locally and on the active VPS release, reporting queue 0/0, software Vulkan active and `maxOutputPixels=2500000`.

## Remaining Risk

- It intentionally avoids secrets, so internal Banana/outbox checks remain a separate server-side operator action.

## 2026-08-24 Operations Roadmap Gates

| Field | Value |
|---|---|
| PM Verdict | Done |
| Scope | Document gates for remaining migration, dependency and scale work |

## Summary

- Added `docs/upscale-operations-roadmap.md` with the current production baseline, legacy cleanup gates, major dependency upgrade gates and scale strategy gates.
- Linked it from the API guide and synced it to the active VPS release.

## Remaining Risk

- These are governance gates, not execution of the future major tasks. The remaining work should be launched only when logs, metrics and compatibility windows are available.

## 2026-08-24 Upscale Page Blank Hotfix

| Field | Value |
|---|---|
| PM Verdict | Done / Production Go |
| Scope | Restore public page rendering at `https://bb.1nutnhan.com/upscale` |

## Summary

- The page was serving HTML built without `/upscale` basePath, so CSS/JS pointed at root `/_next` and the app did not hydrate.
- Production was rebuilt with `UPSCAYL_WEB_BASE_PATH=/upscale` and now serves `/upscale/_next` assets.
- Added `web:build:upscale` and upgraded `api:v1:status` to fail on this asset-base regression.
- Browser smoke confirmed the full UI renders with no console errors or failed requests.

## Remaining Risk

- None known for this bug after the production smoke; keep using `npm run api:v1:status` after each deploy.

## 2026-08-24 Onboarding Default Off

| Field | Value |
|---|---|
| PM Verdict | Done |
| Scope | Tat auto-open modal `Welcome to Upscayl`, them entry mo lai trong Settings |

## Summary

- Onboarding dialog khong con tu doc `localStorage.showOnboarding` de bat mac dinh; state mo dialog mac dinh la `false`.
- Settings co nut `Get Started` de nguoi dung chu dong mo lai onboarding.
- Local `/upscale` da verify khong hien welcome modal khi reload; Settings manual open pass; typecheck va production web build pass.

## Remaining Risk

- Chua deploy production cho thay doi UI nay; local dev va build artifact da pass.

## 2026-08-24 Next Vendor Chunk Hotfix

| Field | Value |
|---|---|
| PM Verdict | Done |
| Scope | Prevent mixed Next dev/build artifact from breaking web production server chunks |

## Summary

- Tach Next web output: dev vao `.next-web-dev`, production build/start vao `.next-web`, Electron/export khong doi.
- Web build scripts clean `.next-web` truoc build de tranh stale server chunks.
- Da tai hien loi 500 missing `lucide-react.js` tren artifact cu; sau fix `next start` `/upscale` tra 200, asset basePath dung, local dev 3047 cung tra 200.

## Remaining Risk

- Chua deploy production cho hotfix nay; can rebuild/restart VPS bang script moi de production nhan `.next-web`.

## 2026-08-24 Default Scale 2X

| Field | Value |
|---|---|
| PM Verdict | Done |
| Scope | Doi default UI/API scale ve 2X de tranh loi output qua lon |

## Summary

- UI default scale moi la 2X; scale cu 4X trong localStorage duoc migrate mot lan ve 2X.
- API create job thieu `scale` fallback 2; OpenAPI/docs/agent README da cap nhat.
- Local UI hien `Image Scale (2X)`, API smoke tao job khong scale tra `scale=2`, typecheck va web build pass.

## Remaining Risk

- Chua deploy production cho thay doi nay; production can rebuild/restart sau khi gom cung hotfix web chunk.

## 2026-08-25 VPS Sync

| Field | Value |
|---|---|
| PM Verdict | Done / Production Go |
| Scope | Sync local fixes to VPS production web route |

## Summary

- Deployed release `/opt/mtips5s-upscale/releases/20260825-default-scale-webfix` and switched `/opt/mtips5s-upscale/current`.
- Production now uses separated Next web build dir `.next-web`, avoiding mixed dev/build vendor chunks.
- Public status passed: health OK, worker idle, page assets use `/upscale/_next`, legacy `veo3` redirect remains 308.
- Production API default scale smoke passed with `scale=2`.

## Remaining Risk

- Dependency audit warnings remain as previously tracked major-upgrade/security-hardening backlog; deploy did not change that risk class.

## 2026-08-25 Local Mac Processing Option

| Field | Value |
|---|---|
| PM Verdict | Done locally |
| Scope | Add opt-in local Mac processing route for web upscaling |

## Summary

- Added a Settings toggle, default off, to route web upscale jobs to a configurable local Mac API endpoint.
- Web upload/job/poll/result/cancel now use the selected endpoint and checkpoint stores that endpoint for resume safety.
- Local bridge CORS/auth is limited to loopback host plus configured trusted Origins.
- Schema, TypeScript, production web build, local bridge API smoke and Settings UI smoke all pass.

## Remaining Risk

- Production `bb.1nutnhan.com/upscale` will not show the new toggle until the validated changes are synced to VPS.

## 2026-08-25 Queue Tab

| Field | Value |
|---|---|
| PM Verdict | Done locally |
| Scope | Add sidebar Queue tab for multi-image sequential upscaling |

## Summary

- Added a new Queue tab between Upscayl and Settings with multi-image enqueue, Add current image, Start/Pause/Stop, retry/remove, search, filter and pagination.
- Queue processes images one by one through the existing single-image upscale command so each row gets its own 0-100 progress and terminal status.
- Home viewer progress is isolated from Queue jobs to avoid the main before/after surface reacting to background queue events.
- Local schema, TypeScript, production web build, browser UI, multi-select/search/filter/pagination and Start/Stop smoke all pass.

## Remaining Risk

- Full long-running queue completion was not executed in QA; local worker progress/cancel path was verified.

## 2026-08-25 Queue Support APIs

| Field | Value |
|---|---|
| PM Verdict | Done locally |
| Scope | Add Queue-oriented API helpers for UI and agents |

## Summary

- Added `/api/v1/queue/*` helper endpoints for summary, searchable/filterable/pageable job rows, bulk single-job creation, multi-cancel and retry.
- Queue bulk create reuses existing upload/job ownership, auth, rate limits, output pixel checks and worker queue, while avoiding partial creation when any image is invalid.
- Agent manifest/workflow, human docs, agent README, OpenAPI and contract smoke script now document the Queue helpers.
- Local smoke through the loopback bridge passed for create/list/summary/cancel/retry.

## Remaining Risk

- Not deployed to VPS yet; production `bb.1nutnhan.com/upscale/api/v1/queue/*` will not exist until the next sync.

## 2026-09-01 Local Mac Processing Completion

| Field | Value |
|---|---|
| PM Verdict | Done / Production Go |
| Scope | Persistent Mac worker + production web routing |

## Summary

- Mac worker is installed as a LaunchAgent, starts at login, restarts on exit and listens only on `127.0.0.1:3047`.
- Production web release `20260901-local-mac` contains the Local Mac toggle and routes jobs to the configured endpoint without silent VPS fallback.
- Real Mac arm64 E2E passed: health, upload, create, native processing and PNG download.

## Remaining Risk

- Queue long-run and Safari coverage are follow-up QA; worker and single-image path are production-ready.

## 2026-09-02 Log Manager

| Field | Value |
|---|---|
| PM Verdict | Done / Production Go |
| Scope | Log Manager beneath Stats |

## Summary

- Production now includes a Log Manager below Stats with search, level filter, count, copy, TXT export and clear actions.
- Logs persist locally, are capped at 500 entries and basic API key/token patterns are redacted before storage.
- Release `20260902-log-manager` is active; page HTTP 200, API health OK and VPS queue idle.

## Remaining Risk

- Structured source/timestamp metadata and automated UI interaction tests are future hardening; current message-based log viewer is operational.

## 2026-09-02 Log Manager Enrichment

- Log entries now include ISO timestamp and runtime source, with independent source filtering and source labels in the list.
- Clear requires confirmation; persistence, retention, copy and export remain enabled.
- Production release `20260902-log-manager-v2` is active and health/page smoke passed.

## 2026-09-02 Log Manager Structured Entries

- Log Manager now uses typed entries with id, ISO timestamp, source, level and message.
- Existing string logs are normalized automatically; Settings support log viewer and email export remain compatible.
- Production release `20260902-log-manager-v3` is active with page/API smoke passing.

## 2026-09-02 Queue Image Preview

- Queue items now open an inline preview region when selected, showing the original image and completed result side by side.
- Keyboard selection is supported; preview state includes status/progress and does not interrupt queue processing.
- Production release `20260902-queue-preview` is active with page/API smoke passing.

## Remaining Risk

- UI labels are still English hardcoded in the new manager; localization pass and automated browser interaction tests remain follow-up.

## Remaining Risk

- Metadata remains encoded in the message string rather than a fully typed object; automated browser interaction coverage is still follow-up.

## 2026-09-01 Local Mac Status Label

- Production Settings now polls the configured loopback health endpoint every 10 seconds and shows `Mac local: Online`, `Offline`, `Checking...`, or `Tắt`.
- The label is client-side health evidence from the user's Mac; VPS health remains independently visible through the API status endpoint.
- TypeScript/schema checks pass and the status UI is deployed in release `20260901-local-status`.

## 2026-09-02 Banana MCP Upscale Expansion

| Field | Value |
|---|---|
| PM Verdict | Implemented / Banana release pending |
| Scope | Expand Banana MCP Upscale capabilities |

## Summary

- Banana MCP now covers health, model discovery, single-job lifecycle, result cleanup, and queue summary/list/create/cancel/retry.
- Calls remain authenticated with the caller's `bbmcp_` key and relay through the Upscale public API.
- Upscale agent manifest and docs advertise the expanded catalog.

## Validation

- Banana `precheck` passed; adapter tests passed 5/5.

## Next Step


## Deployment Update

- Banana Pro container rebuilt and restarted on VPS; `/api/health` reports `ok`, extension/socket ready and MCP public auth enabled.
- Unauthenticated `/mcp` smoke returned HTTP 401 as expected. Authenticated tool smoke requires a valid `bbmcp_` key and was not attempted without one.

## PM Verdict

Done / Deployed; authenticated live tool smoke remains an operational follow-up requiring a real key.

## 2026-09-02 Queue Show In Main Viewer

| Field | Value |
|---|---|
| PM Verdict | Ready for production sync |
| Scope | Per-queue-item eye action opening the main image viewer |

## Summary

- Every queue item now has an eye icon with accessible label/tooltip.
- Original images open in the main Select an Image viewer; completed results populate the existing comparison slider automatically.
- Queue selection and processing remain isolated from the show action.

## Validation

- `npm run tsc`, `npm run validate-schema`, `npm run web:build:upscale`, and `git diff --check` passed.

## Production

- Release `20260902-queue-show-main-viewer` is active on VPS.
- `upscayl-web` is active; API health reports database/storage/worker OK and page returns HTTP 200.
- VPS disk pressure was resolved by removing obsolete release artifacts; 35 GB remains available after cleanup.

## PM Verdict

Done / Production Go.
