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
