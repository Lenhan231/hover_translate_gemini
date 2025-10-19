# Thay đổi v2.0.0 - Firefox/Zen Browser Edition

## 🔥 Thay đổi lớn

### 1. Chuyển từ Chrome sang Firefox/Zen Browser
- **Manifest V3 → V2**: Firefox hỗ trợ tốt hơn với MV2
- **Cross-browser API**: Sử dụng `browser` API (Firefox) với fallback `chrome` API
- **Background script**: Chuyển từ service worker sang background page
- **Permissions**: Cập nhật cho Firefox format

### 2. Hỗ trợ đa ngôn ngữ
- **Trước**: Chỉ dịch tiếng Nhật → Tiếng Việt
- **Sau**: Dịch **mọi ngôn ngữ** → Tiếng Việt
- **Auto-detect**: AI tự động nhận diện ngôn ngữ nguồn
- **Romanization**: Hỗ trợ romaji (Nhật), pinyin (Trung), romanization (Hàn)

### 3. Bỏ DeepL - Chỉ giữ Gemini
- **Lý do**: Đơn giản hóa, chỉ cần 1 API key
- **Gemini free tier**: 15 req/phút, 1500 req/ngày - đủ dùng
- **Tốc độ**: 1-3 giây với generation config tối ưu
- **Chất lượng**: Gemini 2.0 Flash rất tốt cho dịch thuật

### 4. Tối ưu hiệu suất
- **Generation config**: Thêm temperature, maxOutputTokens, topP, topK
- **Timeout**: 8 giây để tránh treo
- **Prompt ngắn gọn**: Giảm token cần xử lý
- **Loading indicator**: Visual feedback với opacity và icon

### 5. Cải thiện UI/UX
- **Bỏ nút Speak**: Không cần thiết, giảm complexity
- **Bỏ provider selector**: Chỉ có Gemini
- **Nút Save mới**: Gradient xanh dương đẹp mắt với animation
- **Badge cố định**: "Gemini AI" luôn hiển thị
- **Close button**: Hover effect màu đỏ
- **Romaji display**: Font monospace, italic, màu xám

## 📝 Chi tiết thay đổi

### manifest.json
```diff
- "manifest_version": 3
+ "manifest_version": 2
- "name": "JP Hover Translate (Gemini / DeepL)"
+ "name": "Quick Translate to Vietnamese"
- "background": { "service_worker": "background.js" }
+ "background": { "scripts": ["background.js"], "persistent": false }
+ "browser_specific_settings": { "gecko": { ... } }
```

### background.js
- Thêm cross-browser compatibility layer
- Promise-based storage API cho Firefox
- Auto-detect source language (bỏ hardcode 'JA')
- Cải thiện prompt: "Detect the source language and translate..."
- Thêm generation config cho Gemini
- Timeout 8s với AbortController

### content.js
- Bỏ toàn bộ speech synthesis code
- Thêm `const api = browser || chrome`
- Cập nhật UI: bỏ nút 🔊, cải thiện nút Save
- Loading state với opacity và icon ⏳
- Log thời gian dịch trong Console

### overlay.css
- Gradient button cho Save: `linear-gradient(135deg, #3b82f6, #2563eb)`
- Hover effects với transform và shadow
- Provider badge màu xanh: `rgba(59,130,246,0.1)`
- Close button hover: màu đỏ
- Romaji styling: monospace, italic, gray

### options.html & options.js
- Cross-browser storage API
- Cập nhật title và heading
- Thêm description text

## 🚀 Cách sử dụng mới

### Cài đặt
```bash
# Build extension
./build.sh

# Hoặc manual
zip -r quick-translate-vi.xpi * --exclude '*.git*'
```

### Load vào Zen/Firefox
1. `about:debugging` → Load Temporary Add-on
2. Hoặc `about:addons` → Install from file (.xpi)

### Sử dụng
1. Chọn text **bất kỳ ngôn ngữ nào**
2. Nhấn Alt
3. Đọc bản dịch tiếng Việt

## 🎯 Ngôn ngữ hỗ trợ

- 🇯🇵 Tiếng Nhật (có romaji)
- 🇨🇳 Tiếng Trung (có pinyin)
- 🇰🇷 Tiếng Hàn (có romanization)
- 🇬🇧 Tiếng Anh
- 🇫🇷 Tiếng Pháp
- 🇩🇪 Tiếng Đức
- 🇪🇸 Tiếng Tây Ban Nha
- 🇷🇺 Tiếng Nga
- 🇮🇹 Tiếng Ý
- 🇵🇹 Tiếng Bồ Đào Nha
- Và 100+ ngôn ngữ khác...

## 📦 Files mới

- `INSTALL_ZEN.md` - Hướng dẫn cài đặt chi tiết
- `build.sh` - Script đóng gói extension
- `CHANGES.md` - File này
- `.env` - Lưu API key (gitignored)

## 🐛 Breaking Changes

- **Không tương thích Chrome**: Extension này chỉ cho Firefox/Zen
- **Bỏ speech synthesis**: Không còn nút phát âm
- **Bỏ DeepL**: Chỉ hỗ trợ Gemini AI
- **API key bắt buộc**: Phải có Gemini API key (miễn phí)

## 🔜 Tương lai

- [ ] Thêm context menu (right-click to translate)
- [ ] Hỗ trợ dịch ngược (VI → EN/JP)
- [ ] Export/import saved words
- [ ] Anki integration
- [ ] Keyboard shortcuts tùy chỉnh
