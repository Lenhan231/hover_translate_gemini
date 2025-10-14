# JP Hover Translate (Gemini / DeepL)

Extension Chrome để dịch tiếng Nhật nhanh chóng bằng cách chọn text và nhấn phím Alt. Hỗ trợ dịch sang tiếng Việt hoặc tiếng Anh thông qua Gemini AI hoặc DeepL API.

## Tính năng

- **Dịch nhanh**: Chọn text tiếng Nhật và nhấn Alt để dịch ngay lập tức
- **Đa nền tảng AI**: Hỗ trợ cả Gemini AI và DeepL API
- **Phát âm**: Nghe phát âm tiếng Nhật với giọng đọc tự nhiên
- **Romaji**: Hiển thị cách đọc romaji (khi dùng Gemini)
- **Lưu từ vựng**: Lưu các từ đã dịch để ôn tập sau
- **Giao diện đẹp**: Overlay hiện đại với hỗ trợ dark mode
- **Tùy chỉnh**: Chọn ngôn ngữ đích, model AI, và giới hạn ký tự

## Cài đặt

1. Clone hoặc tải repository này về máy
2. Mở Chrome và truy cập `chrome://extensions/`
3. Bật "Developer mode" ở góc trên bên phải
4. Click "Load unpacked" và chọn thư mục chứa extension
5. Extension sẽ xuất hiện trong danh sách extensions

## Cấu hình

1. Click chuột phải vào icon extension và chọn "Options"
2. Chọn provider (Gemini hoặc DeepL)
3. Nhập API key tương ứng:
   - **Gemini**: Lấy API key miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey)
   - **DeepL**: Đăng ký tài khoản miễn phí tại [DeepL API](https://www.deepl.com/pro-api)
4. Chọn ngôn ngữ đích (Vietnamese hoặc English)
5. Tùy chỉnh model Gemini và số ký tự tối đa nếu cần
6. Click "Save"

## Cách sử dụng

1. **Dịch text**: 
   - Chọn (bôi đen) text tiếng Nhật trên bất kỳ trang web nào
   - Nhấn và giữ phím **Alt**
   - Overlay dịch sẽ xuất hiện ngay bên dưới text đã chọn

2. **Nghe phát âm**:
   - Click nút 🔊 trong overlay để nghe phát âm tiếng Nhật

3. **Lưu từ vựng**:
   - Click nút "+ Save" để lưu từ và bản dịch
   - Xem danh sách từ đã lưu trong trang Options

4. **Đóng overlay**:
   - Click nút ✕ hoặc nhấn phím **Esc**
   - Click ra ngoài overlay

## Cấu trúc project

```
.
├── manifest.json       # Cấu hình Chrome extension
├── background.js       # Service worker xử lý API calls
├── content.js          # Script chạy trên mọi trang web
├── overlay.css         # Styles cho overlay dịch
├── options.html        # Trang cài đặt
├── options.js          # Logic cho trang cài đặt
└── icons/              # Icons cho extension
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Công nghệ sử dụng

- **Manifest V3**: Chrome Extension API mới nhất
- **Gemini AI**: Model `gemini-2.0-flash` cho dịch thuật chính xác
- **DeepL API**: Dịch thuật chuyên nghiệp
- **Web Speech API**: Phát âm tiếng Nhật tự nhiên
- **Chrome Storage API**: Lưu trữ cài đặt và từ vựng

## Giới hạn

- Mặc định giới hạn 600 ký tự mỗi lần dịch (có thể tùy chỉnh)
- Gemini API free tier có giới hạn requests
- DeepL free tier: 500,000 ký tự/tháng

## Phát triển

Extension được xây dựng với vanilla JavaScript, không cần build tools. Để phát triển:

1. Chỉnh sửa các file `.js`, `.html`, `.css`
2. Vào `chrome://extensions/` và click nút reload trên extension
3. Test trên các trang web có nội dung tiếng Nhật

## Changelog

### v1.3.0
- Thêm nút phát âm tiếng Nhật
- Cải thiện UI với provider badge
- Tối ưu xử lý JSON response từ Gemini
- Hỗ trợ dark mode tốt hơn
- Preload voices cho phát âm mượt mà hơn

## License

MIT License - Tự do sử dụng và chỉnh sửa

## Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request nếu bạn có ý tưởng cải thiện extension.
