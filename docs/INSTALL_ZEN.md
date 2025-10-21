# Hướng dẫn cài đặt cho Zen Browser

## Cài đặt tạm thời (Development)

1. Mở Zen Browser
2. Gõ `about:debugging` vào thanh địa chỉ
3. Click "This Zen" ở sidebar bên trái
4. Click nút "Load Temporary Add-on..."
5. Chọn file `manifest.json` trong thư mục extension này
6. Extension sẽ hoạt động cho đến khi đóng browser

## Cài đặt vĩnh viễn

### Cách 1: Tự đóng gói (Recommended)

1. Mở terminal trong thư mục extension
2. Chạy lệnh đóng gói:
   ```bash
   zip -r -FS quick-translate-vi.xpi * --exclude '*.git*' --exclude 'node_modules/*'
   ```
3. Mở Zen và gõ `about:addons`
4. Click biểu tượng ⚙️ (Settings) ở góc trên
5. Chọn "Install Add-on From File..."
6. Chọn file `quick-translate-vi.xpi` vừa tạo
7. Click "Add" để xác nhận

### Cách 2: Developer Mode (Không cần đóng gói)

1. Gõ `about:config` vào thanh địa chỉ
2. Tìm `xpinstall.signatures.required`
3. Đổi giá trị thành `false`
4. Làm theo các bước ở "Cách 1" để cài file .xpi

## Cấu hình API Key

1. Click chuột phải vào icon extension trên toolbar
2. Chọn "Manage Extension" > "Preferences"
3. Nhập Gemini API key (lấy tại https://aistudio.google.com/app/apikey)
4. Click "Save"

## Sử dụng

1. Vào bất kỳ trang web nào
2. Chọn (bôi đen) text bất kỳ ngôn ngữ nào
3. Nhấn và giữ phím **Alt**
4. Overlay dịch sẽ xuất hiện với bản dịch tiếng Việt

## Troubleshooting

### Extension không hoạt động
- Kiểm tra Console (F12) xem có lỗi không
- Đảm bảo đã nhập API key trong Settings
- Thử reload extension trong `about:debugging`

### Không dịch được
- Kiểm tra API key còn hạn sử dụng
- Kiểm tra kết nối internet
- Xem Console log để biết lỗi cụ thể

### Dịch chậm
- Giảm `maxChars` trong Settings (từ 600 xuống 300)
- Thử đổi sang DeepL provider
- Kiểm tra tốc độ mạng

## Gỡ cài đặt

1. Gõ `about:addons`
2. Tìm "Quick Translate to Vietnamese"
3. Click "..." > "Remove"
