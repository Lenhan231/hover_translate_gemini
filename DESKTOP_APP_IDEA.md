# Desktop Translation App - System-wide

## Ý tưởng

Tạo ứng dụng desktop chạy background, bắt phím tắt (Alt) toàn hệ thống để dịch text đã chọn trong **bất kỳ ứng dụng nào** (browser, PDF, Word, VSCode, game, v.v.)

## Các cách implement

### 1. Electron App (Cross-platform) ⭐ RECOMMENDED

**Ưu điểm:**
- Cross-platform: Windows, Mac, Linux
- Dùng lại code JavaScript hiện tại
- Dễ làm UI
- Có thể tạo system tray icon

**Tech stack:**
- Electron (main app)
- electron-globalShortcut (bắt phím tắt toàn hệ thống)
- clipboard (đọc text đã copy)
- Overlay window (hiển thị kết quả)

**Workflow:**
1. App chạy background (system tray)
2. User chọn text + nhấn Alt
3. App tự động copy text (Ctrl+C)
4. Gọi Gemini API
5. Hiển thị overlay với kết quả

**Code structure:**
```
desktop-translate/
├── main.js           # Electron main process
├── preload.js        # Bridge
├── renderer.js       # UI logic
├── translator.js     # Gemini API (reuse từ extension)
├── overlay.html      # Popup window
├── settings.html     # Settings window
└── package.json
```

### 2. Python + PyQt/Tkinter (Lightweight)

**Ưu điểm:**
- Nhẹ hơn Electron
- Dễ package thành .exe
- Python có thư viện tốt cho clipboard, hotkey

**Tech stack:**
- PyQt5 hoặc Tkinter (UI)
- pynput (bắt phím tắt)
- pyperclip (clipboard)
- requests (Gemini API)

**Nhược điểm:**
- Phải viết lại code từ JavaScript sang Python
- UI không đẹp bằng Electron

### 3. AutoHotkey + Web View (Windows only)

**Ưu điểm:**
- Rất nhẹ
- Chuyên cho Windows
- Dễ bắt hotkey

**Nhược điểm:**
- Chỉ Windows
- Khó làm UI đẹp

### 4. Tauri (Rust + Web) - Modern alternative

**Ưu điểm:**
- Nhẹ hơn Electron rất nhiều
- Dùng Rust backend + Web frontend
- Cross-platform

**Nhược điểm:**
- Phải học Rust
- Mới hơn, ít tài liệu hơn

## Recommended: Electron App

### Tính năng chính

1. **System Tray Icon**
   - Chạy background
   - Right-click: Settings, Quit

2. **Global Hotkey**
   - Alt (hoặc custom): Trigger dịch
   - Tự động copy text đã chọn

3. **Overlay Window**
   - Floating window hiển thị kết quả
   - Gần con trỏ chuột
   - Auto-hide sau vài giây

4. **Settings**
   - Gemini API key
   - Hotkey customization
   - Target language
   - Overlay position

5. **Clipboard Integration**
   - Tự động copy text khi nhấn hotkey
   - Hoặc dùng text đã có trong clipboard

### Quick Start với Electron

```bash
# Tạo project
mkdir translate-desktop
cd translate-desktop
npm init -y

# Install dependencies
npm install electron electron-store
npm install electron-globalshortcut
npm install node-fetch

# Tạo files
touch main.js preload.js renderer.js
touch overlay.html settings.html
```

### main.js (Electron main process)

```javascript
const { app, BrowserWindow, Tray, globalShortcut, clipboard } = require('electron');
const path = require('path');

let tray = null;
let overlayWindow = null;

app.whenReady().then(() => {
  // Create system tray
  tray = new Tray(path.join(__dirname, 'icon.png'));
  
  // Register global hotkey (Alt)
  globalShortcut.register('Alt', async () => {
    // Get selected text from clipboard
    const text = clipboard.readText();
    if (text) {
      await translateAndShow(text);
    }
  });
  
  // Create overlay window (hidden by default)
  overlayWindow = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  overlayWindow.loadFile('overlay.html');
});

async function translateAndShow(text) {
  // Call Gemini API (reuse code từ extension)
  const result = await translate(text);
  
  // Show overlay near cursor
  const { screen } = require('electron');
  const cursor = screen.getCursorScreenPoint();
  overlayWindow.setPosition(cursor.x + 10, cursor.y + 10);
  
  // Send result to overlay
  overlayWindow.webContents.send('translation', result);
  overlayWindow.show();
  
  // Auto-hide after 5 seconds
  setTimeout(() => overlayWindow.hide(), 5000);
}
```

### Workflow

1. **User chọn text trong bất kỳ app nào**
2. **Nhấn Alt** (hoặc custom hotkey)
3. **App tự động:**
   - Simulate Ctrl+C để copy text
   - Đọc clipboard
   - Gọi Gemini API
   - Hiển thị overlay với kết quả
4. **Overlay tự động ẩn sau vài giây**

### Cải tiến

- **OCR**: Dịch text trong ảnh (Tesseract.js)
- **Screenshot**: Chụp vùng màn hình và dịch
- **History**: Lưu lịch sử dịch
- **Favorites**: Lưu từ yêu thích
- **Multi-language**: Dịch nhiều ngôn ngữ
- **Voice**: Text-to-speech cho kết quả

## So sánh Extension vs Desktop App

| Feature | Browser Extension | Desktop App |
|---------|------------------|-------------|
| Phạm vi | Chỉ trong browser | Toàn hệ thống |
| Cài đặt | Dễ (load extension) | Cần install app |
| Hotkey | Chỉ trong browser | Global hotkey |
| Dịch PDF | ✅ (nếu mở trong browser) | ✅ (mọi PDF reader) |
| Dịch Word | ❌ | ✅ |
| Dịch Game | ❌ | ✅ |
| Dịch Desktop App | ❌ | ✅ |
| Resource | Nhẹ | Nặng hơn (Electron) |

## Kết luận

Nếu anh muốn dịch **mọi nơi** (không chỉ browser), làm **Electron app** là tốt nhất vì:
- Dùng lại code JavaScript hiện tại
- Cross-platform
- Dễ làm UI đẹp
- Có thể bắt global hotkey
- Có thể đọc clipboard từ mọi app

Tôi có thể giúp anh tạo Electron app này nếu anh muốn!
