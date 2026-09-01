# Test Report

| Field | Value |
|---|---|
| Date | 2026-08-23 |
| Tester | QA Tester |
| Status | Pass |

## Checks

- Kiem tra du cau truc thu muc `.agent`, `.manager`, `.feedback`.
- Kiem tra `.feedback/qa_coverage.json` la JSON hop le.
- Khong chay app/build vi task chi bootstrap tai lieu van hanh.

## Residual Risk

- Chua co test app runtime vi khong thay doi code ung dung.

## 2026-08-23 Web Runtime Refactor

| Command | Result |
|---|---|
| `npm run tsc` | Pass |
| `npm run build` | Pass |
| `npm run web:build` | Pass |
| `npm run web:start -- -p 3030` | Pass, serving `http://localhost:3030` |
| `curl -I http://localhost:3030` | Pass, HTTP 200 |

## Residual Risk

- Web adapter expects an upscale backend at `NEXT_PUBLIC_UPSCAYL_WEB_API_URL` or `/api/upscayl`; this refactor does not implement server-side NCNN processing.
- Manual browser file-selection QA was not completed beyond HTTP render verification.

## 2026-08-23 Playwright Stability Check

| Check | Result |
|---|---|
| Desktop web render at `http://localhost:3030` | Pass |
| Mobile web render at 390x844 | Pass |
| Single image browser file picker and preview | Pass |
| Settings tab after image selection | Pass |
| Web output fallback | Pass, `web-output://download` |
| Upscayl click without backend | Pass, concise controlled 404 toast |
| Batch folder picker with `webkitdirectory` | Pass |
| Error boundary check | Pass, no app error boundary |
| Screenshot evidence | `/tmp/upscayl-web-desktop.png`, `/tmp/upscayl-web-mobile.png` |

## Fixes From QA

- Removed browser crash in Settings caused by assuming `navigator.userAgent` contains `Upscayl/<version>`.
- Added a browser output fallback so web jobs are not blocked by missing desktop file paths.
- Normalized web backend HTML/404 errors into a concise message.

## 2026-08-23 Web Upscale Backend

| Check | Result |
|---|---|
| `npm run tsc` | Pass |
| `npm run web:build` | Pass |
| `npm run build` | Pass |
| Direct single API call | Pass, `/tmp/upscayl-api-output.bin` PNG 1024x1024 |
| Direct double API call | Pass, `/tmp/upscayl-double-output.png` PNG 512x512 |
| Direct batch API call | Pass, `/tmp/upscayl-batch-output.zip` contains 2 PNG outputs |
| Playwright single UI flow | Pass, original blob 256x256 and output blob 1024x1024 |
| Playwright batch UI flow | Pass, done state visible and no backend 404 |
| Web abort/Stop server process check | Pass, aborted request returns `AbortError` and no `upscayl-bin` process remains |
| Error boundary / console errors | Pass, none in Playwright backend UI flow |

## Notes

- `npm run build` logs a Next warning that static export disables API routes. This is expected for Electron, because desktop uses IPC; web server mode uses `npm run web:*`.

## 2026-08-23 Rescan After Backend Implementation

| Check | Result |
|---|---|
| Code scan: API payload validation | Hardened scale, compression, custom width, tile size, GPU ID |
| Code scan: upload validation | Hardened to PNG/JPG/JPEG/WEBP only |
| Code scan: batch zip filenames | Hardened to strip internal upload UUID prefixes |
| `npm run tsc` | Pass |
| `npm run web:build` | Pass |
| Direct single API call | Pass, PNG 1024x1024 |
| Direct batch API call | Pass, zip contains `to_upscale.png` and `download.png` |
| Invalid scale API call | Pass, rejected before spawn |
| Invalid file API call | Pass, rejected before spawn |
| Playwright UI single + batch backend flow | Pass, no console errors or error boundary |
| `npm run build` | Pass |

## 2026-08-24 VPS Deployment QA

| Check | Result |
|---|---|
| Local `npm run tsc` | Pass |
| Linux production web build with `/upscale` base path | Pass |
| Nginx config test and reload | Pass |
| systemd service | Active, enabled, zero unexpected restarts |
| Public page, CSS and JavaScript | Pass, HTTP 200 over HTTPS |
| Public API route | Pass, GET rejected with HTTP 405 |
| Real VPS upscale | Pass, 128x128 PNG -> 512x512 PNG in about 7.8 seconds |
| Concurrent request protection | Pass, one HTTP 200 and one HTTP 429 |
| Process cleanup | Pass, no lingering `upscayl-bin` process |
| Browser UI smoke test | Pass, title and main controls visible, no console warning/error |
| Service memory during smoke test | Peak about 580 MB |

## Residual Risk

- VPS khong co GPU vat ly; Vulkan chay bang CPU `llvmpipe`, nen anh lon va double/batch se cham.
- `npm audit --omit=dev` con 25 advisory (4 moderate, 19 high, 2 critical), phan lon qua dependency Firebase/Electron; can task nang cap dependency rieng.
- Public upscale endpoint chua co authentication; concurrency duoc gioi han mot job nhung van co nguy co bi lam dung tai nguyen.

## 2026-08-24 Web Progress QA

| Check | Result |
|---|---|
| `npm run tsc` | Pass |
| Production web build with `/upscale` base path | Pass locally and on VPS |
| Single progress | Pass, observed 0, 2, 4, 6, 8, 11, 13, 15, 17, 25, 50, 100 |
| Single output | Pass, 128x128 PNG -> 512x512 PNG |
| Double progress | Pass, monotonic 0-100 across two passes |
| Double output | Pass, 32x32 PNG -> 512x512 PNG |
| Batch progress | Pass, monotonic 0-100 across two images |
| Batch output | Pass, zip contains both expected PNG files |
| Abort during model load | Pass, stopped at 6 percent with error state and no child process left |
| Browser smoke test | Pass, public route renders and has no console warning/error |
| VPS service | Active, zero unexpected restarts |

## 2026-08-24 Non-blocking Progress Bar QA

| Check | Result |
|---|---|
| `npm run tsc` | Pass |
| Production web build | Pass locally and on VPS |
| Desktop visual state | Pass, compact 50px bar does not cover the image |
| Pointer events | Pass, outer wrapper none and inner controls auto |
| Interaction during job | Pass, switched to Settings while progress and Stop remained visible |
| Stop control | Pass, icon button has localized accessible label and tooltip |
| Public API regression | Pass, HTTP 200 PNG output after deploy |
| Public browser smoke | Pass, app visible with no console warning/error |
| Responsive implementation | Base class is full viewport; desktop sidebar offset starts at `md` |

## Residual Risk

- Browser viewport override did not resize the final Chrome window to 390px, so final mobile visual screenshot was not available; responsive constraints are present in the built CSS.

## 2026-08-24 Web Upscale ETA QA

| Check | Result |
|---|---|
| `npm run tsc` | Pass |
| `npm run web:build` | Pass |
| `npm run build` | Pass; locale schema valid |
| Local API job | Pass; ETA `null` before native progress, then 29s -> 1s -> 0 |
| Local UI English | Pass; `Time remaining --:--` -> `Time remaining 00:15` |
| Local UI Vietnamese | Pass; `Con khoang --:--` -> `Con khoang 00:27` -> `00:26` |
| UI console | Pass; no warning/error |
| VPS staging job | Pass; PNG 500x480, ETA updated while running |
| Public production job | Pass; HTTP 200 PNG 256x244, ETA present and done at 0 |
| Production service | Active, zero unexpected restarts, public HTTP 200 |

## Residual Risk

- ETA la du doan tu toc do cac tile da xong, nen co the tang/giam khi tile sau co chi phi khac.
- Truoc sample native dau tien UI hien `--:--` de tranh uoc tinh sai tu progress mo phong.

## 2026-08-24 Upscale Route Migration QA

| Check | Result |
|---|---|
| DNS `bb.1nutnhan.com` | Pass; cung VPS voi domain cu |
| TLS `bb.1nutnhan.com` | Pass; certificate dung hostname va con han |
| `nginx -t` | Pass truoc reload |
| `GET https://bb.1nutnhan.com/upscale` | HTTP 200 |
| Static JavaScript asset | HTTP 200 |
| API guard without job ID | HTTP 400 dung contract |
| Real API job via new domain | HTTP 200; PNG 128x120 |
| `bb.1nutnhan.com/` | Van HTTP 200 tu backend hien co |
| Old page/API URL | HTTP 308 toi `bb`, giu path va query |
| Upscale service | Active; khong restart khi reload Nginx |

## Residual Risk

- Redirect 308 duoc giu de client cu chuyen dan sang domain moi; xoa route cu can mot dot migration rieng neu muon.

## 2026-08-24 Model Comparison Image Hotfix QA

| Check | Result |
|---|---|
| Reproduction before fix | Confirmed, 14/14 thumbnail images had natural width 0 |
| Correct public asset path | Pass, `/upscale/model-comparison/...` returns HTTP 200 WebP |
| `npm run tsc` | Pass |
| `npm run web:build` | Pass |
| `npm run build` | Pass, expected static-export API warning only |
| Local Playwright thumbnails | Pass, 14/14 loaded |
| Local Playwright zoom | Pass, 2/2 loaded |
| Production Playwright thumbnails | Pass, 14/14 loaded, none pending/broken |
| Production Playwright zoom | Pass, 2/2 loaded |
| Production console | Pass, no warning/error |
| VPS service | Active after release switch |

## 2026-08-24 Upscale API v1 QA

| Check | Result |
|---|---|
| `npm run tsc` | Pass |
| `npm run web:build` | Pass |
| `npm run build` + locale schema | Pass; chi co static-export warning da biet cho Electron |
| `git diff --check` | Pass |
| Rule Splitting File | Pass; `worker.ts` 433 dong, `progress.ts` 117 dong |
| OpenAPI YAML parse | Pass |
| Final local `npm run api:v1:test` | Pass; upload, validation, idempotency, status, result, history, delete |
| API key scope | Pass; read key GET 200, write 403 |
| Rate limit | Pass; limit 1 cho response 200 roi 429 `RATE_LIMIT_EXCEEDED` |
| Revoke | Pass; truoc revoke 200, sau revoke 401 |
| Single/double/batch | Pass; PNG 500x480, PNG 2000x1920, ZIP hai output |
| Queue/ownership | Pass; queue full 429, key khac nhan 404 |
| Cancel/process cleanup | Pass; processing -> canceled, khong con `upscayl-bin` |
| Restart recovery/TTL | Pass; processing duoc recover, succeeded -> expired va output duoc xoa |
| Legacy adapter | Pass; progress GET, PNG 500x480, deprecation/sunset/successor headers |
| Production page/health/models | HTTP 200 qua `https://bb.1nutnhan.com/upscale` |
| Production auth | Khong key 401; bootstrap key contract pass |

## 2026-08-24 Banana MCP Upscale Boundary QA

| Check | Result |
|---|---|
| Banana `npm run check` | Pass |
| Banana targeted MCP/API tests | Pass, 32/32 tests |
| Banana coupling scan | Pass, khong thay direct Upscale DB/file/source/volume reference |
| Production deploy Banana | Pass, container `banana-pro` recreated va `/api/health` OK |
| Production MCP config | Pass, `/api/mcp/config` HTTP 200, auth required |
| Production MCP advertised endpoint | Pass, `https://bb.1nutnhan.com/mcp` |
| Production MCP handshake + tools/list | Pass, session OK, 47 tools, du 5 tool `upscale_*` |
| Production MCP local tool call | Pass, `upscale_get_job` handled local va tra `JOB_NOT_FOUND` tu Upscale API cho job smoke khong ton tai |
| Production Banana upscale dashboard | Pass, `/api/mcp/upscale` HTTP 200, Upscale health `ok`, queue `queued=0`, `processing=0` |
| Production smoke key cleanup | Pass, `activeSmokeKeys=0` sau revoke |
| Upscale production status | Pass, `npm run api:v1:status` OK; page asset dung `/upscale/_next`, queue rong |

## Residual Risk

- Smoke khong upload/xu ly anh that qua MCP de tranh tao workload production khong can thiet; contract upload/create/result da duoc cover bang local tests va cac production canary truoc.

## 2026-08-24 Agent Support APIs QA

| Check | Result |
|---|---|
| `npm run tsc` | Pass |
| `node --check scripts/test-upscale-api-v1.js` | Pass |
| OpenAPI YAML parse | Pass |
| `npm run web:build:upscale` local | Pass |
| Local `GET /upscale/api/v1/agent/manifest` | Pass, service `mtips5s-upscale`, 5 MCP tools |
| Local `GET /upscale/api/v1/agent/workflow` | Pass, 7 workflow steps |
| VPS build `web:build:upscale` | Pass |
| Production release switch | Pass, active `/opt/mtips5s-upscale/releases/20260824-agent-api` |
| Production `GET /agent/manifest` | Pass, base URL `https://bb.1nutnhan.com/upscale/api/v1`, limit `2500000` |
| Production `GET /agent/workflow` | Pass, steps discover/preflight/upload/create_job/poll/download/cancel |
| `npm run api:v1:status` | Pass, health OK, page assets OK, queue rong |
| Production anonymous web | Same-origin upload/job/result pass, khong can public key |
| Production browser | Pass; progress 4.97% -> 32.20%, ETA 00:37 -> 00:25, output Before/After hien thi, console sach |
| Final `api-v1d` production contract | Pass sau khi tach module progress/ETA |
| Production cancel | Pass; processing -> canceled, binary clean |
| Controlled service restart | Pass; cung job recover ve processing, sau do cancel sach |
| Persistence | SQLite/WAL/SHM ton tai trong state dir 0750, owner `upscayl` |
| systemd/Nginx | Service active, `NRestarts=0`, `nginx -t` pass, khong warning/error journal |
| Route compatibility | `bb` root van 200; domain cu redirect 308 va giu path/query |

## Residual Risk

- VPS dung CPU `llvmpipe`; anh lon, double va batch van cham va queue concurrency co chu dich la 1.
- ETA la du doan theo workload va duoc hieu chinh theo native progress; model, noi dung anh va tai may co the lam sai lech.
- `node:sqlite` tren Node 22 van phat ExperimentalWarning, du API contract va persistence da pass.

## 2026-08-24 Banana-Upscale API Integration

| Check | Result |
|---|---|
| Banana Platform/MCP/Admin unit-contract suite | PASS; full Banana `0.1.44` suite 386/386 |
| Banana `npm run check` including integration precheck | PASS |
| Upscale `npm run web:build` | PASS |
| HTTP contract: bbmcp introspect/upload/create/cancel/internal API | PASS |
| Outbox Banana-down + Upscale restart + recovery delivery | PASS |
| Terminal DB-update/crash gap startup reconciliation | PASS |
| Production public API real upscale | PASS, PNG 624,031 bytes |
| Production MCP upload/create/poll/download | PASS, PNG 163,638 bytes |
| Production MCP tools/list | PASS, 47 tools including 5 Upscale tools |
| Production outbox | PASS, 9/9 delivered, 0 pending |
| Dual auth / anonymous web | PASS: legacy `up_` 200; same-origin fake upload reaches validation 400 |
| Revoked `bbmcp_` canary | PASS: MCP 401 and Upscale 401 |
| Raw service/API keys printed or persisted by new code | NOT OBSERVED; hashes/secret env only |

Production service keys duoc provision trong secret env mode 0600; rollback source, env, SQLite va release symlink da duoc giu. PP/OTP hold khong bi thay doi.

## 2026-08-24 Web Checkpoint and Background Processing QA

| Check | Result |
|---|---|
| Checkpoint pure tests | Pass 9/9: parse, save, load, mismatch-safe clear, expiry, invalid command/ID, storage failure |
| `npm run tsc` | Pass |
| `npm run validate-schema` | Pass, 20 locale files valid |
| `npm run web:build` | Pass locally and on VPS |
| Production release build | Pass after using writable build HOME/cache for system user |
| Safe cutover | Pass; waited for existing user job to finish before atomic symlink switch |
| Public page/API health | HTTP 200 |
| Background worker canary | Pass; create client exited, separate client later observed processing then succeeded |
| Reconnect/result | Pass; HTTP 200 result, 11,483-byte real PNG |
| Served browser bundle | Contains checkpoint storage key, resume logic and localized background label |
| Production browser | Main UI visible; no console warning/error |
| Final service | Active, `NRestarts=0`, queue 0/0, no warning/error journal |
| Integration outbox | 9 total, 0 pending |
| PP/OTP operational hold | Preserved; containers remain absent/stopped |

## Residual Risk

- Anonymous web ownership hien gan theo client IP; neu IP thay doi giua luc dong va mo lai trang, server se khong tra job cu va checkpoint se duoc xoa an toan.
- Browser checkpoint bi mat neu nguoi dung xoa site data/localStorage; server job van chay va result van ton tai den TTL 24 gio.

## 2026-08-24 Software Vulkan Auto Detect QA

| Check | Result |
|---|---|
| `npm run tsc` | Pass |
| `npm run web:build` | Pass |
| `npm run build` | Pass, expected static-export API warning only |
| Local health smoke on macOS | Pass; reports `mode=always`, `active=false`, `reason=unsupported_platform` when forced, so non-Linux is not mutated |
| VPS release build | Pass; `npm run web:build` in `/opt/mtips5s-upscale/releases/20260824-software-vulkan-auto` |
| Production cutover | Pass; `current` points to `20260824-software-vulkan-auto`, service active, `NRestarts=0` |
| Production health | Pass; `softwareVulkan.mode=auto`, `active=true`, `reason=no_accessible_render_node`, `icdPath=/usr/share/vulkan/icd.d/lvp_icd.x86_64.json` |
| Real production upscale | Pass; job `61654912-567b-4594-a400-287e819b4d68`, PNG output 624,031 bytes |
| Process cleanup | Pass; no `upscayl-bin` process remains after job completion |
| Journal audit | Pass; no `upscayl-web` warning/error entries in the post-cutover window |

## Residual Risk

- CPU-only software Vulkan remains slow for larger images; performance profiling and ETA tuning are still separate follow-up work.

## 2026-08-24 CPU llvmpipe Performance Guardrail QA

| Check | Result |
|---|---|
| Small production benchmark | Pass; 125x120 scale4 job `3eeadda8-58e5-4423-afec-b22593e3eeef`, 56.2s, 624,031-byte PNG |
| Medium production benchmark | Pass; 500x261 scale2 job `e4582f09-b0a6-464f-bd41-631690ace1fe`, 425s, 238,866-byte PNG |
| Large benchmark abort | Pass; 960x540 scale2 job `f546baa1-89a3-4e91-8e85-b236e202750c` canceled at 19.37%, final status `canceled` |
| Service env | Pass; `UPSCAYL_API_ESTIMATED_MS_PER_MEGAPIXEL=800000`, `UPSCAYL_API_MAX_OUTPUT_PIXELS=2500000` active |
| `/api/v1/models` limits | Pass; reports `maxOutputPixels=2500000` |
| Oversized create guard | Pass; 1080p scale2 rejected with `OUTPUT_PIXEL_LIMIT_EXCEEDED` before spawn |
| Final health/process/log | Pass; queue 0/0, no `upscayl-bin` process, no warning/error journal entries |

## Residual Risk

- CPU-only throughput remains low; 0.52 output MP took about 7 minutes, so scale strategy still requires GPU or a separate worker before raising limits/concurrency.

## 2026-08-24 Dependency Security Hardening QA

| Check | Result |
|---|---|
| Initial `npm audit --omit=dev` | 25 total: 4 moderate, 19 high, 2 critical |
| `npm audit fix --omit=dev` | Applied; package-lock updated with non-breaking/transitive fixes |
| Local `npm run tsc` | Pass |
| Local `npm run web:build` | Pass |
| Local `npm run build` | Pass, expected static-export warnings only |
| Post-fix production-scope audit | 6 high, 0 critical, 0 moderate |
| VPS install/build | Pass; `npm install` and `npm run web:build` in active release |
| VPS health/logs | Pass; health ok, queue 0/0, service active, `NRestarts=0`, no warning/error journal entries |

## Residual Risk

- Remaining 6 high advisories require breaking/major upgrades: Electron 43, exiftool-vendored 37, and eslint-config-next 16. These need a separate desktop/web compatibility task before force-upgrading.

## 2026-08-24 Production Status Command QA

| Check | Result |
|---|---|
| Local `npm run api:v1:status` | Pass; reports health ok, queue 0/0, software Vulkan active, 2.5MP limit and 308 legacy redirect |
| Local `npm run tsc` | Pass |
| VPS `npm run api:v1:status` | Pass in active release |
| Service state after sync | Pass; `upscayl-web` active, `NRestarts=0` |

## Residual Risk

- Status command uses public endpoints only; internal outbox/Banana service-key checks still require authenticated server-side commands.

## 2026-08-24 Operations Roadmap Gates QA

| Check | Result |
|---|---|
| Roadmap file | Pass; `docs/upscale-operations-roadmap.md` created |
| API guide link | Pass; `docs/upscale-api-v1.md` links to roadmap |
| VPS sync | Pass; roadmap present in active release |
| Service state after doc sync | Pass; `upscayl-web` active, `NRestarts=0` |

## Residual Risk

- Roadmap defines gates; actual legacy cleanup, Electron/exiftool major upgrade and GPU/separate-worker scale work remain future tasks pending metrics and compatibility windows.

## 2026-08-24 Upscale Page Blank Hotfix QA

| Check | Result |
|---|---|
| Reproduction | Confirmed; `/upscale` HTML referenced root `/_next/...` assets before fix |
| Asset root check | Pass after rebuild; HTML has `/upscale/_next` and no root `/_next` asset refs |
| Public asset | Pass; `/upscale/_next/static/chunks/main-76078f1737a7dc6b.js` HTTP 200 |
| Browser render | Pass; Playwright body text includes full Upscayl UI, 12 buttons, no console errors or request failures |
| `npm run api:v1:status` | Pass locally and on VPS; includes `pageAssets.hasExpectedAssets=true`, `hasRootNextAssets=false` |
| `npm run web:build:upscale` | Pass locally |
| `npm run tsc` | Pass |
| VPS service | Pass; `upscayl-web` active, `NRestarts=0`, no warning/error journal entries |

## Residual Risk

- Future production builds must use `web:build:upscale` or set `UPSCAYL_WEB_BASE_PATH=/upscale`; the status command now catches this regression before handoff.

## 2026-08-24 Onboarding Default Off QA

| Check | Result |
|---|---|
| `npm run tsc` | Pass |
| `git diff --check` scoped UI files | Pass |
| Local browser reload `/upscale` | Pass; `openDialogCount=0`, welcome text not visible |
| Settings manual open | Pass; Settings shows `Get Started`, clicking it opens `Welcome to Upscayl` dialog |
| Reset local tab state | Pass; reload returns to `openDialogCount=0` |
| `UPSCAYL_TARGET=web UPSCAYL_WEB_BASE_PATH=/upscale npm run web:build:upscale` | Pass |

## Residual Risk

- Settings uses existing localized onboarding strings, so no new locale key was added. The control is clear enough but label/button copy can be polished later if product wants a distinct "Open onboarding" phrase.

## 2026-08-24 Next Vendor Chunk Hotfix QA

| Check | Result |
|---|---|
| Reproduce on old artifact | Pass; `next start` port 3057 returned `GET /upscale` 500 with missing `./chunks/vendor-chunks/lucide-react.js` |
| `UPSCAYL_TARGET=web UPSCAYL_WEB_BASE_PATH=/upscale npm run web:build:upscale` | Pass; builds into `renderer/.next-web` |
| Artifact scan | Pass; no stale `vendor-chunks/lucide-react` require remains in `.next-web/server` |
| Production start smoke | Pass; `next start` port 3057 returned `GET /upscale` 200 |
| Asset path smoke | Pass; HTML assets use `/upscale/_next/...` |
| Local dev restart | Pass; `GET http://127.0.0.1:3047/upscale` returned 200 using `.next-web-dev` |
| `npm run tsc` | Pass |
| `git diff --check` scoped files | Pass |

## Residual Risk

- Existing broken `renderer/.next` may remain locally until clean, but web scripts now use `.next-web`/`.next-web-dev` and no longer depend on it.

## 2026-08-24 Default Scale 2X QA

| Check | Result |
|---|---|
| `npm run tsc` | Pass |
| `git diff --check` scoped files | Pass |
| Search stale scale defaults | Pass; no API/UI default `4` remains, only selectable scale references |
| Local UI no stored scale | Pass; browser text shows `Image Scale (2X)` |
| API create job without `scale` | Pass; returned `scale=2`, job canceled immediately |
| `UPSCAYL_TARGET=web UPSCAYL_WEB_BASE_PATH=/upscale npm run web:build:upscale` | Pass |

## Residual Risk

- Migration intentionally lowers stored `scale=4` once. Users who truly want 4X can select it again after the migration flag is set.

## 2026-08-25 VPS Sync QA

| Check | Result |
|---|---|
| Pre-deploy health | Pass; active old release `20260824-agent-api`, worker queue 0/0 |
| Remote `npm install` | Pass; install completed, audit warnings remain as known dependency backlog |
| Remote `npm run tsc` | Pass |
| Remote `web:build:upscale` | Pass; built into `.next-web` |
| Stale vendor chunk scan | Pass; no `chunks/vendor-chunks/lucide-react` reference in `.next-web/server` |
| Release switch | Pass; current -> `/opt/mtips5s-upscale/releases/20260825-default-scale-webfix` |
| Service restart | Pass; `upscayl-web` active, `NRestarts=0` |
| `npm run api:v1:status` | Pass; health OK, queue 0/0, page assets `/upscale/_next`, legacy redirect 308 |
| Agent manifest | Pass; service `mtips5s-upscale`, 5 MCP tools |
| Production API default scale | Pass; create job without `scale` returned `scale=2`, then canceled |
| Journal audit | Pass; no module missing/error in post-deploy window; known SQLite ExperimentalWarning only |

## Residual Risk

- VPS is still CPU-only llvmpipe with `maxOutputPixels=2500000`; throughput remains intentionally limited.

## 2026-08-25 Local Mac Processing Option QA

| Check | Result |
|---|---|
| `npm run validate-schema` | Pass; all 20 locale files valid |
| `npm run tsc` | Pass |
| `UPSCAYL_TARGET=web UPSCAYL_WEB_BASE_PATH=/upscale npm run web:build:upscale` | Pass |
| `git diff --check` scoped feature files | Pass |
| Local bridge CORS preflight | Pass; OPTIONS from `https://bb.1nutnhan.com` to loopback returned 204 and allow-origin |
| Local bridge upload/create/cancel | Pass; upload 201, create 202, cancel 200 without API key from production Origin, `scale=2`, `mode=single` |
| Local browser `/upscale` render | Pass; main UI rendered and `Image Scale (2X)` visible |
| Settings default off | Pass; `USE LOCAL MAC PROCESSING` visible and endpoint input hidden before toggle |
| Settings toggle on | Pass; endpoint input appears with `http://127.0.0.1:3047/upscale/api/v1` |
| Reset after UI smoke | Pass; toggle turned off again in local test tab |

## Residual Risk

- Feature has passed local and build validation but has not been deployed to VPS in this task entry yet.

## 2026-08-25 Queue Tab QA

| Check | Result |
|---|---|
| `npm run validate-schema` | Pass; all locale files valid with `QUEUE` namespace |
| `npm run tsc` | Pass |
| `UPSCAYL_TARGET=web UPSCAYL_WEB_BASE_PATH=/upscale npm run web:build:upscale` | Pass |
| `git diff --check` scoped queue files | Pass |
| Browser tab order | Pass; tabs show `Upscayl`, `Queue`, `Settings` |
| Empty Queue UI | Pass; Queue empty state and pagination render |
| Multi-select enqueue | Pass; adding 6 local image fixtures shows `6 queued` |
| Pagination | Pass; 6 items at page size 5 shows `Page 1 / 2` |
| Search/filter | Pass; search `icon` and filter `queued` keep matching queued image rows visible |
| Start/Stop smoke | Pass; first item entered processing, reached 6%, Stop marked it canceled and left 5 items queued |

## Residual Risk

- Full completion of a large queue was not run to avoid tying up the local worker; start/progress/cancel and build-level regressions were validated.

## 2026-08-25 Queue Support APIs QA

| Check | Result |
|---|---|
| `npm run tsc` | Pass |
| `npm run validate-schema` | Pass |
| OpenAPI YAML parse | Pass; `docs/upscale-api-v1.openapi.yaml` parsed |
| `UPSCAYL_TARGET=web UPSCAYL_WEB_BASE_PATH=/upscale npm run web:build:upscale` | Pass |
| `git diff --check` scoped API/docs files | Pass |
| Local Queue API smoke | Pass; upload 2 images, `POST /queue/jobs` created 2 jobs |
| Queue list/search/filter/page | Pass; `GET /queue/jobs?q=baboon&status=queued,processing&page=1&limit=10` returned page 1 and matching row |
| Queue summary | Pass; `GET /queue/summary` returned totals/status counts |
| Multi-cancel | Pass; `POST /queue/jobs/cancel` returned 2 job states |
| Retry terminal job | Pass; canceled job retried through `POST /queue/jobs/{jobId}/retry`, retry job canceled after smoke |

## Residual Risk

- Authenticated production smoke was not run for `/queue/*` yet; local loopback bridge smoke and build validation passed.

## 2026-09-01 Local Mac Processing Completion QA

| Check | Result |
|---|---|
| Mac arm64 LaunchAgent install | Pass; service running |
| Local health/models | Pass; health 200, binary/models present |
| Local E2E real image | Pass; upload 201, create 202, processing succeeded, PNG result 163445 bytes |
| Production deploy | Pass; release `20260901-local-mac` active and service active |
| Production page/toggle | Pass; `/upscale` 200 and Local Mac toggle present |
| Production API health | Pass; database/worker/runtime healthy, queue 0 |

## Residual Risk

- Queue full completion and Safari-specific browser QA remain follow-up coverage; single-image browser-to-Mac path is verified.
