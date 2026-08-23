# 07. API Cloud và tài liệu

## Phân biệt desktop và cloud

| Nhánh | Vị trí | Trạng thái trong app |
|---|---|---|
| Desktop offline | `electron/`, `renderer/`, `resources/` | Luồng chính hiện tại, chạy `upscayl-bin` cục bộ. |
| Cloud API docs | `docs/openapi.yaml`, `docs/*/*.mdx`, `apis/upscayl/` | Tài liệu API cho server `https://api.upscayl.org`; feature flag cloud info đang false. |

## Authentication

Cloud API dùng API key trong header:

```text
X-API-Key: <api-key>
```

Các response lỗi chuẩn gồm `BAD_REQUEST`, `NOT_FOUND`, `UNAUTHORIZED`, `RATE_LIMIT_EXCEEDED`, `INTERNAL_SERVER_ERROR`.

## Endpoint chính

| Endpoint | Method | Rate limit | Đầu vào | Đầu ra |
|---|---|---|---|---|
| `/get-upload-url` | POST | 100 request/giờ | `originalFileName`, `fileType`, `fileSize` | `uploadURL`, `fileName`, metadata upload. |
| `/start-task` | POST | 50 request/giờ | `file` multipart hoặc `files`, `model`, `scale`, `saveImageAs`, `enhanceFace` | `taskId`, message. |
| `/get-task-status` | POST | 100 request/giờ | `taskId` UUID | Status, progress, files, model, scale, credits. |
| `/get-upscayl-history` | POST | 100 request/giờ | `timestampOffset`, `batch`, `failed`, `limit`, `processed` | Danh sách task + pagination. |
| `/complete-multipart-upload` | POST | 50 request/giờ | `uploadId`, `key`, `parts` | Status complete multipart. |

## Schema task cloud

| Field | Ý nghĩa |
|---|---|
| `batchMode` | Task xử lý một ảnh hay nhiều ảnh. |
| `enhanceFace` | Có bật tăng cường khuôn mặt không. |
| `error` | Message lỗi nếu task failed. |
| `files` | Danh sách file đã xử lý, download link, thumbnail, kích thước. |
| `model` | Model cloud, nhiều hơn model desktop mặc định. |
| `progress` | Phần trăm xử lý dạng string. |
| `scale` | Tỷ lệ cloud hỗ trợ: `2`, `4`, `8`. |
| `status` | `pending`, `processing`, `completed`, `failed`. |
| `saveImageAs` | `png`, `jpg`, `webp`. |
| `creditsDeducted`, `deductedCredits` | Trạng thái trừ credit. |

## Model cloud theo OpenAPI

| Model |
|---|
| `upscayl-standard-4x` |
| `upscayl-lite-4x` |
| `clear-boost-4x` |
| `crystal-plus-4x` |
| `digital-art-4x` |
| `digital-art-plus-4x` |
| `natural-max-4x` |
| `natural-plus-4x` |
| `nature-boost-4x` |
| `pure-boost-4x` |
| `quick-clear-4x` |
| `texture-boost-4x` |

## Flow upload cloud

```text
Client có API key
  -> POST /get-upload-url với filename/type/size
  -> Upload file trực tiếp lên uploadURL
  -> Nếu multipart, POST /complete-multipart-upload sau khi upload đủ parts
  -> POST /start-task với file đã upload hoặc file multipart/form-data
  -> Poll POST /get-task-status bằng taskId
  -> Khi completed, lấy downloadLink/thumbnailLink trong files
```

## Giới hạn đáng chú ý

| Loại | Giới hạn |
|---|---|
| Upload file | Tối đa 100MB theo OpenAPI. |
| File type upload | JPEG, PNG, WEBP. |
| History limit | 1-100 bản ghi mỗi trang, mặc định 20. |
| Scale cloud | `2`, `4`, `8`. |
| Lỗi 402 | Có thể trả về `INSUFFICIENT_CREDITS`. |
