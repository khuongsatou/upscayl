# 03. Pipeline upscale desktop

## Pipeline ảnh đơn

| Giai đoạn | File | Đầu vào | Xử lý | Đầu ra |
|---|---|---|---|---|
| Nhận payload | `image-upscayl.ts` | `ImageUpscaylPayload` | Lấy `tileSize`, `compression`, `ttaMode`, `scale`, `customWidth`, `model`, `gpuId`, `saveImageAs`, `overwrite`, `imagePath`, `outputPath`. | Biến runtime chuẩn hóa. |
| Chuẩn hóa path | `decode-path.ts`, `get-directory-from-path.ts`, `get-file-name.ts` | Path từ renderer | Decode URI, tách thư mục/file name. | `inputDir`, `outputDir`, `fileNameWithExt`, `fileName`. |
| Tạo output name | `image-upscayl.ts` | File name, scale/custom width, model, format | Ghép pattern `ten_upscayl_4x_model.png` hoặc `ten_upscayl_1320px_model.jpg`. | `outFile`. |
| Kiểm tra tồn tại | `fs.existsSync(outFile)` | Output path | Nếu file đã có và `overwrite=false`, bỏ qua xử lý. | Gửi `UPSCAYL_DONE`. |
| Chọn model path | `MODELS`, `modelsPath`, `savedCustomModelsPath` | `model` | Model mặc định dùng `resources/models`; custom dùng folder người dùng chọn. | `modelsPath` thực tế. |
| Build command | `getSingleImageArguments` | Payload đã chuẩn hóa | Tạo args cho `upscayl-bin`. | Mảng CLI args. |
| Spawn process | `spawnUpscayl` | `execPath`, args | Chạy binary, lưu child process. | Process đang chạy. |
| Theo dõi tiến trình | `stderr.on("data")` | Text từ binary | Nếu text ngắn cập nhật progress, nếu có `Resizing` báo đang xử lý hậu kỳ. | `UPSCAYL_PROGRESS`, `SCALING_AND_CONVERTING`. |
| Xử lý lỗi | `onError` | Text chứa `Error` hoặc `failed` | Kill process, set progress bar -1, gửi lỗi. | `UPSCAYL_ERROR`. |
| Hoàn tất | `onClose` | Process close không failed/stopped | Copy metadata nếu bật, gửi done, notification. | Ảnh upscale cuối cùng. |

## Pipeline batch folder

| Giai đoạn | Đặc điểm |
|---|---|
| Input | `batchFolderPath`, `outputPath`, model, scale, format, compression, GPU, custom width, tile size, TTA, metadata. |
| Output folder | Tạo thư mục `upscayl_{format}_{model}_{scale}x` hoặc `upscayl_{format}_{model}_{customWidth}px`. |
| Command | `getBatchArguments` dùng `-i` là thư mục input, `-o` là thư mục output. |
| Progress | Gửi `FOLDER_UPSCAYL_PROGRESS`; UI nhận phần trăm và trạng thái success/error. |
| Done | Gửi `FOLDER_UPSCAYL_DONE` với output folder, UI hiện nút mở folder. |
| Metadata | Có ý định lặp qua output files và copy metadata, nhưng đoạn mapping hiện tại dùng tên file output để tìm file gốc cùng tên nên có khả năng không khớp nếu binary đổi tên file. |

## Pipeline double upscale

| Pass | Input | Output | Ghi chú |
|---|---|---|---|
| Lượt 1 | Ảnh gốc | `outFile` | Gọi `getDoubleUpscaleArguments`; không truyền compression/custom width/TTA ở lượt 1. |
| Lượt 2 | Chính `outFile` từ lượt 1 | Ghi đè lại `outFile` | Gọi `getDoubleUpscaleSecondPassArguments`; truyền compression/custom width/TTA. |
| Hoàn tất | `outFile` sau lượt 2 | Renderer nhận `DOUBLE_UPSCAYL_DONE` | Có thể tạo ảnh rất lớn; UI có cảnh báo hiệu năng cho scale cao. |

## Cách build command cho binary

| CLI option | Nguồn dữ liệu | Ý nghĩa |
|---|---|---|
| `-i` | `inputDir + fileName` hoặc folder | Đường dẫn ảnh/thư mục đầu vào. |
| `-o` | `outFile` hoặc output folder | Đường dẫn file/thư mục đầu ra. |
| `-s` | `scale` | Chỉ truyền khi scale người dùng chọn khác scale gốc của model và không dùng custom width. |
| `-m` | `modelsPath` | Thư mục chứa model `.bin`/`.param`. |
| `-n` | `model` | Tên model, ví dụ `upscayl-standard-4x`. |
| `-g` | `gpuId` | ID GPU Vulkan, chỉ truyền nếu người dùng nhập. |
| `-f` | `saveImageAs` | Định dạng xuất: `png`, `jpg`, `webp`. |
| `-w` | `customWidth` | Chiều rộng output tùy chỉnh, ghi đè scale. |
| `-c` | `compression` | Nén ảnh đầu ra. |
| `-t` | `tileSize` | Kích thước tile tùy chỉnh. |
| `-x` | `ttaMode` | Bật Test-Time Augmentation. |

## Logic scale model

`common/check-model-scale.ts` suy luận scale gốc từ tên model:

| Tên model chứa | Scale gốc |
|---|---|
| `x2` hoặc `2x` | `2` |
| `x3` hoặc `3x` | `3` |
| Còn lại | `4` |

Nếu scale người dùng chọn khác scale gốc và không dùng custom width, app truyền `-s`. Theo tài liệu guide, với model mặc định x4, các tỷ lệ không native được xử lý bằng upscale x4 rồi downscale/resize về tỷ lệ mong muốn.

## Error handling

| Tín hiệu lỗi | Nơi phát hiện | UI phản hồi |
|---|---|---|
| Text chứa `Error` hoặc `failed` | Electron handler nghe stderr | Kill process, gửi `UPSCAYL_ERROR`. |
| Text chứa `Invalid GPU` | Renderer `handleErrors` | Toast lỗi GPU, hướng dẫn mở docs/copy error. |
| Text chứa `write` hoặc `read` | Renderer `handleErrors` | Toast lỗi quyền đọc/ghi, reset image paths. |
| Text chứa `tile size` | Renderer `handleErrors` | Toast lỗi tile size. |
| Text chứa `uncaughtException` | Renderer `handleErrors` | Toast lỗi exception chung. |
| Metadata copy lỗi | `copyMetadata` catch | Gửi `METADATA_ERROR`, UI toast. |
