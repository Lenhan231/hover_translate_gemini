# Quick Start Guide

## 1. Install

```bash
cd desktop-app
npm install
```

## 2. Run

```bash
npm start
```

## 3. Setup

1. App xuất hiện trong system tray (góc dưới bên phải Windows, góc trên bên phải Mac)
2. Double-click icon hoặc right-click → Settings
3. Nhập Gemini API key
4. Click Save

## 4. Use

1. Mở bất kỳ app nào (Word, PDF, browser, game, etc.)
2. Chọn text
3. Nhấn **Alt**
4. Xem bản dịch trong overlay

## That's it! 🎉

## Tips

- **Change hotkey**: Settings → Hotkey → Chọn phím khác
- **Change language**: Settings → Target Language
- **Disable auto-hide**: Settings → Uncheck "Auto-hide overlay"
- **Quit app**: Right-click tray icon → Quit

## Build Executable (Optional)

Nếu muốn tạo file .exe để cài đặt:

```bash
npm run build:win
```

File sẽ ở trong thư mục `dist/`
