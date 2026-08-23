# Rule: Splitting File

## Muc tieu

Tu dong kich hoat khi file, module, hoac task co nguy co tran context size. Rule nay chia nho du an/file de de bao tri, review va quan ly.

## Dieu kien kich hoat

- File tren 500 dong hoac mot component gom nhieu trach nhiem.
- Task yeu cau doc qua nhieu module cung luc.
- Mot thay doi lam phinh file hien co thay vi them module rieng.
- Agent khong the giu du context de sua an toan.

## Quy tac

- Tach theo trach nhiem: UI, state, IPC, domain logic, utils, tests.
- Moi file moi phai co ten ro nghia va duoc import tu diem dung hien co.
- Khong tach chi de lam dep neu lam tang do phuc tap.
- Sau khi tach, cap nhat `.manager/implementation.md` voi so do file moi.

## Checklist

- [ ] Xac dinh ly do tach.
- [ ] Giu public API on dinh neu co the.
- [ ] Chay typecheck/build phu hop.
- [ ] Ghi mapping file cu -> file moi.
