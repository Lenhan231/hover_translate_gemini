# Quick Translate to Vietnamese - Summary

## Tóm tắt

Extension Firefox/Zen Browser đơn giản để dịch mọi ngôn ngữ sang tiếng Việt bằng Gemini AI.

## Cách dùng

1. **Cài đặt**: Load extension vào Zen Browser (`about:debugging`)
2. **Cấu hình**: Nhập Gemini API key (miễn phí tại https://aistudio.google.com/app/apikey)
3. **Sử dụng**: Chọn text + nhấn Alt = dịch ngay

## Tính năng chính

- ✅ Dịch mọi ngôn ngữ → Tiếng Việt
- ✅ Auto-detect ngôn ngữ nguồn
- ✅ Hiển thị romaji/pinyin cho tiếng Nhật/Trung/Hàn
- ✅ Lưu từ vựng
- ✅ Giao diện đẹp, dark mode
- ✅ Nhanh (1-3 giây)
- ✅ Miễn phí (Gemini free tier)

## Đã bỏ

- ❌ DeepL (chỉ giữ Gemini)
- ❌ Speech synthesis (phát âm)
- ❌ Chrome support (chỉ Firefox/Zen)

## Tech Stack

- Manifest V2 (Firefox)
- Gemini 2.0 Flash API
- Vanilla JavaScript
- No dependencies

## Files quan trọng

- `manifest.json` - Extension config
- `background.js` - API calls
- `content.js` - UI overlay
- `options.html/js` - Settings page
- `overlay.css` - Styles
- `.env` - API key (gitignored)

## Build & Install

```bash
# Build
./build.sh

# Install
# 1. Open Zen Browser
# 2. Go to about:debugging
# 3. Load Temporary Add-on
# 4. Select manifest.json
```

## Gemini API Limits (Free Tier)

- 15 requests/phút
- 1,500 requests/ngày
- 1 triệu tokens/ngày

Đủ cho sử dụng cá nhân!
