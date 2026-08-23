# Rule: Dependency Boundary

## Muc tieu

Giu dependency ro rang giua renderer, electron main/preload, common va scripts.

## Quy tac

- Renderer khong import truc tiep module Node/Electron neu da co preload/API boundary.
- `common/` chi chua logic shared, type, constant, khong phu thuoc UI.
- Electron main/preload khong goi UI state truc tiep.
- Khi them package moi, ghi ly do va rui ro vao `.manager/implementation.md`.
