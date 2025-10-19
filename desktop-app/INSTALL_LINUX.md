# Cài đặt trên Linux

## Cách 1: AppImage (Recommended - Không cần cài đặt)

### Build
```bash
cd desktop-app
npm install
npm run build:appimage
```

### Chạy
```bash
cd dist
chmod +x Quick-Translate-*.AppImage
./Quick-Translate-*.AppImage
```

**Ưu điểm:**
- Không cần cài đặt
- Portable (copy sang máy khác được)
- Không cần sudo

## Cách 2: .deb Package (Giống apt install)

### Build
```bash
npm run build:deb
```

### Cài đặt
```bash
cd dist
sudo dpkg -i quick-translate-desktop_*.deb
```

### Chạy
```bash
quick-translate-desktop
# Hoặc tìm trong Applications menu
```

### Gỡ cài đặt
```bash
sudo apt remove quick-translate-desktop
```

**Ưu điểm:**
- Cài vào hệ thống như app bình thường
- Có trong Applications menu
- Tự động tạo desktop entry

## Cách 3: Chạy từ source (Development)

```bash
cd desktop-app
npm install
npm start
```

**Ưu điểm:**
- Không cần build
- Dễ debug
- Dễ chỉnh sửa code

## Dependencies cần thiết

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install -y nodejs npm
```

### Arch Linux
```bash
sudo pacman -S nodejs npm
```

### Fedora
```bash
sudo dnf install nodejs npm
```

## Troubleshooting

### Lỗi: "electron: command not found"
```bash
npm install
```

### Lỗi: "Cannot find module 'electron'"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Lỗi build: "wine not found"
Nếu build cho Windows trên Linux:
```bash
sudo apt install wine64
```

### Hotkey không hoạt động
Cần cài `xdotool`:
```bash
sudo apt install xdotool
```

## Tạo PPA (Advanced - Để publish lên apt)

Nếu muốn publish lên apt repository:

1. **Tạo Launchpad account**
2. **Upload GPG key**
3. **Tạo PPA**:
   ```bash
   # Tạo source package
   debuild -S -sa
   
   # Upload lên Launchpad
   dput ppa:your-username/quick-translate *.changes
   ```

4. **User cài đặt**:
   ```bash
   sudo add-apt-repository ppa:your-username/quick-translate
   sudo apt update
   sudo apt install quick-translate-desktop
   ```

## Auto-start on boot

### Systemd service
```bash
# Tạo service file
sudo nano /etc/systemd/system/quick-translate.service
```

Nội dung:
```ini
[Unit]
Description=Quick Translate Desktop
After=graphical.target

[Service]
Type=simple
ExecStart=/usr/bin/quick-translate-desktop
Restart=on-failure
User=%i

[Install]
WantedBy=default.target
```

Enable:
```bash
sudo systemctl enable quick-translate
sudo systemctl start quick-translate
```

### Desktop autostart (Easier)
```bash
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/quick-translate.desktop << EOF
[Desktop Entry]
Type=Application
Name=Quick Translate
Exec=/path/to/Quick-Translate.AppImage
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF
```

## Permissions

App cần quyền:
- ✅ Clipboard access (đọc text đã copy)
- ✅ Global hotkey (bắt phím Alt)
- ✅ Network (gọi Gemini API)

Không cần sudo để chạy!
