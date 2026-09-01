# Iteration Log

## 2026-08-23

- Nhan yeu cau bootstrap phong IT agent operating room.
- Kiem tra repo chua co `.agent`, `.manager`, `.feedback`.
- Tao cau truc role, rule, workflow, state va feedback templates.

## 2026-08-23 Web Runtime Refactor

- Refactored direct Electron calls behind `appRuntime`.
- Added browser file registry for object URL preview and FormData API handoff.
- Verified Electron export build and web server build.

## 2026-08-23 Web Upscale Backend

- Added multipart API route and server-side temp workspace.
- Verified single, double, and batch artifacts through direct API calls.
- Verified browser UI receives real upscale outputs through Playwright.

## 2026-08-24 Web Upscale ETA

- Chan doan job anh lon van chay tren CPU nhung progress dung lau giua cac tile.
- Them ETA chi tu native progress, lam muot completion estimate va giam poll tu 200ms xuong 1s.
- QA local API/UI bang tieng Anh va tieng Viet, sau do QA staging VPS.
- Cutover production sang `20260824-eta2` sau khi job cu ket thuc; public smoke test pass.

## 2026-08-24 Upscale Route Migration

- Xac minh DNS/TLS cua `bb` va phat hien domain dang co backend rieng tai `/` va `/ws`.
- Them location `/upscale` co do uu tien cao, backup hai server block va reload Nginx sau config test.
- Xac minh page, asset, API job that tren domain moi va redirect 308 tu domain cu.

## 2026-08-24 Upscale API v1

- Chuyen plan thanh OpenAPI/acceptance criteria, sau do implement persistent API queue theo cac module nho.
- QA local toan bo auth, validation, idempotency, ownership, queue, single/double/batch, cancel, restart va TTL.
- Staging release `api-v1` tren port 3031 pass contract; cutover production voi rollback symlink san sang.
- Browser production phat hien client goi `/api/v1` thay vi `/upscale/api/v1`; sua base-path va cutover `api-v1b`.
- Browser QA dai hon phat hien binary VPS chi phat `0%`, lam progress dung va ETA null; them fallback theo output workload.
- Staging `api-v1c` xac nhan ETA 39 giay ngay khi processing va cancel sach; production xac nhan ETA dem nguoc va output thanh cong.
- Chay lai authenticated contract, legacy adapter, controlled restart recovery va final service/storage/log audit truoc khi PM dong task.
- Rule Splitting File phat hien `worker.ts` 542 dong; tach `progress.ts`, chay lai local contract, staging ETA/cancel va production contract tren release `api-v1d`.

## 2026-08-24 Banana-Upscale Integration

- Tach Banana implementation sang clean worktree/branch de khong ghi de 15 file dang sua do trong repo nguoi dung.
- Contract API hai chieu va 5 MCP Upscale tools duoc them; Banana `0.1.44` full suite 386 test pass.
- Failure-isolation test phat hien cancel-during-restart thieu quota release; da sua DB recovery tao persistent outbox event/release va test lai pass.
- Banana integration duoc rebase theo cac release dong thoi, merge vao `dev_banana`; production source khop SHA `0086835b1d4e342da4bc1d7e5a651c4f2172f32e`.
- Production MCP SSE gap duoc phat hien tai canary, sua o `0.1.43`; `0.1.44` mang day du integration forward.
- Startup reconciliation duoc them sau audit crash window; terminal success va cancel recovery test deu pass.

## 2026-08-24 Web Checkpoint and Background Processing

- Xac nhan backend API v1 da persist job/queue va worker tiep tuc doc lap; gap nam o browser lam mat job ID khi reload.
- Them checkpoint module, auto-resume, retry tam thoi va background status chi sau khi job da duoc handoff cho server.
- Local type/build/schema va checkpoint tests pass; push exact SHA `88405937` truoc deploy.
- VPS dang xu ly mot job nguoi dung tu 24.83%; release watcher doi den job 100% va queue rong moi atomic cutover, tranh mat tien do.
- Production canary tao job roi ngat client; client moi resume va download PNG thanh cong. Browser page/bundle/log va service/outbox audit deu pass.

## 2026-08-24 Software Vulkan Auto Detect

- Them helper runtime env cho web worker de auto bat llvmpipe/lavapipe tren Linux khi khong co render node GPU doc/ghi duoc.
- Expose trang thai `runtime.softwareVulkan` trong health API va them service env `UPSCAYL_API_SOFTWARE_VULKAN=auto`.
- Local tsc, web build, desktop/static build va health smoke macOS pass; VPS Linux can smoke sau deploy.
- Deploy release `20260824-software-vulkan-auto` len VPS, cap nhat systemd env, health xac nhan auto software Vulkan active va real PNG job pass; service restart count van 0.

## 2026-08-24 CPU llvmpipe Performance Guardrail

- Chay production benchmark small/medium; medium 500x261 scale2 mat 425s nen xac nhan CPU llvmpipe khong nen nhan output lon.
- Huy benchmark 960x540 scale2 khi ETA tang qua cao de tranh chiem worker; cancel sach va queue ve 0.
- Cap nhat service env ETA 800,000 ms/MP va max output 2.5MP; verify models limit va oversized job reject truoc spawn.

## 2026-08-24 Dependency Security Hardening

- Audit production scope ban dau co 25 advisory, gom 2 critical; `npm audit fix --omit=dev` giam xuong 6 high va khong con critical/moderate.
- Local tsc, web build va full build pass; deploy lockfile moi len VPS, chay install/build/restart thanh cong.
- De lai major-upgrade backlog cho Electron, exiftool-vendored va eslint-config-next vi can compatibility QA rieng.

## 2026-08-24 Production Status Command

- Them secret-free status script doc health/models/redirect; local va VPS deu pass.
- Script duoc deploy vao active release de dung nhu post-deploy smoke command.

## 2026-08-24 Operations Roadmap Gates

- Them operations roadmap de dong khung legacy cleanup, major dependency upgrades va scale strategy bang gate cu the.
- Sync roadmap len active release; service khong restart va van active.

## 2026-08-24 Upscale Page Blank Hotfix

- User bao `bb.1nutnhan.com/upscale` khong hien thi; curl HTML phat hien asset bi build sai root `/_next`.
- Rebuild production voi `UPSCAYL_WEB_BASE_PATH=/upscale`, restart service va verify HTML asset path dung.
- Them `web:build:upscale` va status guard page asset; browser render smoke pass.

## 2026-08-24 Banana MCP Upscale Boundary

- Audit Banana MCP adapter va docker compose: khong thay direct coupling voi Upscale DB/file/source/volume.
- Local Banana `npm run check` pass; targeted MCP/API tests pass 32/32.
- Production phat hien container Banana chua co `flowkit-socket-service.cjs` moi de gan local tool hook, nen deploy lai Banana tu repo local.
- Sau deploy, MCP handshake/tools-list pass voi 5 tool `upscale_*`; local `upscale_get_job` smoke handled qua API va dashboard `/api/mcp/upscale` bao Upscale health `ok`, queue rong.

## 2026-08-24 Agent Support APIs

- Them manifest/workflow API cho agent discover endpoint, limit, MCP tool mapping va workflow bat dong bo.
- Them README cho agent va update OpenAPI/docs; local tsc, YAML parse, Next build va curl smoke pass.
- Deploy release `20260824-agent-api`; production `/agent/manifest`, `/agent/workflow` va `api:v1:status` deu pass.

## 2026-08-24 Onboarding Default Off

- Xac dinh modal user noi la `OnboardingDialog` voi text `Welcome to Upscayl`, khac voi news/cloud modal.
- Doi onboarding sang atom state mac dinh off, bo auto-open tu `localStorage.showOnboarding`.
- Them Settings control mo lai onboarding va sua React SVG prop warning trong modal lien quan.
- Local browser reload khong hien modal; Settings -> `Get Started` mo lai modal; tsc va web build `/upscale` pass.

## 2026-08-24 Next Vendor Chunk Hotfix

- Tai hien `next start` port 3057 tra 500 voi missing `./chunks/vendor-chunks/lucide-react.js`.
- Phat hien `.next` bi tron giua dev server va production build/start.
- Tach distDir theo phase web va clean `.next-web` truoc build.
- Build `/upscale`, scan artifact va `next start` smoke pass; restart local dev 3047 bang `.next-web-dev` va `/upscale` tra 200.

## 2026-08-24 Default Scale 2X

- User de xuat mac dinh 2X de tranh anh lon bi loi pixel limit.
- Doi default UI/API/docs sang 2X va them migration mot lan cho stored `scale=4`.
- Verify UI hien 2X khi khong co stored scale, API job khong truyen scale tra `scale=2`, build/typecheck pass.

## 2026-08-25 VPS Sync

- Preflight VPS health xac nhan queue idle truoc deploy.
- Rsync source vao release `20260825-default-scale-webfix`, build tren VPS va switch symlink sau khi build pass.
- Restart service thanh cong, `api:v1:status` public pass, production create job khong truyen scale tra `scale=2`.

## 2026-08-25 Local Mac Processing Option

- Chuyen yeu cau "tan dung local khi Mac bat" thanh opt-in browser-side route override trong Settings, mac dinh off.
- Them atoms/UI locale, runtime endpoint selection, checkpoint endpoint persistence va local loopback CORS/auth bridge.
- Schema fail lan dau vi chi co en/vi; bo sung key cho tat ca locale va build pass.
- Smoke local bridge tu Origin production upload/create/cancel thanh cong khong can API key; UI Settings toggle off/on pass.

## 2026-08-25 Queue Tab

- Them tab Queue vao sidebar va mo rong file picker web/Electron de chon nhieu anh.
- Chon huong queue renderer-side xu ly tung single job de moi anh co progress/status rieng thay vi dung batch folder progress tong.
- QA phat hien Stop nen pause queue; da sua de Stop current khong tu chay tiep item ke.
- Browser smoke xac nhan tab order, empty state, add 6 anh, search/filter/pagination va start/stop/cancel.

## 2026-08-25 Queue Support APIs

- Them `/queue/*` API thay vi mo rong `/jobs` de giu backward compatibility.
- Local smoke dau tien phat hien bulk create co the partial-create neu upload sau vuot pixel limit; da them pre-validation all uploads truoc khi tao job.
- Next build bat them type issue `parseJobIdList` va `.entries()` target; da sua return type va for-loop index.
- Smoke cuoi pass create 2 queue jobs, list/search/filter/page, summary, cancel va retry.

## 2026-09-02 Queue Show In Main Viewer

- User requested a direct per-item action to show queue images in the main viewer.
- Added an eye action with event isolation and routed original/result state through existing Home viewer state.
- Validation passed; next step is atomic VPS release and production smoke.
