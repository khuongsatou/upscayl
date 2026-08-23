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
