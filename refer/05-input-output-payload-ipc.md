# 05. Đầu vào, đầu ra và payload IPC

## Payload ảnh đơn: `ImageUpscaylPayload`

| Field | Kiểu | Đầu vào từ | Ý nghĩa |
|---|---|---|---|
| `imagePath` | string | Chọn/kéo/dán ảnh | Đường dẫn ảnh gốc. |
| `outputPath` | string | Output folder atom | Thư mục lưu ảnh kết quả. |
| `scale` | string | Scale slider | Tỷ lệ upscale/resize. |
| `model` | string | Model dialog | Tên model NCNN. |
| `gpuId` | string/null | Settings GPU ID | GPU Vulkan cụ thể; rỗng thì để auto. |
| `saveImageAs` | image format | Settings format | Định dạng xuất. |
| `overwrite` | boolean | Settings overwrite | Có xử lý lại nếu output file đã tồn tại không. |
| `compression` | string | Settings compression | Giá trị nén 0-100. |
| `noImageProcessing` | boolean | Atom | Có trong contract nhưng chưa thấy được dùng trong handler hiện tại. |
| `customWidth` | string/null | Custom resolution | Chiều rộng output nếu bật custom width. |
| `useCustomWidth` | boolean | Custom resolution toggle | Bật/tắt custom width. |
| `tileSize` | number/null | Tile size input | Kích thước tile cho binary. |
| `ttaMode` | boolean | TTA toggle | Bật Test-Time Augmentation. |
| `copyMetadata` | boolean | Copy metadata toggle | Copy EXIF/metadata sau xử lý. |

## Payload batch: `BatchUpscaylPayload`

| Field | Ý nghĩa |
|---|---|
| `batchFolderPath` | Thư mục chứa ảnh đầu vào. |
| `outputPath` | Thư mục cha để tạo folder output batch. |
| `model`, `gpuId`, `saveImageAs`, `scale`, `compression`, `customWidth`, `useCustomWidth`, `tileSize`, `ttaMode`, `copyMetadata` | Tương tự ảnh đơn. |
| `noImageProcessing` | Có trong payload nhưng chưa được handler batch sử dụng. |

## Payload double: `DoubleUpscaylPayload`

| Field | Ý nghĩa |
|---|---|
| `imagePath` | Ảnh gốc. |
| `outputPath` | Nơi lưu output cuối. |
| `model`, `gpuId`, `saveImageAs`, `scale`, `compression`, `customWidth`, `useCustomWidth`, `tileSize`, `ttaMode`, `copyMetadata` | Tương tự ảnh đơn. |
| `noImageProcessing` | Có trong contract nhưng chưa được handler double sử dụng. |

## Output path naming

| Mode | Pattern |
|---|---|
| Single image | `{outputDir}/{fileName}_upscayl_{scale}x_{model}.{format}` |
| Single custom width | `{outputDir}/{fileName}_upscayl_{customWidth}px_{model}.{format}` |
| Batch folder | `{outputPath}/upscayl_{format}_{model}_{scale}x` |
| Batch custom width | `{outputPath}/upscayl_{format}_{model}_{customWidth}px` |
| Double upscale | Dùng cùng pattern file của single image, nhưng ghi qua hai pass. |

## Event đầu ra từ Electron

| Event | Payload | Renderer xử lý |
|---|---|---|
| `UPSCAYL_PROGRESS` | Text progress/error từ binary | Set percent nếu text ngắn; detect lỗi. |
| `FOLDER_UPSCAYL_PROGRESS` | Text progress/error từ binary | Set percent/success; detect lỗi. |
| `DOUBLE_UPSCAYL_PROGRESS` | Text progress/error từ binary | Set percent, đếm lượt pass khi progress về `0.00%`. |
| `SCALING_AND_CONVERTING` | Không cần payload | Set progress sang trạng thái đang xử lý/convert. |
| `UPSCAYL_DONE` | Output file path | Clear progress, set ảnh kết quả. |
| `FOLDER_UPSCAYL_DONE` | Output folder path | Clear progress, hiện nút mở folder. |
| `DOUBLE_UPSCAYL_DONE` | Output file path | Clear progress, set ảnh kết quả sau delay ngắn. |
| `UPSCAYL_WARNING` | Message | Toast cảnh báo. |
| `UPSCAYL_ERROR` | Message | Toast lỗi, reset image paths. |
| `METADATA_ERROR` | Error | Toast lỗi metadata. |

## Định dạng hợp lệ

| Nhóm | Giá trị |
|---|---|
| Input renderer validate | `png`, `jpg`, `jpeg`, `jfif`, `webp`. |
| Electron file dialog | `png`, `jpg`, `jpeg`, `jfif`, `webp` và biến thể viết hoa. |
| Output format | `png`, `jpg`, `jpeg`, `webp` theo type, UI chính chọn `png`, `jpg`, `webp`. |
| Cloud API upload MIME | `image/jpeg`, `image/png`, `image/webp`. |

## Tác dụng phụ

| Tác dụng phụ | Nơi xảy ra |
|---|---|
| Lưu state vào localStorage | Jotai `atomWithStorage`, một số handler gọi `localStorage.setItem`. |
| Lưu security scoped bookmark | macOS App Store build qua `electron-settings`. |
| Ghi file tạm từ clipboard | `paste-image.ts` ghi vào output folder. |
| Ghi file ảnh output | `upscayl-bin` tạo file/thư mục kết quả. |
| Copy metadata | `exiftool-vendored` ghi metadata vào output file. |
| Notification hệ thống | `show-notification.ts` sau khi job xong/lỗi. |
| Telemetry nếu bật | PostHog capture `app_launched`, `model_selected`. |
