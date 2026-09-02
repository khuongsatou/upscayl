# UX Feedback

| Field | Value |
|---|---|
| Date | 2026-08-23 |
| Reviewer | UX/Customer Reviewer |
| UI Score | N/A |
| Function Score | N/A |
| Verdict | Approved |

## Findings

- Task khong thay doi UI truc tiep.
- Da them co che bat buoc danh gia UI/function cho cac thay doi nguoi dung thay duoc.

## 2026-08-23 Web Runtime Refactor

| Field | Value |
|---|---|
| UI Score | Unchanged |
| Function Score | Pass with backend caveat |
| Verdict | Approved for web shell/runtime support |

## Findings

- Visible layout and strings were preserved.
- Browser path now supports image preview via `blob:` URLs.
- Actual web upscaling needs a compatible backend endpoint.

## 2026-08-24 Web Progress Reporting

| Field | Value |
|---|---|
| UI Score | Unchanged |
| Function Score | Pass |
| Verdict | Approved |

## Findings

- Existing progress overlay now receives live 0-100 values without layout or string changes.
- Progress remains monotonic for single, double and batch jobs.

## 2026-08-24 Non-blocking Progress Bar

| Field | Value |
|---|---|
| UI Score | 5/5 |
| Function Score | 5/5 |
| Verdict | Approved |

## Findings

- The image remains visible and settings stay usable while upscaling.
- Progress, percentage and Stop are grouped in one compact control.
- No new UI text was introduced; existing localized labels are reused.

## 2026-08-24 Model Comparison Image Hotfix

| Field | Value |
|---|---|
| UI Score | 5/5 |
| Function Score | 5/5 |
| Verdict | Approved |

## Findings

- Before/After comparisons are visible for every built-in model.
- Full-screen comparison zoom renders both images and keeps the existing layout.

## 2026-08-24 Web Upscale ETA

| Field | Value |
|---|---|
| UI Score | 5/5 |
| Function Score | 5/5 |
| Verdict | Approved |

## Findings

- ETA nam ngay duoi phan tram, khong them buoc thao tac va khong che anh.
- Trang thai `--:--` noi ro chua du du lieu; sau tile dau tien thoi gian dem nguoc de doc.
- Tieng Viet ngan gon voi nhan `Con khoang`; Stop va cac trang thai done/error giu nguyen.

## 2026-08-24 Upscale API v1

| Field | Value |
|---|---|
| UI Score | 5/5 |
| Function Score | 5/5 |
| Verdict | Approved |

## Findings

- Luong nguoi dung van la chon anh va bam Upscayl; API bat dong bo khong them buoc thao tac.
- Progress va ETA cap nhat lien tuc ke ca khi binary VPS im lang, nut Stop luon hien thi va khong chan giao dien.
- Loading, done va error deu co phan hoi; anh ket qua hien dung Before/After.
- Browser production khong co warning/error console va khong phai nhung API key vao JavaScript public.

## 2026-08-24 Banana-Upscale Dashboard

| Field | Value |
|---|---|
| UI Score | 5/5 |
| Function Score | 5/5 |
| Verdict | Approved |

## Findings

- MCP admin dashboard co service badges, running/queued, quota reservation, usage events va job progress/ETA.
- Loi health/queue/jobs duoc tach rieng; mot endpoint loi khong xoa du lieu cua endpoint con lai.
- Dashboard chi goi internal API co service auth, khong doc SQLite/file Upscale va khong expose service key ra renderer.

## 2026-08-24 Web Checkpoint and Background Processing

| Field | Value |
|---|---|
| UI Score | 5/5 |
| Function Score | 5/5 |
| Verdict | Approved |

## Findings

- Nhan `Chay nen — ban co the dong trang nay` nam gon duoi status, khong che anh va chi xuat hien sau khi checkpoint da luu.
- Reload khong them buoc thao tac: progress/ETA va result tu khoi phuc tu job dang chay.
- Stop van o dung vi tri cu va la hanh dong huy explicit; Electron desktop khong thay doi.
- Production page render day du, responsive classes giu nguyen va console sach.

## 2026-08-24 Onboarding Default Off

| Field | Value |
|---|---|
| UI Score | 5/5 |
| Function Score | 5/5 |
| Verdict | Approved |

## Findings

- App vao thang man hinh upscale, khong bi modal welcome chan luong chon anh.
- Settings co nut mo onboarding ro rang bang text localized san co.
- Khong them dialog/error/loading moi; hanh vi dong/mo van theo component dialog hien co.

## 2026-08-24 Default Scale 2X

| Field | Value |
|---|---|
| UI Score | 5/5 |
| Function Score | 5/5 |
| Verdict | Approved |

## Findings

- Default 2X giam kha nang gap loi output pixel limit voi anh lon.
- Nguoi dung van thay va chon duoc scale cao hon khi co nhu cau.
- Khong them buoc thao tac hay text moi vao giao dien.

## 2026-08-25 Local Mac Processing Option

| Field | Value |
|---|---|
| UI Score | 5/5 |
| Function Score | 5/5 |
| Verdict | Approved |

## Findings

- Toggle nam trong Settings dung vi tri voi cac option nang cao, mac dinh tat nen khong lam thay doi hanh vi cua nguoi dung binh thuong.
- Endpoint input chi hien khi bat option, giup UI gon va tranh nguoi dung moi bi roi.
- Mo ta noi ro chi bat khi Mac local worker dang online; khi offline runtime bao loi thay vi gui ngam len VPS.

## 2026-08-25 Queue Tab

| Field | Value |
|---|---|
| UI Score | 5/5 |
| Function Score | 5/5 |
| Verdict | Approved |

## Findings

- Queue nam giua Upscayl va Settings dung nhu yeu cau, de tim nhung khong chen vao flow upscale co san.
- Search, filter va pagination giu sidebar gon khi co nhieu anh.
- Moi item co progress/status rieng, Retry/Remove/Open result theo tung row; Stop dung item hien tai va pause queue de tranh xu ly tiep ngoai y muon.

## 2026-09-02 Queue Show In Main Viewer

| Field | Value |
|---|---|
| UI Score | 5/5 |
| Function Score | 5/5 |
| Verdict | Approved |

## Findings

- Icon mắt đặt cạnh các action queue, có tooltip/aria-label nên người dùng hiểu đây là thao tác xem chi tiết.
- Mở viewer chính giúp dùng lại vùng preview/comparison quen thuộc mà không làm thay đổi trạng thái xử lý queue.
# UX / Customer Feedback

## 2026-09-02 Library Tab

- UI: 4/5 — Library is placed before Queue, has clear empty state, thumbnails, view and delete actions.
- Function: 4/5 — completed results are persisted and automatically added; clear-all and per-item removal are available.
- Customer verdict: Approved.
- Residual note: browser-created blob URLs are session-scoped; desktop file paths persist reliably, while a later web-specific asset persistence enhancement may be useful.
