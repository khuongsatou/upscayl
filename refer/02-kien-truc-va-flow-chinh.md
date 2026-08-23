# 02. Kiến trúc và flow chính

## Kiến trúc runtime

| Layer | File đại diện | Trách nhiệm |
|---|---|---|
| Bootstrap Electron | `electron/index.ts` | Khởi tạo Next renderer, protocol file/public, tạo window, đăng ký IPC. |
| Main window | `electron/main-window.ts` | Cấu hình BrowserWindow, load dev/prod URL, mở external link, auto update. |
| Preload bridge | `electron/preload.ts` | Expose `window.electron.send/on/invoke`, platform, system info, app version. |
| IPC contract | `common/electron-commands.ts` | Tập trung tên command/event để main và renderer dùng chung. |
| Renderer page | `renderer/pages/index.tsx` | State chính của màn hình, event listener từ Electron, chọn ảnh/thư mục. |
| Sidebar | `renderer/components/sidebar/index.tsx` | Gom payload và gửi job upscale theo mode. |
| Main content | `renderer/components/main-content/index.tsx` | Drag/drop/paste, progress, preview ảnh, open output folder. |
| Settings | `renderer/components/sidebar/settings-tab/*` | Format, scale, compression, GPU ID, custom model, tile size, TTA, metadata. |

## Flow khởi động app

| Bước | Thành phần | Mô tả |
|---|---|---|
| 1 | `electron/index.ts` | `app.on("ready")` gọi `prepareNext("./renderer")`. |
| 2 | `protocol.registerFileProtocol` | Đăng ký protocol `file://` và `public://` để renderer hiển thị ảnh/local assets. |
| 3 | `createMainWindow()` | Tạo BrowserWindow kích thước 1300x940, preload `preload.js`, titlebar theo OS. |
| 4 | `fetchLocalStorage()` | Main process đọc localStorage của renderer để nhớ đường dẫn gần nhất và notification setting. |
| 5 | IPC registration | Đăng ký các command chọn file, chọn folder, upscale, batch, double, stop, paste, model. |
| 6 | Renderer render | `renderer/pages/index.tsx` hiển thị sidebar + main content và đăng ký event listener. |

## Flow chọn ảnh đơn

| Bước | Input | Xử lý | Output |
|---|---|---|---|
| 1 | User bấm `Chọn Hình ảnh` | Renderer gọi `window.electron.invoke(SELECT_FILE)`. | Yêu cầu IPC tới main process. |
| 2 | Dialog Electron | `select-file.ts` mở file dialog, filter `png/jpg/jpeg/jfif/webp`. | Trả về path hoặc `null`. |
| 3 | Validate UI | Renderer kiểm tra extension trong `VALID_IMAGE_FORMATS`. | Set `imagePath`, reset state lỗi nếu sai. |
| 4 | Output folder mặc định | Nếu không bật nhớ output folder, lấy thư mục chứa ảnh làm output. | `savedOutputPathAtom` được cập nhật. |
| 5 | Preview ảnh | `ImageViewer` đọc path đã sanitize. | Người dùng thấy ảnh gốc và kích thước. |

## Flow chạy upscale

| Bước | Thành phần | Mô tả |
|---|---|---|
| 1 | Sidebar `upscaylHandler` | Kiểm tra có `imagePath` hoặc `batchFolderPath`, set progress `Chờ một chút...`. |
| 2 | Chọn mode | Nếu `doubleUpscayl` true gửi `DOUBLE_UPSCAYL`; nếu `batchMode` true gửi `FOLDER_UPSCAYL`; còn lại gửi `UPSCAYL`. |
| 3 | Electron handler | Decode path, tính output filename/folder, chọn `modelsPath` hoặc custom model path. |
| 4 | Build arguments | `get-arguments.ts` tạo mảng đối số CLI. |
| 5 | Spawn binary | `spawn-upscayl.ts` chạy `upscayl-bin` với args đã lọc rỗng. |
| 6 | Progress | Handler nghe `stderr.data`, gửi progress/event về renderer. |
| 7 | Done/error | Handler gửi `*_DONE` hoặc `UPSCAYL_ERROR`, notification, copy metadata nếu bật. |
| 8 | UI result | Renderer clear progress, set output path, hiển thị slider/lens hoặc nút mở folder. |

## Event flow IPC

| Hướng | Command/event | Vai trò |
|---|---|---|
| Renderer -> Main | `SELECT_FILE`, `SELECT_FOLDER` | Mở dialog native. |
| Main -> Renderer | Return invoke result | Trả path được chọn. |
| Renderer -> Main | `UPSCAYL`, `FOLDER_UPSCAYL`, `DOUBLE_UPSCAYL` | Bắt đầu job xử lý ảnh. |
| Main -> Renderer | `UPSCAYL_PROGRESS`, `FOLDER_UPSCAYL_PROGRESS`, `DOUBLE_UPSCAYL_PROGRESS` | Cập nhật phần trăm hoặc trạng thái xử lý. |
| Main -> Renderer | `SCALING_AND_CONVERTING` | Báo giai đoạn resize/convert sau khi model chạy. |
| Main -> Renderer | `*_DONE` | Báo hoàn tất và gửi path kết quả. |
| Main -> Renderer | `UPSCAYL_WARNING`, `UPSCAYL_ERROR`, `METADATA_ERROR` | Báo cảnh báo/lỗi để UI hiện toast. |
| Renderer -> Main | `STOP` | Dừng toàn bộ child process đang chạy. |

## State flow

| State | Nguồn | Nơi dùng | Ghi chú |
|---|---|---|---|
| `selectedModelId` | Jotai storage | Sidebar, model dialog, payload | Mặc định `upscayl-standard-4x`. |
| `scale` | Jotai storage | Scale selector, payload | Mặc định `4`, slider 1-16. |
| `savedOutputPath` | Jotai storage | Output selector, paste, payload | Có thể tự lấy theo thư mục ảnh nếu không bật remember. |
| `saveImageAs` | Jotai storage | Settings, payload, CLI `-f` | `png`, `jpg`, `webp`. |
| `compression` | Jotai storage | Settings, payload, CLI `-c` | 0-100. |
| `gpuId` | Jotai storage/localStorage | Settings, payload, CLI `-g` | Rỗng thì không truyền `-g`. |
| `tileSize` | Jotai storage | Settings, payload, CLI `-t` | Null/rỗng thì để binary auto. |
| `ttaMode` | Jotai storage | Settings, payload, CLI `-x` | Chất lượng tốt hơn nhưng chậm hơn. |
| `copyMetadata` | Jotai storage | Settings, Electron handler | Gọi exiftool sau khi upscale xong. |
