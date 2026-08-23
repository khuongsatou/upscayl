# Test Report

| Field | Value |
|---|---|
| Date | 2026-08-23 |
| Tester | QA Tester |
| Status | Pass |

## Checks

- Kiem tra du cau truc thu muc `.agent`, `.manager`, `.feedback`.
- Kiem tra `.feedback/qa_coverage.json` la JSON hop le.
- Khong chay app/build vi task chi bootstrap tai lieu van hanh.

## Residual Risk

- Chua co test app runtime vi khong thay doi code ung dung.

## 2026-08-23 Web Runtime Refactor

| Command | Result |
|---|---|
| `npm run tsc` | Pass |
| `npm run build` | Pass |
| `npm run web:build` | Pass |
| `npm run web:start -- -p 3030` | Pass, serving `http://localhost:3030` |
| `curl -I http://localhost:3030` | Pass, HTTP 200 |

## Residual Risk

- Web adapter expects an upscale backend at `NEXT_PUBLIC_UPSCAYL_WEB_API_URL` or `/api/upscayl`; this refactor does not implement server-side NCNN processing.
- Manual browser file-selection QA was not completed beyond HTTP render verification.

## 2026-08-23 Playwright Stability Check

| Check | Result |
|---|---|
| Desktop web render at `http://localhost:3030` | Pass |
| Mobile web render at 390x844 | Pass |
| Single image browser file picker and preview | Pass |
| Settings tab after image selection | Pass |
| Web output fallback | Pass, `web-output://download` |
| Upscayl click without backend | Pass, concise controlled 404 toast |
| Batch folder picker with `webkitdirectory` | Pass |
| Error boundary check | Pass, no app error boundary |
| Screenshot evidence | `/tmp/upscayl-web-desktop.png`, `/tmp/upscayl-web-mobile.png` |

## Fixes From QA

- Removed browser crash in Settings caused by assuming `navigator.userAgent` contains `Upscayl/<version>`.
- Added a browser output fallback so web jobs are not blocked by missing desktop file paths.
- Normalized web backend HTML/404 errors into a concise message.

## 2026-08-23 Web Upscale Backend

| Check | Result |
|---|---|
| `npm run tsc` | Pass |
| `npm run web:build` | Pass |
| `npm run build` | Pass |
| Direct single API call | Pass, `/tmp/upscayl-api-output.bin` PNG 1024x1024 |
| Direct double API call | Pass, `/tmp/upscayl-double-output.png` PNG 512x512 |
| Direct batch API call | Pass, `/tmp/upscayl-batch-output.zip` contains 2 PNG outputs |
| Playwright single UI flow | Pass, original blob 256x256 and output blob 1024x1024 |
| Playwright batch UI flow | Pass, done state visible and no backend 404 |
| Web abort/Stop server process check | Pass, aborted request returns `AbortError` and no `upscayl-bin` process remains |
| Error boundary / console errors | Pass, none in Playwright backend UI flow |

## Notes

- `npm run build` logs a Next warning that static export disables API routes. This is expected for Electron, because desktop uses IPC; web server mode uses `npm run web:*`.

## 2026-08-23 Rescan After Backend Implementation

| Check | Result |
|---|---|
| Code scan: API payload validation | Hardened scale, compression, custom width, tile size, GPU ID |
| Code scan: upload validation | Hardened to PNG/JPG/JPEG/WEBP only |
| Code scan: batch zip filenames | Hardened to strip internal upload UUID prefixes |
| `npm run tsc` | Pass |
| `npm run web:build` | Pass |
| Direct single API call | Pass, PNG 1024x1024 |
| Direct batch API call | Pass, zip contains `to_upscale.png` and `download.png` |
| Invalid scale API call | Pass, rejected before spawn |
| Invalid file API call | Pass, rejected before spawn |
| Playwright UI single + batch backend flow | Pass, no console errors or error boundary |
| `npm run build` | Pass |

## 2026-08-24 VPS Deployment QA

| Check | Result |
|---|---|
| Local `npm run tsc` | Pass |
| Linux production web build with `/upscale` base path | Pass |
| Nginx config test and reload | Pass |
| systemd service | Active, enabled, zero unexpected restarts |
| Public page, CSS and JavaScript | Pass, HTTP 200 over HTTPS |
| Public API route | Pass, GET rejected with HTTP 405 |
| Real VPS upscale | Pass, 128x128 PNG -> 512x512 PNG in about 7.8 seconds |
| Concurrent request protection | Pass, one HTTP 200 and one HTTP 429 |
| Process cleanup | Pass, no lingering `upscayl-bin` process |
| Browser UI smoke test | Pass, title and main controls visible, no console warning/error |
| Service memory during smoke test | Peak about 580 MB |

## Residual Risk

- VPS khong co GPU vat ly; Vulkan chay bang CPU `llvmpipe`, nen anh lon va double/batch se cham.
- `npm audit --omit=dev` con 25 advisory (4 moderate, 19 high, 2 critical), phan lon qua dependency Firebase/Electron; can task nang cap dependency rieng.
- Public upscale endpoint chua co authentication; concurrency duoc gioi han mot job nhung van co nguy co bi lam dung tai nguyen.

## 2026-08-24 Web Progress QA

| Check | Result |
|---|---|
| `npm run tsc` | Pass |
| Production web build with `/upscale` base path | Pass locally and on VPS |
| Single progress | Pass, observed 0, 2, 4, 6, 8, 11, 13, 15, 17, 25, 50, 100 |
| Single output | Pass, 128x128 PNG -> 512x512 PNG |
| Double progress | Pass, monotonic 0-100 across two passes |
| Double output | Pass, 32x32 PNG -> 512x512 PNG |
| Batch progress | Pass, monotonic 0-100 across two images |
| Batch output | Pass, zip contains both expected PNG files |
| Abort during model load | Pass, stopped at 6 percent with error state and no child process left |
| Browser smoke test | Pass, public route renders and has no console warning/error |
| VPS service | Active, zero unexpected restarts |

## 2026-08-24 Non-blocking Progress Bar QA

| Check | Result |
|---|---|
| `npm run tsc` | Pass |
| Production web build | Pass locally and on VPS |
| Desktop visual state | Pass, compact 50px bar does not cover the image |
| Pointer events | Pass, outer wrapper none and inner controls auto |
| Interaction during job | Pass, switched to Settings while progress and Stop remained visible |
| Stop control | Pass, icon button has localized accessible label and tooltip |
| Public API regression | Pass, HTTP 200 PNG output after deploy |
| Public browser smoke | Pass, app visible with no console warning/error |
| Responsive implementation | Base class is full viewport; desktop sidebar offset starts at `md` |

## Residual Risk

- Browser viewport override did not resize the final Chrome window to 390px, so final mobile visual screenshot was not available; responsive constraints are present in the built CSS.

## 2026-08-24 Model Comparison Image Hotfix QA

| Check | Result |
|---|---|
| Reproduction before fix | Confirmed, 14/14 thumbnail images had natural width 0 |
| Correct public asset path | Pass, `/upscale/model-comparison/...` returns HTTP 200 WebP |
| `npm run tsc` | Pass |
| `npm run web:build` | Pass |
| `npm run build` | Pass, expected static-export API warning only |
| Local Playwright thumbnails | Pass, 14/14 loaded |
| Local Playwright zoom | Pass, 2/2 loaded |
| Production Playwright thumbnails | Pass, 14/14 loaded, none pending/broken |
| Production Playwright zoom | Pass, 2/2 loaded |
| Production console | Pass, no warning/error |
| VPS service | Active after release switch |
