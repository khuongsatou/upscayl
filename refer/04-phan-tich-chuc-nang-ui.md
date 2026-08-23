# 04. Phân tích chi tiết từng chức năng UI

## Bảng chức năng chính

| Chức năng | File chính | Đầu vào | Đầu ra | Ghi chú |
|---|---|---|---|---|
| Chọn ảnh | `renderer/pages/index.tsx`, `select-file.ts` | User click, dialog chọn file | `imagePath`, preview ảnh | Hỗ trợ `png`, `jpg`, `jpeg`, `jfif`, `webp`. |
| Kéo thả ảnh | `main-content/index.tsx` | File drag/drop | `imagePath`, output folder mặc định | Validate MIME type và extension. |
| Dán ảnh clipboard | `main-content/index.tsx`, `paste-image.ts` | Clipboard file image + output path | File tạm `.temp-*` trong output folder | Cần chọn output folder trước. |
| Batch Upscayl | `upscayl-steps.tsx`, `sidebar/index.tsx` | Toggle batch + folder | Payload `FOLDER_UPSCAYL` | Không dùng double upscale. |
| Chọn model | `select-model-dialog.tsx` | Model mặc định hoặc custom | `selectedModelId` | Có ảnh before/after minh họa model. |
| Double Upscayl | `upscayl-steps.tsx` | Checkbox trong single mode | Payload `DOUBLE_UPSCAYL` | Chạy hai lượt xử lý ảnh. |
| Chọn output folder | `upscayl-steps.tsx`, `select-folder.ts` | Dialog folder | `savedOutputPath` | Có cơ chế bookmark cho Mac App Store build. |
| Start Upscayl | `sidebar/index.tsx` | State UI + settings | IPC payload | Tự chọn single/batch/double theo mode. |
| Progress bar | `progress-bar.tsx`, `pages/index.tsx` | Event progress từ Electron | UI percent/status | Có nút stop gửi `STOP`. |
| Preview kết quả | `slider-view.tsx`, `lens-view.tsx` | Ảnh gốc + ảnh upscaled | So sánh slider/lens | Dùng `sanitizePath` để tạo URL local an toàn hơn. |
| More options drawer | `more-options-drawer.tsx` | User mở drawer | Reset, view mode, zoom, stats | Stats lấy từ `userStatsAtom`. |
| Settings | `settings-tab/index.tsx` | User cấu hình | Jotai storage/localStorage | Điều khiển format, scale, GPU, custom model, TTA, metadata. |
| Logs | `log-area.tsx`, `use-logger.ts` | Log renderer/backend | Text log có thể copy | Hỗ trợ debug lỗi GPU/path/model. |
| System info | `system-info.tsx`, `use-system-info.ts` | Electron API | Thông tin thiết bị | Dùng trong support/debug/contribution. |

## Các bước người dùng trong tab Upscayl

| Bước UI | Nội dung | Điều kiện |
|---|---|---|
| Bước 1 | Chọn hình ảnh hoặc chọn thư mục nếu batch mode bật. | File/folder hợp lệ. |
| Bước 2 | Chọn model AI, bật Double Upscayl nếu đang ở single mode, chọn scale nhanh. | Custom model chỉ hiện sau khi scan folder model. |
| Bước 3 | Đặt thư mục đầu ra. | Nếu không chọn, nút Upscayl sẽ hiện cảnh báo. |
| Bước 4 | Xem độ phân giải dự kiến và bấm Upscayl. | Khi job đang chạy, nút đổi sang trạng thái in-progress. |

## Settings chi tiết

| Setting | Atom | Đầu vào | Ảnh hưởng pipeline |
|---|---|---|---|
| Lưu hình ảnh dưới dạng | `saveImageAsAtom` | `png`, `jpg`, `webp` | CLI `-f`, phần mở rộng output. |
| Sao chép metadata | `copyMetadataAtom` | Toggle | Sau khi binary xong, gọi exiftool copy EXIF. |
| Tỷ lệ hình ảnh | `scaleAtom` | Slider 1-16 | CLI `-s` nếu cần; UI cảnh báo scale >= 6. |
| Chiều rộng đầu ra tùy chỉnh | `useCustomWidthAtom`, `customWidthAtom` | Toggle + number | CLI `-w`; ghi đè scale. |
| Nén hình ảnh | `compressionAtom` | Slider 0-100 | CLI `-c`; PNG lossless, JPG/WebP lossy. |
| Ghi đè upscale trước đó | `overwriteAtom` | Toggle | Single image sẽ xử lý lại nếu file output đã tồn tại. |
| Lưu thư mục đầu ra | `rememberOutputFolderAtom` | Toggle | Giữ output folder qua phiên làm việc. |
| Tắt thông báo | `turnOffNotificationsAtom` | Toggle | Main process đọc setting để điều khiển notification. |
| Auto update | `autoUpdateAtom` | Toggle | Main window check update khi app production. |
| Giúp cải thiện Upscayl | `enableContributionAtom` | Toggle | Bật/tắt PostHog provider wrapper. |
| GPU ID | `gpuIdAtom` | Text | CLI `-g`, hỗ trợ ví dụ `0`, `1`, `0,1`. |
| Kích thước tile | `tileSizeAtom` | Number | CLI `-t`, có thể giúp GPU yếu/VRAM thấp. |
| Custom model folder | `customModelsPathAtom` | Folder tên `models` | Scan `.bin`/`.param`, thêm model vào dialog. |
| TTA Mode | `ttaModeAtom` | Toggle | CLI `-x`, tăng chất lượng nhưng chậm hơn đáng kể. |

## Model mặc định

| Model ID | Tên tiếng Việt trong locale | Mục đích |
|---|---|---|
| `upscayl-standard-4x` | Upscayl Standard | Phù hợp đa số hình ảnh. |
| `upscayl-lite-4x` | Upscayl Lite | Ưu tiên tốc độ, mất chất lượng tối thiểu. |
| `high-fidelity-4x` | Độ trung thực cao | Chi tiết thực tế và kết cấu mượt. |
| `remacri-4x` | Remacri | Ảnh tự nhiên, sắc nét và nhiều chi tiết, không thương mại. |
| `ultramix-balanced-4x` | Ultramix | Cân bằng sắc nét/chi tiết cho ảnh tự nhiên, không thương mại. |
| `ultrasharp-4x` | Ultrasharp | Tập trung độ sắc nét, không thương mại. |
| `digital-art-4x` | Nghệ thuật Kỹ thuật số | Dành cho minh họa và digital art. |
