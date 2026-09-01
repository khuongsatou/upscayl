# Current Task

| Field | Value |
|---|---|
| Date | 2026-08-23 |
| Owner | Project Manager |
| Status | Done |
| Task | Bootstrap `.agent`, `.manager`, `.feedback` cho du an |
| Expected Output | Cau truc van hanh phong IT gom skills, rules, workflows, state files va feedback templates |

## Notes

- PM dung dau du an va dieu phoi cac role.
- Task nay chi tao cau hinh van hanh, khong thay doi code ung dung.

## 2026-08-23 Web Runtime Refactor

| Field | Value |
|---|---|
| Owner | Electron Next Developer |
| Status | Done |
| Task | Refactor renderer de ho tro web runtime ma khong doi giao dien |
| Expected Output | Electron IPC giu nguyen; browser target co runtime adapter, image preview bang File API, va contract goi web upscale API |

## 2026-08-23 Web Upscale Backend

| Field | Value |
|---|---|
| Owner | Upscale Pipeline Specialist |
| Status | Done |
| Task | Implement `/api/upscayl` de web runtime upscale that |
| Expected Output | Single, double va batch web jobs goi `upscayl-bin`, tra image/zip blob ve browser |

## 2026-08-24 VPS Web Deployment

| Field | Value |
|---|---|
| Owner | DevOps Release Operator |
| Status | Done |
| Task | Deploy web runtime len VPS va route tai `/upscale` |
| Expected Output | HTTPS route hoat dong, web service duoc quan ly on dinh, va smoke test UI/API dat yeu cau |

## 2026-08-24 Web Progress Reporting

| Field | Value |
|---|---|
| Owner | Upscale Pipeline Specialist |
| Status | Done |
| Task | Hien thi tien do web upscale lien tuc tu 0 den 100 phan tram |
| Expected Output | UI hien co nhan progress that tu VPS cho single, double va batch, khong thay doi layout |

## 2026-08-24 Non-blocking Progress Bar

| Field | Value |
|---|---|
| Owner | Electron Next Developer |
| Status | Done |
| Task | Thay loading overlay bang progress bar khong chan thao tac |
| Expected Output | Trong luc upscale, UI van tuong tac duoc; progress va Stop luon hien thi gon, ro rang |

## 2026-08-24 Model Comparison Image Hotfix

| Field | Value |
|---|---|
| Owner | Electron Next Developer |
| Status | Done |
| Task | Sua anh Before/After trong Select AI Model khong hien thi tren web |
| Expected Output | Tat ca anh model va zoom tai dung tren web; Electron protocol hien co duoc giu nguyen |

## 2026-08-24 Web Upscale ETA

| Field | Value |
|---|---|
| Owner | Upscale Pipeline Specialist + Electron Next Developer |
| Status | Done |
| Task | Them thoi gian du doan hoan thanh vao progress web upscale |
| Expected Output | ETA dua tren progress native, dem nguoc tren progress bar, khong anh huong Electron |

## 2026-08-24 Upscale Route Migration

| Field | Value |
|---|---|
| Owner | DevOps Release Operator |
| Status | Done |
| Task | Chuyen public route tu `veo3.1nutnhan.com/upscale` sang `bb.1nutnhan.com/upscale` |
| Expected Output | Route moi proxy toi web service; route cu redirect an toan; cac route hien co cua `bb` giu nguyen |

## 2026-08-24 Upscale API v1

| Field | Value |
|---|---|
| Owner | Project Manager + Solution Architect + Upscale Pipeline Specialist |
| Status | Done |
| Task | Trien khai bo API upscale bat dong bo theo plan da duyet |
| Expected Output | OpenAPI v1, API key, SQLite queue, worker, upload/job/status/cancel/result/history/cleanup, web migration va production QA |

## 2026-08-24 Banana-Upscale API Integration

| Field | Value |
|---|---|
| Owner | Project Manager + Solution Architect + Upscale Pipeline Specialist |
| Status | Done |
| Task | Tich hop Banana va Upscale thanh hai dich vu doc lap, chi giao tiep qua HTTP API versioned |
| Expected Output | Banana so huu `bbmcp_` key/quota/usage/MCP; Upscale so huu job pipeline; introspection, internal API va outbox event sync co test va production canary |

## 2026-08-24 Web Checkpoint and Background Processing

| Field | Value |
|---|---|
| Owner | Project Manager + Upscale Pipeline Specialist + Electron Next Developer |
| Status | Done |
| Task | Them checkpoint trinh duyet va co che tiep tuc xu ly background tai `bb.1nutnhan.com/upscale` |
| Expected Output | Job tiep tuc tren server khi dong/reload tab; web tu dong ket noi lai job dang chay, khoi phuc progress/ETA va lay ket qua khi hoan tat |

## 2026-08-24 Software Vulkan Auto Detect

| Field | Value |
|---|---|
| Owner | Upscale Pipeline Specialist + DevOps Release Operator |
| Status | Done |
| Task | Them option detect llvmpipe/lavapipe theo moi truong runtime |
| Expected Output | Worker web tu dong bat software Vulkan tren Linux khi khong co render node GPU; co option `auto/always/never` va health report de van hanh |

## 2026-08-24 CPU llvmpipe Performance Guardrail

| Field | Value |
|---|---|
| Owner | Upscale Pipeline Specialist + DevOps Release Operator |
| Status | Done |
| Task | Benchmark CPU llvmpipe va dat guardrail output/ETA cho production |
| Expected Output | VPS khong nhan job output qua lon tren CPU-only; ETA fallback gan hon profile llvmpipe that |

## 2026-08-24 Dependency Security Hardening

| Field | Value |
|---|---|
| Owner | DevOps Release Operator + Code Reviewer |
| Status | Done with Follow-up |
| Task | Giam advisory runtime co the fix an toan khong dung major upgrade |
| Expected Output | Production-scope audit khong con critical/moderate; con lai duoc tach thanh major-upgrade follow-up |

## 2026-08-24 Production Status Command

| Field | Value |
|---|---|
| Owner | DevOps Release Operator |
| Status | Done |
| Task | Them lenh status khong can secret cho Upscale production |
| Expected Output | Mot lenh kiem tra health, runtime, queue, limits va legacy redirect de dung sau deploy |

## 2026-08-24 Operations Roadmap Gates

| Field | Value |
|---|---|
| Owner | Project Manager + DevOps Release Operator + Solution Architect |
| Status | Done |
| Task | Ghi ro gate cho legacy cleanup, major dependency upgrade va scale strategy |
| Expected Output | Khong force major upgrade/retire route/tang concurrency khi chua du metric va QA gate |

## 2026-08-24 Upscale Page Blank Hotfix

| Field | Value |
|---|---|
| Owner | DevOps Release Operator + Electron Next Developer |
| Status | Done |
| Task | Sua `https://bb.1nutnhan.com/upscale` chi hien loading/logo do asset path sai |
| Expected Output | Public page render UI day du; build/deploy co guard bat loi asset `/_next` sai basePath |

## 2026-08-24 Banana MCP Upscale Boundary

| Field | Value |
|---|---|
| Owner | Project Manager + Solution Architect + DevOps Release Operator |
| Status | Done |
| Task | Xac minh va dong bo MCP Upscale ben Banana chi giao tiep voi Upscale qua HTTP API versioned |
| Expected Output | Banana MCP co 5 tool `upscale_*`, khong doc DB/file/source/volume cua Upscale; production route `/mcp` va `/api/mcp/upscale` smoke pass |

## 2026-08-24 Agent Support APIs

| Field | Value |
|---|---|
| Owner | Solution Architect + Upscale Pipeline Specialist + QA Tester |
| Status | Done |
| Task | Tao API ho tro agent discover workflow Upscale va README de agent biet cach goi |
| Expected Output | Public `GET /agent/manifest`, `GET /agent/workflow`, OpenAPI/docs/README va production smoke pass |

## 2026-08-24 Onboarding Default Off

| Field | Value |
|---|---|
| Owner | Product Owner + Electron Next Developer + QA Tester |
| Status | Done |
| Task | Tat modal `Welcome to Upscayl` mac dinh; nguoi dung chi mo lai tu Settings |
| Expected Output | Trang `/upscale` khong tu hien onboarding modal; Settings co nut mo lai onboarding khi nguoi dung muon xem |

## 2026-08-24 Next Vendor Chunk Hotfix

| Field | Value |
|---|---|
| Owner | Electron Next Developer + DevOps Release Operator + QA Tester |
| Status | Done |
| Task | Sua loi `Cannot find module './chunks/vendor-chunks/lucide-react.js'` khi chay web production |
| Expected Output | `next dev` va `next build/start` khong dung chung build dir; `/upscale` production start tra 200 |

## 2026-08-24 Default Scale 2X

| Field | Value |
|---|---|
| Owner | Product Owner + Upscale Pipeline Specialist + Electron Next Developer |
| Status | Done |
| Task | Doi default Image Scale tu 4X xuong 2X de giam loi vuot pixel limit |
| Expected Output | User/API moi mac dinh 2X; scale cu 4X duoc migrate mot lan ve 2X; user van co the chon lai 4X |

## 2026-08-25 VPS Sync

| Field | Value |
|---|---|
| Owner | DevOps Release Operator + QA Tester |
| Status | Done |
| Task | Dong bo cac hotfix web chunk, onboarding/news va default scale 2X len VPS |
| Expected Output | Production release moi active, build `/upscale` dung `.next-web`, health/page/API smoke pass |

## 2026-08-25 Local Mac Processing Option

| Field | Value |
|---|---|
| Owner | Product Owner + Electron Next Developer + Upscale Pipeline Specialist + QA Tester |
| Status | Done locally |
| Task | Them Settings option de web co the dung Mac local lam noi xu ly upscale khi local server dang bat |
| Expected Output | Toggle mac dinh tat, endpoint local configurable, web job route qua local API khi bat va fail ro neu local offline |

## 2026-08-25 Queue Tab

| Field | Value |
|---|---|
| Owner | Product Owner + Electron Next Developer + Upscale Pipeline Specialist + QA Tester |
| Status | Done locally |
| Task | Them tab Queue nam giua Upscayl va Settings de xu ly nhieu anh upscale theo hang doi |
| Expected Output | Queue co add multi-image, start/pause/stop, progress tung anh 0-100, search, filter va pagination |

## 2026-08-25 Queue Support APIs

| Field | Value |
|---|---|
| Owner | Solution Architect + Upscale Pipeline Specialist + QA Tester |
| Status | Done locally |
| Task | Them API ho tro Queue de agent/UI tao hang doi, list/search/filter/page, summary, cancel nhieu job va retry |
| Expected Output | `/queue/*` API co docs/OpenAPI/manifest va local smoke pass |

## 2026-09-01 Local Mac Processing Completion

| Field | Value |
|---|---|
| Owner | PM + DevOps + QA |
| Status | Done / Production Go |
| Task | Trien khai worker Mac tu khoi dong va ket noi production web |
| Expected Output | Cai mot lan, worker listen loopback 3047, production toggle route job qua Mac |

## Notes

- LaunchAgent `com.mtips5s.upscayl-local-worker` da cai tren Mac arm64 va dang running.
- Local E2E health/upload/create/process/download pass voi anh that.
- Production release `20260901-local-mac` active; toggle da hien tren bundle production.

## 2026-09-02 Log Manager

| Field | Value |
|---|---|
| Owner | Electron Next Developer + QA + DevOps |
| Status | Done / Production Go |
| Task | Them Log Manager ben duoi Stats |
| Expected Output | Xem, tim, loc, copy, export va clear log trong drawer |

## Notes

- Log Manager da deploy trong release `20260902-log-manager`.
- Log duoc persist local, gioi han 500 dong va redact key/token co ban.

## 2026-09-02 Log Manager Enrichment

| Field | Value |
|---|---|
| Owner | Electron Next Developer + QA + DevOps |
| Status | Done / Production Go |
| Task | Bo sung timestamp/source/filter source va confirmation clear cho Log Manager |
| Expected Output | Log co context, loc duoc theo source, thao tac xoa co xac nhan |

- Production release `20260902-log-manager-v2` active; health/page smoke pass.

## 2026-09-02 Log Manager Structured Entries

| Field | Value |
|---|---|
| Owner | Electron Next Developer + QA + DevOps |
| Status | Done / Production Go |
| Task | Chuyen log sang typed entries co timestamp/source/level va migrate log cu |
| Expected Output | Log Manager loc va export duoc metadata structured, khong mat log cu |

- Production release `20260902-log-manager-v3` active; page/API smoke pass.

## 2026-09-02 Queue Image Preview

| Field | Value |
|---|---|
| Owner | Electron Next Developer + QA + DevOps |
| Status | Done / Production Go |
| Task | Click queue item to show original/result preview |
| Expected Output | Preview region opens without interrupting queue processing |

- Production release `20260902-queue-preview` active; page/API smoke pass.
