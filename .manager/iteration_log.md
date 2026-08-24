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
