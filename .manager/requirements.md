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
