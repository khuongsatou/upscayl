# Implementation Notes

## 2026-08-23

- Tao `.agent/README.md` va cac folder `skills/`, `rules/`, `workflows/`.
- Tao 8 skills: PM, PO, Architect, Developer, Code Reviewer, QA, UX/Customer, DevOps.
- Tao 13 rules, gom rule bat buoc va rule thong dung duoc de xuat.
- Tao 12 workflows, gom workflow bat buoc va workflow thong dung duoc de xuat.
- Tao `.manager/` state files va `.feedback/` templates.

## File Splitting Map

- `.agent/skills/*.md`: tach theo vai tro phong IT.
- `.agent/rules/*.md`: tach theo quy tac van hanh/quality gate.
- `.agent/workflows/*.md`: tach theo luong xu ly task lap lai.

## 2026-08-23 Web Runtime Refactor

- Them `renderer/lib/app-runtime.ts` lam adapter chung cho Electron va browser.
- Them `renderer/lib/image-src.ts` de giu nguyen `blob:`, `data:`, `http(s):` URL tren web va chi dung `file:///` cho file path desktop.
- Doi renderer components/hooks tu `window.electron` sang `appRuntime` ma khong doi JSX layout.
- Them `web:dev`, `web:build`, `web:start` scripts va `UPSCAYL_TARGET=web` cho Next server build.
- Them `off` vao Electron preload de hook cleanup co contract day du.

## 2026-08-23 Web Upscale Backend

- Them `renderer/pages/api/upscayl.ts` lam Next API route Node cho web target.
- API parse multipart bang `formidable`, validate default model/output format, luu upload vao temp dir.
- API goi `resources/<platform>/bin/upscayl-bin` voi `resources/models`.
- Single/double tra image stream; batch zip output bang `archiver` `ZipArchive`.
- API noi request abort/response close vao child process de Stop tren web khong de lai `upscayl-bin` treo.
- Them dependencies server-side `formidable` va `archiver`.
- Khong import Electron main/preload vao API route de giu dependency boundary.

## 2026-08-24 VPS Web Deployment

- Them web-only `basePath` de phuc vu app tai `/upscale` ma khong anh huong Electron export.
- Gioi han mot web upscale job chay dong thoi de bao ve VPS 4 GB RAM.
- Them `deploy/upscayl-web.service` de quan ly Next server tai `127.0.0.1:3030` bang systemd.
- Them cau hinh Nginx route `/upscale` va `/upscale/*`, giu nguyen backend hien co tai cong `17311`.
- Cai Vulkan Mesa tren VPS; backend dung `llvmpipe` CPU vi may khong co GPU vat ly.
- Release duoc dat tai `/opt/mtips5s-upscale/releases/20260824-web`, symlink `current` ho tro rollback.

## 2026-08-24 Web Progress Reporting

- Browser tao UUID cho moi job va poll `GET /api/upscayl?jobId=...` trong khi POST dang xu ly.
- Backend parse phan tram that tu stdout/stderr cua `upscayl-bin` va giu state progress ngan han trong bo nho.
- Giai doan binary im lang khi nap model duoc bieu dien bang progress 0-20; sau do chuyen sang tile progress native.
- Double va batch progress duoc quy doi thanh mot dai don dieu 0-100 cho toan job.
- Progress poll va POST dung chung abort signal, nen Stop van huy child process va khong de job treo.

## 2026-08-24 Non-blocking Progress Bar

- Thay loading overlay toan bo main content bang mot progress bar gon o day viewport.
- Wrapper dung `pointer-events-none`; chi thanh progress va nut Stop dung `pointer-events-auto`.
- Them native progress element, phan tram monospace va nut Stop icon co aria-label/title.
- Thanh tu can theo sidebar tren desktop va dung full viewport duoi breakpoint `md`.
- Giu khoa nut bat dau job moi trong khi cac tab, settings va noi dung phia sau van tuong tac duoc.

## 2026-08-24 Model Comparison Image Hotfix

- Them `toPublicAssetSrc` de map public asset theo runtime.
- Electron tiep tuc dung `public:///`; web dung base path `/upscale` duoc expose tu Next config.
- Thay URL cho ca thumbnail Before/After va anh zoom cua tat ca model.
- Them accessible title va bo description warning cho dialog model/zoom.

## 2026-08-24 Web Upscale ETA

- Backend luu `startedAt` va completion estimate cho tung job; chi bat dau uoc tinh tu progress native, bo qua progress mo phong khi nap model.
- Completion estimate duoc lam muot qua cac tile va API tra `estimatedRemainingSeconds` dong theo thoi gian.
- Web runtime poll moi 1 giay, phat ETA rieng de giu nguyen progress string cua Electron.
- Progress bar web hien `--:--` truoc sample that, sau do dem nguoc `MM:SS`/`HH:MM:SS`.
- Them `ETA_LABEL` cho tat ca locale; tieng Viet hien `Con khoang`.
- Release production: `20260824-eta2`.

## 2026-08-24 Upscale Route Migration

- Them `deploy/bb.1nutnhan.com.conf` tu server block dang chay va chen route uu tien `/upscale` toi `127.0.0.1:3030`.
- Giu nguyen backend `/` port 8110, WebSocket `/ws` port 9322, TLS va health check cua `bb`.
- Doi hai route `/upscale` tren `veo3` thanh redirect 308 toi `bb`, giu nguyen path/query/method.
- Backup Nginx truoc cutover tai `/etc/nginx/route-backups/20260824-upscale-to-bb`.
- `nginx -t` pass truoc graceful reload; khong restart web service.

## 2026-08-24 Upscale API v1

- Them catch-all route `renderer/pages/api/v1/[...route].ts` va tach backend theo module auth, config, database, validation, storage, service, worker, error va type trong `renderer/server/upscale-api/`.
- Cung cap health, models, upload, create/list/get/cancel job, download va xoa result; job persist bang SQLite WAL voi recovery sau restart.
- API key duoc bam SHA-256, co scope, hourly rate window, revoke CLI; browser same-origin dung anonymous principal rieng va khong lo key operator.
- Worker concurrency 1, queue 20, timeout 60 phut, process-group cancel, idempotency, ownership isolation, magic-byte/image-dimension validation, 50 MP guard va cleanup TTL.
- Web runtime chuyen sang upload -> create -> poll -> result/cancel; Electron IPC khong doi. `/api/upscayl` cu tro thanh compatibility adapter tren cung queue.
- Them OpenAPI 3.1, huong dan, CLI key va contract script; systemd luu state tai `/var/lib/mtips5s-upscale-api` va doc secret root-only tu `/etc/mtips5s-upscale/api.env`.
- Sua default browser API URL de ton trong base path `/upscale`; successor link cua legacy endpoint cung dung base path.
- Worker ETA co fallback theo workload output khi binary im lang: progress van tang toi 95%, ETA co ngay tu luc processing va native sample van duoc dung de hieu chinh.
- Production release hien tai: `/opt/mtips5s-upscale/releases/20260824-api-v1d`; cac release `api-v1c`, `api-v1b`, `api-v1`, `eta2` duoc giu de rollback.

## File Splitting Map - Upscale API v1

- API routing: `renderer/pages/api/v1/[...route].ts` -> `renderer/server/upscale-api/handler.ts`.
- Domain/persistence: `service.ts`, `database.ts`, `types.ts`, `errors.ts`.
- Runtime/pipeline: `worker.ts`, `progress.ts`, `storage.ts`, `image-info.ts`, `config.ts`.
- Boundary/security: `auth.ts`, `validation.ts`.

## 2026-08-24 Banana-Upscale API Integration

- Banana va Upscale giu repo/database/runtime/release rieng; khong co import source, shared JSON/SQLite/volume.
- `banana-client.ts` introspect `bbmcp_` qua Banana Platform API voi cache ngan, timeout va fail-closed; local `up_` dual-auth va anonymous same-origin duoc giu de migration.
- Job Banana reserve quota truoc khi enqueue; reservation ID va usage units duoc persist trong SQLite job.
- `service_outbox` persist lifecycle event va quota complete/release, retry exponential, dedupe bang event ID; restart recovery tao lai event/release cho processing job da nhan cancel.
- Internal API read-only `/api/internal/v1/{health,queue,jobs}` dung `BANANA_TO_UPSCALE_SERVICE_KEY`, khong expose raw path/key.
- Banana integration da vao `origin/dev_banana` va production tai commit `0086835b1d4e342da4bc1d7e5a651c4f2172f32e`, version `0.1.44`.
- Upscale production code khop commit `8caeade29e975e75b1cb86a79f87ef7f9f54e8ea`, release `/opt/mtips5s-upscale/releases/20260824-banana-api2`.

## 2026-08-24 Web Checkpoint and Background Processing

- Them `renderer/lib/web-job-checkpoint.ts` de validate/save/load/clear checkpoint versioned trong browser; payload chi co job ID, command va timestamps.
- Web chi hien thong bao co the dong trang sau khi API da tao job va checkpoint da ghi thanh cong; upload chua tao job khong hien thong bao sai.
- Reload trang goi `resumePendingWebUpscale`, poll lai job cu, khoi phuc progress/ETA, tai result va phat done event nhu luong moi.
- Poll/result download retry vo han voi loi mang, HTTP 429 va 5xx trong khi trang con mo; 401/403/404 va terminal job se xoa checkpoint.
- Dong/reload tab khong goi DELETE; worker SQLite tren VPS tiep tuc doc lap. Stop van la cancel explicit va chi xoa checkpoint khi server xac nhan.
- Them `BACKGROUND_HINT` cho 20 locale va status event rieng, khong thay doi UI Electron.
- Production release `/opt/mtips5s-upscale/releases/20260824-checkpoint-bg`, code SHA `88405937c9f4f918e348c3630ad305c1675a2d98`.

## 2026-08-24 Software Vulkan Auto Detect

- Them `renderer/server/upscale-api/runtime-env.ts` de detect software Vulkan mode `auto|always|never`.
- `auto` tren Linux bat software path khi khong co render node `/dev/dri/renderD*` doc/ghi duoc; neu env da preset `llvmpipe/lavapipe/lvp` thi giu va report la `preset_environment`.
- Worker spawn `upscayl-bin` voi `LIBGL_ALWAYS_SOFTWARE=1`, `MESA_LOADER_DRIVER_OVERRIDE=llvmpipe` va `VK_ICD_FILENAMES` tro toi `lvp` ICD neu co.
- Health API expose `runtime.softwareVulkan` gom mode, active, reason va optional ICD path.
- `deploy/upscayl-web.service` dat `UPSCAYL_API_SOFTWARE_VULKAN=auto`; docs API v1 mo ta cach force/disable.
- Production release `/opt/mtips5s-upscale/releases/20260824-software-vulkan-auto` active; health tren VPS bao `mode=auto`, `active=true`, `reason=no_accessible_render_node`, ICD `/usr/share/vulkan/icd.d/lvp_icd.x86_64.json`.

## 2026-08-24 CPU llvmpipe Performance Guardrail

- Benchmark production qua anonymous same-origin API: 125x120 scale4 job xong 56.2s, output 624,031 bytes; 500x261 scale2 job xong 425s, output 238,866 bytes.
- 960x540 scale2 benchmark duoc huy tai progress 19.37% vi ETA tang len hon 2,000s, tranh chiem worker production qua lau.
- Dat service env `UPSCAYL_API_ESTIMATED_MS_PER_MEGAPIXEL=800000` va `UPSCAYL_API_MAX_OUTPUT_PIXELS=2500000` trong `deploy/upscayl-web.service`.
- `/api/v1/models` hien `maxOutputPixels=2500000`; 1080p scale2 create job bi reject `OUTPUT_PIXEL_LIMIT_EXCEEDED` truoc khi spawn.

## 2026-08-24 Dependency Security Hardening

- Chay `npm audit fix --omit=dev`, cap nhat `package-lock.json` cho cac fix non-breaking/transitive: Firebase/protobuf/grpc/websocket/postcss/ajv/electron-updater va cac parser/glob dependency lien quan.
- Khong chay `npm audit fix --force` vi cac advisory con lai yeu cau major/breaking: `electron@43`, `exiftool-vendored@37`, `eslint-config-next@16`.
- Deploy `package-lock.json` moi vao release active, chay `npm install` va `npm run web:build` tren VPS, restart service thanh cong.

## 2026-08-24 Production Status Command

- Them `scripts/upscale-prod-status.js` va npm script `api:v1:status`.
- Script doc public `/health`, `/models` va legacy redirect `veo3` khong can API key hay service secret.
- Command fail neu health khong `ok`, runtime thieu binary/model, va exit code 2 neu queue/processing khong idle.
- Deploy script/docs/package.json len release active; `npm run api:v1:status` pass tren local va VPS.

## 2026-08-24 Operations Roadmap Gates

- Them `docs/upscale-operations-roadmap.md` de track baseline production, legacy migration cleanup, major dependency upgrade gate va scale strategy gate.
- Link roadmap tu `docs/upscale-api-v1.md`; sync doc len active VPS release.
- Roadmap yeu cau log/metric truoc khi retire `veo3` redirect hoac legacy `up_`, va compatibility QA rieng truoc khi force major upgrades.

## 2026-08-24 Upscale Page Blank Hotfix

- Root cause: VPS build sau hardening chay `npm run web:build` thieu `UPSCAYL_WEB_BASE_PATH=/upscale`, nen HTML tai `/upscale` tro asset ve root `/_next/...`; root route thuoc backend khac va tra 500, lam UI khong hydrate.
- Hotfix production: rebuild active release voi `UPSCAYL_TARGET=web UPSCAYL_WEB_BASE_PATH=/upscale`, restart `upscayl-web`.
- Them npm script `web:build:upscale` de build dung basePath cho route production.
- Mo rong `scripts/upscale-prod-status.js` de doc HTML public page va fail neu asset khong co `/upscale/_next/` hoac con root `/_next/`.

## 2026-08-24 Banana MCP Upscale Boundary

- Audit Banana repo xac nhan MCP Upscale nam trong `lib/upscale-api-client.cjs`: `UpscaleMcpAdapter` expose 5 tool `upscale_upload`, `upscale_create_job`, `upscale_get_job`, `upscale_cancel_job`, `upscale_download_result`.
- Cac tool MCP goi public Upscale API v1 tai `BANANA_UPSCALE_BASE_URL` bang caller `bbmcp_` key qua `X-API-Key`; adapter reject key khong co prefix `bbmcp_`.
- Banana dashboard/status chi goi read-only Upscale internal API v1 tai `BANANA_UPSCALE_INTERNAL_BASE_URL` bang `BANANA_TO_UPSCALE_SERVICE_KEY`.
- Code scan trong Banana khong thay tham chieu truc tiep `/opt/mtips5s-upscale`, `/var/lib/mtips5s-upscale`, `upscale-api.sqlite`, `renderer/server/upscale-api`, `service_outbox` hay shared Upscale Docker volume.
- Production Banana truoc deploy co `electron.cjs` wiring hook nhung container `flowkit-socket-service.cjs` cu chua nhan `localToolsHandler/transformResponse`; da deploy lai Banana tu repo local sang `/opt/banana-pro` de hook MCP local tools co hieu luc.

## 2026-08-24 Agent Support APIs

- Them `renderer/server/upscale-api/agent-support.ts` voi hai endpoint metadata read-only, khong can secret: `GET /agent/manifest` va `GET /agent/workflow`.
- Manifest tra service/version/baseUrl, auth header, accepted key prefixes, endpoint map, MCP tool names, models, limits, terminal statuses, retryable HTTP codes va doc pointers.
- Workflow tra cac buoc agent nen lam: discover, preflight, upload, create_job voi `Idempotency-Key`, poll, download va cancel chi khi user yeu cau.
- Wire route vao `renderer/server/upscale-api/handler.ts` truoc cac endpoint auth-required; xu ly that van bat buoc qua `/uploads`, `/jobs`, `/jobs/{id}`, `/result`.
- Cap nhat OpenAPI `docs/upscale-api-v1.openapi.yaml`, human docs `docs/upscale-api-v1.md`, `docs/README.md`, them `docs/upscale-agent-api-readme.md`.
- Production release active moi: `/opt/mtips5s-upscale/releases/20260824-agent-api`.

## 2026-08-24 Onboarding Default Off

- Them `showOnboardingDialogAtom` mac dinh `false` de onboarding chi mo khi co action nguoi dung.
- `OnboardingDialog` bo logic doc `localStorage.showOnboarding` va bo auto-open lan dau; dialog duoc dieu khien qua atom.
- Settings tab them nut `Get Started` duoi LanguageSwitcher de mo lai onboarding.
- Don dep SVG React props trong cloud/news modal tu `stroke-linecap`/`stroke-width` sang `strokeLinecap`/`strokeWidth`.
- News modal hien tai cung khong auto-open sau fetch; van co the mo bang control hien co neu news co du lieu.

## 2026-08-24 Next Vendor Chunk Hotfix

- Root cause: `next dev` va `next build/start` cung dung `renderer/.next`, nen server bundle co luc require `chunks/vendor-chunks/lucide-react.js` nhung chunk da bi build/dev output khac ghi lech.
- Doi `next.config.js` thanh function theo phase; web dev dung `distDir=.next-web-dev`, web build/start dung `distDir=.next-web`, Electron/export giu default `.next`.
- Cap nhat `clean` script xoa ca `.next-web` va `.next-web-dev`.
- Cap nhat `web:build` va `web:build:upscale` de `rimraf renderer/.next-web` truoc khi `next build`.
- Them `.next-web` va `.next-web-dev` vao `.gitignore` de khong commit artifact.

## 2026-08-24 Default Scale 2X

- Doi `scaleAtom` default tu `"4"` sang `"2"` trong `renderer/atoms/user-settings-atom.ts`.
- Them migration client mot lan trong `Sidebar`: neu `localStorage.scale === "4"` va chua migrate thi set ve `"2"`, sau do dat `scaleDefaultMigratedTo2=true`.
- Doi API validation fallback `body.scale ?? 2` de API/MCP client thieu scale khong mac dinh 4X.
- Cap nhat OpenAPI/API docs/agent README vi du va default scale sang 2.

## 2026-08-25 VPS Sync

- Tao release `/opt/mtips5s-upscale/releases/20260825-default-scale-webfix` tren VPS va rsync source local, loai tru secret/env/cache/build/node_modules.
- Chay `npm install`, `npm run tsc` va `UPSCAYL_TARGET=web UPSCAYL_WEB_BASE_PATH=/upscale npm run web:build:upscale` trong release moi.
- Cai lai `deploy/upscayl-web.service`, `systemctl daemon-reload`, switch symlink `/opt/mtips5s-upscale/current`, restart `upscayl-web`.
- Current production hien tro ve release `20260825-default-scale-webfix`.

## 2026-08-25 Local Mac Processing Option

- Them `useLocalMacProcessingAtom` va `localMacApiEndpointAtom` trong `renderer/atoms/user-settings-atom.ts`, mac dinh off va endpoint loopback 3047.
- Them `LocalMacProcessingToggle` trong Settings; endpoint input chi hien khi toggle bat.
- Web runtime trong `renderer/lib/app-runtime.ts` chon API endpoint theo setting, health-check truoc khi upload va luu endpoint vao checkpoint.
- `renderer/lib/web-job-checkpoint.ts` chap nhan field `endpoint` hop le de resume/cancel/download dung backend ban dau.
- Local API config/auth/CORS cho phep bridge tu Origin allowlist vao loopback host, khong mo anonymous bridge cho public host.
- Them key locale `SETTINGS.LOCAL_MAC_PROCESSING` cho tat ca ngon ngu; en/vi co copy chinh, cac locale khac dung fallback English.

## 2026-08-25 Queue Tab

- Them `SELECT_FILES` command va mo rong web/Electron file picker de chon nhieu anh mot lan.
- Them `UpscaleQueueItem`, `upscaleQueueItemsAtom` va `queueProcessingAtom` trong state chung.
- Them `renderer/components/sidebar/queue-tab/index.tsx` lam queue orchestrator: enqueue, start/pause/stop, retry/remove, progress per item, search/filter/pagination.
- Queue goi `ELECTRON_COMMANDS.UPSCAYL` cho tung item de dung lai pipeline single upscale hien co, tu dong chuyen item tiep theo sau done/error.
- Sidebar render tab order `Upscayl -> Queue -> Settings`; Queue van mount hidden khi dang xu ly de khong mat listener neu user chuyen tab.
- Home listener bo qua single-upscale progress/done/error khi Queue dang xu ly; Queue chu dong clear global progress de viewer chinh khong hien overlay sai.
- Them `QUEUE` locale namespace cho tat ca ngon ngu; en/vi co copy san pham, cac locale khac fallback English.

## 2026-08-25 Queue Support APIs

- Them validator Queue trong `renderer/server/upscale-api/validation.ts`: bulk queue create, page/limit, multi-status filter va jobIds.
- Them service helpers trong `renderer/server/upscale-api/service.ts`: `listQueueJobs`, `queueSummary`, `createQueueJobs`, `cancelQueueJobs`, `retryQueueJob`.
- `createQueueJobs` pre-validate tat ca upload/output pixel budget va queue capacity truoc khi tao bat ky job nao, tranh partial create khi mot anh fail limit.
- Wire route trong `renderer/server/upscale-api/handler.ts`:
  - `GET /queue/summary`
  - `GET /queue/jobs`
  - `POST /queue/jobs`
  - `POST /queue/jobs/cancel`
  - `POST /queue/jobs/{jobId}/retry`
- Cap nhat `agent-support.ts`, `docs/upscale-api-v1.md`, `docs/upscale-agent-api-readme.md`, `docs/upscale-api-v1.openapi.yaml` va contract smoke script.

## 2026-09-01 Local Mac Processing Completion

- Them `scripts/local-mac-worker.sh` voi install/start/stop/restart/status/uninstall.
- Installer build web `/upscale`, tao LaunchAgent KeepAlive/RunAtLoad, bind 127.0.0.1:3047 va luu log/data rieng.
- Them tai lieu `docs/local-mac-processing.md` va npm scripts `local:mac:*`.
- Sua LaunchAgent PATH de chay duoc Node Homebrew khi launchd khong co shell PATH.
- Deploy release `/opt/mtips5s-upscale/releases/20260901-local-mac`; production health/page/toggle smoke pass.
