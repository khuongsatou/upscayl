# Requirements

## Output tu Product Owner

- Tao `.agent` gom it nhat 5 skills, 5 rules, 5 workflows phu hop van hanh du an.
- Them Project Manager la nguoi dung dau du an.
- Them vai tro khach hang/UX danh gia giao dien va chuc nang.
- Tao `.manager` lam noi bao cao sau moi task.
- Tao `.feedback` de Codex va Antigravity trao doi feedback theo luong inbox -> response -> action plan.
- Them Rule Splitting File de chia nho file/task khi co nguy co tran context size.

## Acceptance Criteria

- `.agent/skills/` co tu 5 skill tro len.
- `.agent/rules/` co tu 5 rule tro len.
- `.agent/workflows/` co tu 5 workflow tro len.
- `.manager/` co day du file state theo prompt.
- `.feedback/` co README, inbox, responses, action-plan va `qa_coverage.json` hop le.

## 2026-08-23 Web Runtime Refactor

- Khong thay doi UI/layout hien co.
- Desktop Electron van dung IPC/preload hien co.
- Browser khong truy cap truc tiep `window.electron`.
- Browser co the chon/drag/drop/paste anh va preview bang `blob:` URL.
- Lenh upscale trong browser duoc gui qua `NEXT_PUBLIC_UPSCAYL_WEB_API_URL` hoac mac dinh `/api/upscayl`.

## 2026-08-23 Web Upscale Backend

- `/api/upscayl` nhan multipart upload tu web runtime.
- Single image tra ve image blob.
- Double upscale chay 2 pass va tra ve image blob.
- Batch upscale tra ve zip blob.
- API validate command, model va output format.
- API dung temp dir va cleanup sau response.
- Electron/static export build khong bi vo.

## 2026-08-24 Web Upscale ETA

- Progress bar web hien thi thoi gian con lai du kien.
- Truoc mau progress native dau tien, ETA hien trang thai chua du du lieu thay vi du doan sai.
- ETA duoc cap nhat khi co tile progress moi va dem nguoc giua cac mau.
- Single, double va batch dung chung mot dai ETA 0-100.
- Electron desktop giu nguyen payload progress dang chuoi phan tram.

## 2026-08-24 Upscale Route Migration

- `https://bb.1nutnhan.com/upscale` phuc vu Upscayl web va API.
- `bb.1nutnhan.com/` va `/ws` tiep tuc dung backend hien co.
- URL cu tai `veo3.1nutnhan.com/upscale` redirect 308 sang domain moi va giu path/query/method.
- Nginx config phai pass `nginx -t` truoc reload.
- Smoke test page, static assets, API va redirect sau cutover.

## 2026-08-24 Upscale API v1

### Must-have

- REST API versioned tai `/api/v1` voi health, models, uploads, jobs, status, cancel, result, history va result deletion.
- Xac thuc `X-API-Key` cho client API; web cung origin dung anonymous principal co rate limit rieng.
- Job persist trong SQLite va job `processing` duoc recover sau service restart.
- Worker concurrency 1, queue toi da 20, cancel kill child process, timeout 60 phut.
- Validate magic bytes PNG/JPEG/WEBP, model/scale/format/tile/custom width va ownership upload/job.
- Input/output khong lo raw filesystem path; result TTL 24 gio va cleanup tu dong.
- `Idempotency-Key` khong tao trung job trong cung principal.
- Web runtime chuyen sang upload -> create job -> poll -> download/cancel cua API v1; Electron giu nguyen IPC.
- Endpoint `/api/upscayl` cu tiep tuc hoat dong trong giai doan compatibility.
- OpenAPI 3.1 va CLI tao/list/revoke API key.

### Acceptance criteria

- Typecheck, web build va desktop/static build pass.
- Contract test bao phu 401, validation, idempotency, queue/status, cancel, result/history va ownership.
- Single, double va batch tao output that; restart recovery va cleanup duoc kiem tra.
- Production `bb.1nutnhan.com/upscale/api/v1` pass health/models, authenticated API va browser flow.

## 2026-08-24 Banana-Upscale API Integration

### Architecture invariants

- Banana va Upscale co repo, database, runtime, release va rollback rieng.
- Khong chia se JSON store, SQLite, Docker volume, source import hoac filesystem path giua hai dich vu.
- Moi giao tiep lien dich vu dung HTTP API co version va service credential rieng.
- Banana so huu `bbmcp_` key, user/session, quota, usage, MCP tools va dashboard.
- Upscale so huu upload, SQLite job, queue/worker, progress/ETA, cancel, result va TTL.
- Upscale introspect `bbmcp_` key qua Banana; auth loi/timeout phai fail closed.
- `up_` key va anonymous same-origin web duoc giu trong giai doan migration.
- Lifecycle/usage event phai dung persistent outbox, retry va idempotency.

### Acceptance criteria

- OpenAPI/contract test bao phu introspection, quota reservation lifecycle, event batch va internal job/queue/health API.
- Banana MCP adapter co the upload, tao/poll/cancel/download Upscale job ma khong truy cap DB Upscale.
- Upscale chap nhan `bbmcp_` key hop le, tu choi key revoked/invalid va khong log raw key.
- Banana down khong lam mat job/event Upscale; Upscale down khong lam sai quota Banana.
- Service-to-service request co timeout, retry chi voi thao tac idempotent va request/event id duy nhat.
- Canary production xac nhan auth, quota, progress/ETA, result va usage dashboard end-to-end truoc khi retire `up_` key.

## 2026-08-24 Web Checkpoint and Background Processing

### Must-have

- Sau khi API tao job, browser luu checkpoint chi gom job ID, command/mode va thoi gian het han; khong luu API key, raw image hay filesystem path.
- Dong tab, reload tab hoac dua tab ve background khong gui cancel; worker tren VPS tiep tuc xu ly doc lap voi browser.
- Khi mo lai trang, web tu dong doc checkpoint, poll job cu, khoi phuc progress/ETA va tai ket qua khi thanh cong.
- Stop la thao tac huy tuong minh: goi DELETE job, dung polling va xoa checkpoint.
- Checkpoint bi xoa khi job succeeded, failed, canceled, expired, not found hoac khong con quyen truy cap.
- Loi mang/5xx tam thoi khong lam mat checkpoint va duoc retry trong khi trang con mo.
- UI web thong bao ro job dang chay background va co the dong trang; Electron desktop khong doi.

### Acceptance criteria

- TypeScript, schema validation va web build pass.
- Test bao phu checkpoint validation/save/load/clear va source wiring cho auto-resume/background label.
- Production smoke: tao job, ngat client polling, job van hoan tat; reload trang co the resume job va tai ket qua.

## 2026-08-24 Software Vulkan Auto Detect

- Them option `UPSCAYL_API_SOFTWARE_VULKAN=auto|always|never`.
- Mac/Windows khong bi ep llvmpipe/lavapipe.
- Linux `auto` chi bat software Vulkan khi khong co `/dev/dri/renderD*` doc/ghi duoc hoac env da preset software driver.
- Khi active, worker spawn `upscayl-bin` voi Mesa software env va `lvp` ICD neu tim thay.
- `/api/v1/health` bao cao mode, active state va reason de DevOps quan sat.
- Khong thay doi API job payload, web UI hoac Electron IPC.

## 2026-08-24 CPU llvmpipe Performance Guardrail

- Benchmark production voi job anh nho/vua de lay duration that tren VPS CPU-only.
- Khong de benchmark lon chiem worker qua lau; job lon phai cancel sach neu qua nguong.
- Dat `UPSCAYL_API_ESTIMATED_MS_PER_MEGAPIXEL` theo profile llvmpipe thay vi default GPU-friendly.
- Dat `UPSCAYL_API_MAX_OUTPUT_PIXELS` bao ve worker production khoi job output qua lon.
- Verify `/models` expose limit moi va create job vuot limit bi reject truoc khi spawn binary.

## 2026-08-24 Onboarding Default Off

- Must-have: modal `Welcome to Upscayl` khong duoc tu dong mo khi nguoi dung vao app/web lan dau.
- Must-have: Settings co control de nguoi dung chu dong mo lai onboarding.
- Must-have: khong phu thuoc vao `localStorage.showOnboarding` cu de auto-open.
- Acceptance: reload `http://127.0.0.1:3047/upscale` khong co welcome dialog visible; click Settings -> `Get Started` mo lai onboarding.

## 2026-08-24 Next Vendor Chunk Hotfix

- Must-have: production `next start` khong throw missing `lucide-react.js`/`next.js` vendor chunk.
- Must-have: web dev server va web production build khong ghi chung `renderer/.next`.
- Must-have: build web `/upscale` clean output truoc moi lan build de tranh stale server bundle.
- Acceptance: tai hien truoc fix `GET /upscale` 500 tren `next start`; sau fix `GET /upscale` 200 va asset path dung `/upscale/_next`.

## 2026-08-24 Default Scale 2X

- Must-have: `Image Scale` mac dinh trong UI la 2X thay vi 4X.
- Must-have: API tao job neu thieu `scale` se fallback 2 thay vi 4.
- Must-have: browser dang luu default cu `scale=4` duoc migrate mot lan ve `2`, nhung khong khoa nguoi dung chon lai `4`.
- Acceptance: UI moi hien `Image Scale (2X)`; API create job khong truyen `scale` tra job `scale=2`; typecheck/build pass.

## 2026-08-25 Local Mac Processing Option

### Must-have

- Settings co option `Use Local Mac Processing`, mac dinh tat.
- Khi bat option, web runtime goi API endpoint local Mac thay vi endpoint `/api/v1` tren VPS.
- Endpoint local mac dinh la `http://127.0.0.1:3047/upscale/api/v1` va co the sua trong Settings.
- Neu local endpoint khong reachable, job fail ro truoc upload/job thay vi fallback am tham ve VPS.
- Checkpoint job luu endpoint da dung de reload/resume tiep tuc poll dung noi xu ly ban dau.
- Local bridge chi cho phep anonymous/auth bypass khi request toi loopback host va Origin nam trong allowlist.

### Acceptance criteria

- `npm run validate-schema`, `npm run tsc` va `web:build:upscale` pass.
- Local `/upscale` Settings hien toggle, endpoint input an khi toggle off va hien khi toggle on.
- Browser production-origin smoke co the OPTIONS, upload, create job va cancel tren local API khong can API key.

## 2026-08-25 Queue Tab

### Must-have

- Sidebar co tab `Queue` nam giua `Upscayl` va `Settings`.
- Queue cho phep them nhieu anh mot lan va them anh hien tai tu tab Upscayl.
- Queue xu ly tung anh bang single upscale pipeline hien co de moi anh co progress rieng 0-100%.
- Moi item co status `queued`, `processing`, `succeeded`, `failed`, `canceled`, ket qua/error va retry/remove khi phu hop.
- Co Start, Pause, Stop current; Stop khong duoc tu dong chay tiep item tiep theo.
- Co tim kiem theo ten anh, filter theo status va pagination.
- Queue khong lam viewer/progress chinh nhay sai khi dang xu ly hang doi.

### Acceptance criteria

- `npm run validate-schema`, `npm run tsc`, `web:build:upscale` va `git diff --check` pass.
- Local browser hien tab order `Upscayl / Queue / Settings`.
- Add 6 anh tu file picker hien `6 queued`, pagination `Page 1 / 2`, search/filter hoat dong.
- Start/Stop smoke: item chuyen processing, progress cap nhat, Stop mark canceled va cac item con lai van queued.

## 2026-08-25 Queue Support APIs

### Must-have

- API namespace rieng `/api/v1/queue/*`, khong pha contract `/jobs` hien co.
- `GET /queue/summary` tra total, active va counts theo status.
- `GET /queue/jobs` ho tro `q`, `status`, `page`, `limit`; row co metadata job va `inputFileNames`.
- `POST /queue/jobs` nhan nhieu `uploadIds` va tao mot single-image job cho moi upload de progress tung anh doc lap.
- Bulk create dung `Idempotency-Key` va pre-validate upload/output budget truoc khi tao job dau tien.
- `POST /queue/jobs/cancel` huy nhieu job theo `jobIds`.
- `POST /queue/jobs/{jobId}/retry` tao job moi tu terminal job cu.
- Docs, OpenAPI va agent manifest/workflow expose endpoint moi.

### Acceptance criteria

- `npm run tsc`, `npm run validate-schema`, OpenAPI YAML parse, `web:build:upscale` va `git diff --check` pass.
- Local bridge smoke upload 2 anh, bulk create 2 queue jobs, list search/filter/page, summary, cancel nhieu job va retry terminal job pass.
