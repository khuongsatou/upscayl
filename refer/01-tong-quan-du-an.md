# 01. Tổng quan dự án Upscayl

## Mục tiêu sản phẩm

Upscayl là ứng dụng desktop mã nguồn mở dùng AI để phóng to và cải thiện ảnh độ phân giải thấp. Dự án trong workspace này là một app Electron kết hợp Next.js/React cho giao diện, TypeScript cho main/renderer/shared code, và binary `upscayl-bin` dựa trên Real-ESRGAN/NCNN Vulkan để xử lý ảnh cục bộ.

## Công nghệ chính

| Nhóm | Công nghệ | Vai trò |
|---|---|---|
| Desktop runtime | Electron | Tạo cửa sổ app, IPC, dialog chọn file/thư mục, notification, auto update. |
| UI | Next.js 15, React, Tailwind CSS, DaisyUI | Xây dựng màn hình chọn ảnh, cài đặt, tiến trình, preview trước/sau. |
| State | Jotai, `atomWithStorage` | Lưu lựa chọn model, scale, format, output path, thống kê sử dụng vào localStorage. |
| Xử lý ảnh | `resources/*/bin/upscayl-bin` | Binary thực thi upscale thật qua command-line arguments. |
| Model | NCNN `.bin` + `.param` | Các model mặc định trong `resources/models`, model tùy chỉnh trong thư mục người dùng chọn. |
| Metadata | `exiftool-vendored` | Sao chép metadata/EXIF từ ảnh gốc sang ảnh đầu ra khi người dùng bật tùy chọn. |
| Tài liệu API | OpenAPI + MDX | Mô tả Upscayl Cloud API: upload, start task, status, history. |
| Build/release | TypeScript, Next build, Electron Builder | Đóng gói macOS, Windows, Linux, MAS. |

## Cấu trúc thư mục đáng chú ý

| Đường dẫn | Ý nghĩa |
|---|---|
| `electron/` | Main process, preload bridge, IPC command handlers, spawn binary. |
| `renderer/` | Next.js renderer app, UI components, atoms, hooks, locales. |
| `common/` | Contract dùng chung: IPC command names, payload types, model list, path helpers. |
| `resources/` | Binary theo hệ điều hành và model mặc định được đóng gói theo app. |
| `models/` | Một số model Real-ESRGAN anime video x2/x3/x4 ở repo root. |
| `docs/` | Tài liệu người dùng và OpenAPI cho Upscayl Cloud. |
| `apis/` | Requestly/OpenAPI collection mẫu cho API Upscayl. |

## Luồng lớn của ứng dụng

```text
Người dùng
  -> Renderer UI chọn ảnh/thư mục, model, scale, output, settings
  -> Preload expose window.electron
  -> Electron IPC main process
  -> Command handler build đối số CLI
  -> spawn upscayl-bin
  -> Binary xử lý ảnh bằng model NCNN/Vulkan
  -> stderr/stdout progress/error
  -> Electron gửi event về Renderer
  -> UI cập nhật progress, preview, toast, notification
```

## Các chế độ xử lý chính

| Chế độ | Entry UI | IPC command | Handler Electron | Đầu ra |
|---|---|---|---|---|
| Ảnh đơn | Chọn ảnh rồi bấm Upscayl | `UPSCAYL` | `electron/commands/image-upscayl.ts` | Một file ảnh mới trong output folder. |
| Batch folder | Bật Batch Upscayl, chọn thư mục | `FOLDER_UPSCAYL` | `electron/commands/batch-upscayl.ts` | Một thư mục output chứa ảnh đã xử lý. |
| Double Upscayl | Bật Double Upscayl trong single mode | `DOUBLE_UPSCAYL` | `electron/commands/double-upscayl.ts` | Một ảnh xử lý qua hai lượt model. |
| Paste ảnh | Dán ảnh từ clipboard | `PASTE_IMAGE` | `electron/commands/paste-image.ts` | File tạm trong output folder, sau đó dùng như ảnh đầu vào. |
| Custom model | Chọn thư mục `models` | `SELECT_CUSTOM_MODEL_FOLDER`, `GET_MODELS_LIST` | `custom-models-select.ts`, `get-models-list.ts` | Danh sách model tùy chỉnh hiển thị trong dialog. |

## Nhận định nhanh

Điểm mạnh của dự án là tách khá rõ vai trò: renderer lo UX/state, Electron main lo quyền hệ thống và process, `common/` giữ contract chung, còn binary/model lo compute. Điều này giúp app giữ được trải nghiệm desktop thân thiện mà vẫn tận dụng pipeline AI native hiệu năng cao.
