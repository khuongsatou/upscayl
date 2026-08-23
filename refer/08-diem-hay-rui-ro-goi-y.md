# 08. Điểm hay, rủi ro và gợi ý cải thiện

## Điểm hay

| Điểm hay | Vì sao đáng giá |
|---|---|
| Tách main/renderer/common rõ ràng | Giảm rối giữa UI, IPC và contract payload. |
| Dùng binary native riêng | Compute nặng nằm ngoài renderer, tránh khóa UI. |
| Payload thống nhất | Single, batch, double dùng cùng bộ option nên dễ mở rộng. |
| Model path linh hoạt | Hỗ trợ model mặc định và custom model không cần rebuild app. |
| UI có nhiều trạng thái hữu ích | Progress, done, warning, error, preview slider/lens, open folder. |
| Có localization | Text UI được lấy từ `renderer/locales`, đã có tiếng Việt. |
| Có hỗ trợ troubleshooting | Logs copy được, GPU info, docs link, system info. |
| Có Mac App Store branch | Security scoped bookmarks và feature flag cho MAS. |
| Có API docs riêng | OpenAPI cloud giúp tách rõ desktop offline và service cloud. |

## Rủi ro kỹ thuật quan sát được

| Rủi ro | Vị trí | Tác động |
|---|---|---|
| `webSecurity: false` và `nodeIntegration: true` | `electron/main-window.ts` | Tăng bề mặt rủi ro Electron nếu renderer load nội dung không tin cậy. |
| Preload expose `send/on/invoke` generic | `electron/preload.ts` | Renderer có thể gọi command bất kỳ nếu bị XSS; nên whitelist command. |
| IPC payload chưa validate sâu ở main | `image-upscayl.ts`, `batch-upscayl.ts`, `double-upscayl.ts` | Path/model/option lỗi có thể đi thẳng tới binary. |
| Dựa vào text stderr để detect lỗi | Các upscale handler | Nếu binary đổi message, app có thể nhận sai progress/lỗi. |
| `childProcesses` không clear sau job | `config-variables.ts`, handlers | Có thể giữ reference process cũ; stop sau này có thể kill lại process đã close. |
| Batch metadata copy có khả năng map sai file gốc | `batch-upscayl.ts` | Output file thường bị đổi tên, nên tìm `inputDir/file` có thể không tồn tại. |
| `noImageProcessing` có trong payload nhưng chưa dùng | Types + payload | Dễ gây hiểu nhầm về tính năng. |
| `batchUpscayls: prev.doubleUpscayls + 1` | `sidebar/index.tsx` | Thống kê batch có vẻ tăng nhầm từ counter double. |
| Firebase/PostHog key hardcoded client-side | `renderer/firebase.ts`, `posthog-provider-wrapper.tsx` | Public key có thể chấp nhận được, nhưng cần rules/consent rõ ràng. |

## Gợi ý cải thiện

| Ưu tiên | Gợi ý | Lợi ích |
|---|---|---|
| Cao | Whitelist IPC API trong preload theo từng command cụ thể. | Giảm rủi ro renderer gọi nhầm/lạm dụng IPC. |
| Cao | Validate payload ở main bằng schema nhỏ trước khi spawn binary. | Báo lỗi sớm, tránh command sai. |
| Cao | Sửa thống kê batch counter và clear `childProcesses` khi process close. | State runtime sạch hơn. |
| Trung bình | Chuẩn hóa parser progress từ binary nếu binary có format ổn định. | Ít phụ thuộc string `Error`/`failed`. |
| Trung bình | Cải thiện batch metadata mapping dựa trên tên gốc hoặc manifest. | Copy metadata chính xác hơn. |
| Trung bình | Loại bỏ hoặc triển khai rõ `noImageProcessing`. | Contract ít nhiễu hơn. |
| Thấp | Tách file settings tab nếu tiếp tục phình to. | Dễ bảo trì UI hơn. |
| Thấp | Thêm tài liệu local cho custom model naming và ví dụ command. | Người dùng nâng cao dễ tự debug. |

## Acceptance checklist hiện tại

| Hạng mục | Trạng thái |
|---|---|
| Có phân tích flow tổng thể | Đã có trong `01` và `02`. |
| Có pipeline desktop chi tiết | Đã có trong `03`. |
| Có phân tích chức năng UI | Đã có trong `04`. |
| Có bảng input/output/payload | Đã có trong `05`. |
| Có phân tích prompt/command/model | Đã có trong `06`. |
| Có phân tích API cloud | Đã có trong `07`. |
| Có điểm hay/rủi ro/gợi ý | Đã có trong `08`. |
| Tiếng Việt có dấu | Đã dùng tiếng Việt có dấu trong bảng và nội dung. |
