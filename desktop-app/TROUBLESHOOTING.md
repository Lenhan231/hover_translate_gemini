# Troubleshooting

## Build Errors

### ❌ "Please specify project homepage"
**Fixed!** Đã thêm metadata vào `package.json`

### ❌ "Please specify author 'email'"
**Fixed!** Đã thêm author info

### ❌ "It is required to set Linux .deb package maintainer"
**Fixed!** Đã thêm maintainer trong linux config

## Runtime Errors

### ❌ "SUID sandbox helper binary was found, but is not configured correctly"

**Lỗi này xảy ra khi chạy AppImage.**

**Giải pháp 1: Dùng --no-sandbox flag**
```bash
./dist/*.AppImage --no-sandbox
```

Hoặc dùng script:
```bash
./run-appimage.sh
```

**Giải pháp 2: Fix chrome-sandbox permissions**
```bash
# Extract AppImage
./dist/*.AppImage --appimage-extract

# Fix permissions
sudo chown root:root squashfs-root/chrome-sandbox
sudo chmod 4755 squashfs-root/chrome-sandbox

# Run from extracted folder
./squashfs-root/AppRun
```

**Giải pháp 3: Disable sandbox in code**

Thêm vào `main.js`:
```javascript
app.commandLine.appendSwitch('no-sandbox');
```

### ❌ Hotkey không hoạt động

**Cần cài xdotool:**
```bash
sudo apt install xdotool
```

**Hoặc đổi sang hotkey khác** trong Settings (Ctrl+Shift+T thay vì Alt)

### ❌ "Cannot find module 'electron'"

```bash
cd desktop-app
rm -rf node_modules package-lock.json
npm install
```

### ❌ App không xuất hiện trong system tray

**GNOME Shell:**
```bash
# Cài extension hỗ trợ tray
sudo apt install gnome-shell-extension-appindicator
```

**KDE Plasma:** Tray icons hoạt động mặc định

## Build Tips

### Build chỉ AppImage (nhanh hơn)
```bash
npm run build:appimage
```

### Build chỉ .deb
```bash
npm run build:deb
```

### Build với debug log
```bash
DEBUG=electron-builder npm run build:linux
```

### Skip icon warning
Tạo icon placeholder:
```bash
cd assets
# Tạo icon đơn giản 512x512
convert -size 512x512 xc:#3b82f6 -fill white -pointsize 200 -gravity center -annotate +0+0 "QT" icon.png
```

## Development Tips

### Chạy với DevTools
Trong `main.js`, thêm:
```javascript
overlayWindow.webContents.openDevTools();
settingsWindow.webContents.openDevTools();
```

### Debug hotkey
```javascript
globalShortcut.register(hotkey, () => {
  console.log('Hotkey pressed!');
  // ...
});
```

### Check registered hotkeys
```javascript
console.log('Registered:', globalShortcut.isRegistered(hotkey));
```

## Performance

### App chạy chậm
- Giảm `autoHideDelay` trong Settings
- Dùng model nhẹ hơn: `gemini-1.5-flash`
- Check network speed

### High CPU usage
- Disable auto-hide (app sẽ không poll)
- Close DevTools nếu đang mở

## Uninstall

### AppImage
```bash
rm dist/*.AppImage
```

### .deb
```bash
sudo apt remove quick-translate-desktop
```

### From source
```bash
rm -rf desktop-app/
```

## Get Help

1. Check Console logs (Ctrl+Shift+I in Settings window)
2. Check system logs: `journalctl -f`
3. Run with verbose: `DEBUG=* npm start`
