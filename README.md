# Quick Translate to Vietnamese

Extension Firefox/Zen Browser để dịch **mọi ngôn ngữ** sang tiếng Việt nhanh chóng bằng cách chọn text và nhấn phím Alt. Sử dụng Gemini AI.

## Tính năng

- **Dịch đa ngôn ngữ**: Tự động nhận diện và dịch bất kỳ ngôn ngữ nào sang tiếng Việt
- **Dịch nhanh**: Chọn text và nhấn Alt để dịch ngay lập tức (1-3 giây)
- **Gemini AI**: Sử dụng model `gemini-2.0-flash` mạnh mẽ và nhanh
- **Romanization**: Hiển thị cách đọc romaji/pinyin cho tiếng Nhật/Trung/Hàn
- **Lưu từ vựng**: Lưu các từ đã dịch để ôn tập sau
- **Giao diện đẹp**: Overlay hiện đại với hỗ trợ dark mode
- **Miễn phí**: Chỉ cần Gemini API key miễn phí

## Cài đặt

### Firefox / Zen Browser

1. Clone hoặc tải repository này về máy
2. Mở Firefox/Zen và truy cập `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Chọn file `manifest.json` trong thư mục extension
5. Extension sẽ hoạt động cho đến khi đóng browser

### Cài đặt vĩnh viễn (Firefox)

1. Đóng gói extension: `zip -r quick-translate-vi.xpi *`
2. Vào `about:addons`
3. Click biểu tượng ⚙️ > "Install Add-on From File..."
4. Chọn file `.xpi` vừa tạo

## Cấu hình

1. Click chuột phải vào icon extension và chọn "Preferences"
2. Nhập Gemini API key:
   - Lấy API key **miễn phí** tại [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Free tier: 15 requests/phút, 1500 requests/ngày
3. Chọn ngôn ngữ đích (Vietnamese hoặc English)
4. Tùy chỉnh model và số ký tự tối đa nếu cần
5. Click "Save"

## Cách sử dụng

1. **Dịch text**: 
   - Chọn (bôi đen) text bất kỳ ngôn ngữ nào trên trang web
   - Nhấn và giữ phím **Alt**
   - Overlay dịch sẽ xuất hiện ngay bên dưới text đã chọn
   - Extension tự động nhận diện ngôn ngữ nguồn

2. **Lưu từ vựng**:
   - Click nút "💾 Save Word" để lưu từ và bản dịch
   - Xem danh sách từ đã lưu trong trang Settings

3. **Đóng overlay**:
   - Click nút ✕ hoặc nhấn phím **Esc**
   - Click ra ngoài overlay

## Ngôn ngữ hỗ trợ

Extension hỗ trợ dịch **mọi ngôn ngữ** sang tiếng Việt, bao gồm:
- 🇯🇵 Tiếng Nhật (có romaji)
- 🇨🇳 Tiếng Trung (có pinyin)
- 🇰🇷 Tiếng Hàn (có romanization)
- 🇬🇧 Tiếng Anh
- 🇫🇷 Tiếng Pháp
- 🇩🇪 Tiếng Đức
- 🇪🇸 Tiếng Tây Ban Nha
- Và hơn 100+ ngôn ngữ khác...

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

- **Manifest V2**: Firefox WebExtensions API (tương thích Zen Browser)
- **Gemini AI**: Model `gemini-2.0-flash` với auto language detection
- **Browser Storage API**: Lưu trữ cài đặt và từ vựng (sync + local)
- **Vanilla JavaScript**: Không dependencies, nhẹ và nhanh

## Giới hạn

- Mặc định giới hạn 600 ký tự mỗi lần dịch (có thể tùy chỉnh)
- Gemini API free tier:
  - 15 requests/phút
  - 1,500 requests/ngày
  - 1 triệu tokens/ngày

## Phát triển

Extension được xây dựng với vanilla JavaScript, không cần build tools. Để phát triển:

1. Chỉnh sửa các file `.js`, `.html`, `.css`
2. Vào `chrome://extensions/` và click nút reload trên extension
3. Test trên các trang web có nội dung tiếng Nhật

## Changelog

### v2.0.0 (Current)
- 🔥 Chuyển sang Firefox/Zen Browser (Manifest V2)
- 🌍 Hỗ trợ dịch **mọi ngôn ngữ** sang tiếng Việt (không chỉ tiếng Nhật)
- 🚀 Tối ưu tốc độ dịch với generation config (1-3 giây)
- 🎨 UI mới với nút Save gradient đẹp mắt
- ❌ Bỏ chức năng phát âm và DeepL (chỉ giữ Gemini)
- ✨ Cải thiện prompt để AI tự nhận diện ngôn ngữ
- 🐛 Fix romanization display
- 💡 Đơn giản hóa: chỉ cần 1 API key

### v1.4.0
- Tối ưu tốc độ dịch
- Cải thiện UI nút Save
- Thêm loading indicator
- Fix speech synthesis

### v1.3.0
- Thêm nút phát âm tiếng Nhật
- Cải thiện UI với provider badge
- Hỗ trợ dark mode tốt hơn

## License

MIT License - Tự do sử dụng và chỉnh sửa

## Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request nếu bạn có ý tưởng cải thiện extension.
