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
