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
