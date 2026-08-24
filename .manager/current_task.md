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
| Status | In Progress |
| Task | Tich hop Banana va Upscale thanh hai dich vu doc lap, chi giao tiep qua HTTP API versioned |
| Expected Output | Banana so huu `bbmcp_` key/quota/usage/MCP; Upscale so huu job pipeline; introspection, internal API va outbox event sync co test va production canary |
