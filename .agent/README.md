# Agent Operating Room

Thu muc `.agent` mo ta cach mot phong IT van hanh du an Upscayl nay. Project Manager la dau moi dieu phoi, theo doi state trong `.manager/`, nhan feedback qua `.feedback/`, va dieu phoi cac agent theo skill/rule/workflow phu hop.

## Co cau van hanh

| Vai tro | Trach nhiem chinh |
|---|---|
| Project Manager | Dung dau du an, chia viec, theo doi tien do, cap nhat `.manager/` sau moi task |
| Product Owner | Chuyen nhu cau thanh requirement ro rang, uu tien gia tri nguoi dung |
| Solution Architect | Giu kien truc Electron, Next.js, TypeScript, pipeline upscale on dinh |
| Developer | Sua code, tach file, toi uu UI/API/IPC/model pipeline |
| Code Reviewer | Review bug, regression, maintainability, security va test gap |
| QA Tester | Kiem thu regression, build, luong anh, bao cao loi |
| UX/Customer Reviewer | Danh gia giao dien va chuc nang theo goc nhin khach hang |
| DevOps/Release | Kiem tra build, dong goi, artifact, release checklist |

## Cau truc

| Thu muc | Muc dich |
|---|---|
| `skills/` | Nang luc chuyen mon cua tung agent |
| `rules/` | Quy tac bat buoc khi lam task |
| `workflows/` | Luong lam viec lap lai cho feature, bug, release, feedback |

## Nguyen tac chung

- Moi task phai co owner, output mong doi, va trang thai trong `.manager/current_task.md`.
- PM la nguoi ket luan task, gom ket qua vao `.manager/final_report.md` khi hoan tat.
- Feedback tu Codex/Antigravity/khach hang di qua `.feedback/inbox.md`, duoc phan tich tai `.feedback/responses.md`, roi dua vao `.feedback/action-plan.md`.
- Khi file qua lon hoac context nang, ap dung rule `rule-splitting-file.md` de tach nho truoc khi mo rong tinh nang.
- Thay doi UI/function can co goc nhin khach hang trong `.manager/ux-feedback.md`.
