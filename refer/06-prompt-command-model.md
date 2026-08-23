# 06. Prompt, command và model

## Kết luận về prompt

Repo này không có prompt LLM, system prompt, chatbot prompt hay prompt text-to-image. Từ khóa `prompt`, `OpenAI`, `chat`, `agent` không xuất hiện trong phần code ứng dụng theo nghĩa prompt AI hội thoại. Vì vậy, “prompt” của pipeline Upscayl nên hiểu là bộ tham số điều khiển model/binary được chuyển thành command-line arguments cho `upscayl-bin`.

## Prompt dạng command arguments

| Thành phần | Ví dụ | Vai trò tương đương prompt |
|---|---|---|
| Model | `-n upscayl-standard-4x` | Chọn “phong cách/khả năng” upscale. |
| Scale | `-s 4` | Xác định mức phóng to hoặc resize hậu kỳ. |
| Custom width | `-w 1320` | Ghi đè scale bằng chiều rộng output cụ thể. |
| Format | `-f png` | Chỉ định kiểu file đầu ra. |
| Compression | `-c 80` | Điều chỉnh kích thước/chất lượng file output. |
| GPU ID | `-g 0` | Ép binary dùng GPU Vulkan cụ thể. |
| Tile size | `-t 256` | Điều chỉnh cách chia ảnh thành tile để xử lý. |
| TTA | `-x` | Bật Test-Time Augmentation để tăng chất lượng. |
| Model path | `-m /path/to/models` | Trỏ nơi binary lấy `.bin`/`.param`. |
| Input/output | `-i`, `-o` | Xác định dữ liệu vào và nơi xuất kết quả. |

## Ví dụ command ảnh đơn

```text
upscayl-bin
  -i /Users/me/Pictures/input.jpg
  -o /Users/me/Pictures/input_upscayl_4x_upscayl-standard-4x.png
  -m /path/to/resources/models
  -n upscayl-standard-4x
  -f png
  -c 0
```

Nếu người dùng nhập GPU ID, tile size, TTA hoặc custom width, command sẽ thêm các option tương ứng:

```text
upscayl-bin
  -i /Users/me/Pictures/input.jpg
  -o /Users/me/Pictures/input_upscayl_1320px_digital-art-4x.webp
  -m /path/to/resources/models
  -n digital-art-4x
  -g 0
  -f webp
  -w 1320
  -c 70
  -t 256
  -x
```

## Prompt template theo mode

| Mode | Template logic |
|---|---|
| Single | Input là file ảnh; output là file ảnh có hậu tố `_upscayl_*`; truyền full option. |
| Batch | Input là folder; output là folder mới; truyền full option; binary tự xử lý nhiều file. |
| Double | Lượt 1 input ảnh gốc ra `outFile`; lượt 2 input chính `outFile` và output ghi đè `outFile`. |

## Model list mặc định

| Model ID | File model trong resources | Mục tiêu |
|---|---|---|
| `upscayl-standard-4x` | `.bin` + `.param` | Mặc định, cân bằng cho đa số ảnh. |
| `upscayl-lite-4x` | `.bin` + `.param` | Nhanh hơn, chất lượng giảm ít. |
| `high-fidelity-4x` | `.bin` + `.param` | Chi tiết thực tế, texture mượt. |
| `remacri-4x` | `.bin` + `.param` | Ảnh tự nhiên, sắc nét, không thương mại. |
| `ultramix-balanced-4x` | `.bin` + `.param` | Cân bằng chi tiết và độ sắc. |
| `ultrasharp-4x` | `.bin` + `.param` | Tăng độ sắc nét mạnh. |
| `digital-art-4x` | `.bin` + `.param` | Digital art, minh họa. |

## Custom model prompt

Custom model không cần prompt text. Người dùng chọn một thư mục tên `models` chứa cặp file `.bin` và `.param`. App scan file, lấy tên trước phần mở rộng làm `modelName`, sau đó truyền:

```text
-m /duong/dan/toi/models -n ten-model
```

Điểm hay là logic này cho phép mở rộng model mà không phải sửa code UI hoặc Electron handler.

## Lưu ý chất lượng

| Tùy chọn | Lợi ích | Đánh đổi |
|---|---|---|
| Model sắc nét như Ultrasharp | Ảnh rõ cạnh, hợp vật thể/texture | Có thể làm ảnh chân dung hoặc ảnh mềm bị gắt. |
| Digital Art | Hợp tranh, anime, minh họa | Không tối ưu cho ảnh đời thực. |
| TTA Mode | Có thể giảm artifact và tăng chất lượng | Thời gian xử lý tăng lớn. |
| Tile size | Giúp quản lý VRAM, có thể tránh lỗi GPU | Giá trị sai có thể gây lỗi tile size hoặc chậm. |
| Scale cao | Output lớn | Tốn RAM/VRAM, UI đã cảnh báo từ scale >= 6. |
| Custom width | Chủ động kích thước cuối | Scale slider bị vô hiệu hóa, cần restart theo mô tả UI. |
