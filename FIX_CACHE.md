# Cách fix lỗi cache extension

Extension đang load version cũ. Làm theo các bước sau:

## Cách 1: Reload hoàn toàn extension

1. Mở Zen Browser
2. Gõ `about:debugging` vào thanh địa chỉ
3. Click "This Zen" ở sidebar
4. Tìm extension "Quick Translate to Vietnamese"
5. Click nút **"Reload"** (icon reload ở góc phải)
6. Đóng tab options cũ
7. Click "Inspect" để mở DevTools
8. Trong DevTools, click tab "Storage" hoặc "Application"
9. Xóa tất cả storage data
10. Đóng DevTools
11. Click lại vào extension để mở options page mới

## Cách 2: Remove và load lại

1. Gõ `about:debugging`
2. Click "Remove" extension
3. Click "Load Temporary Add-on..."
4. Chọn file `manifest.json` trong thư mục extension
5. Mở options page

## Cách 3: Hard refresh options page

1. Mở options page
2. Nhấn **Ctrl+Shift+R** (hoặc Cmd+Shift+R trên Mac)
3. Hoặc mở DevTools (F12) → Right-click nút reload → "Empty Cache and Hard Reload"

## Cách 4: Clear browser cache

1. Gõ `about:preferences#privacy`
2. Scroll xuống "Cookies and Site Data"
3. Click "Clear Data..."
4. Chọn "Cached Web Content"
5. Click "Clear"
6. Reload extension

## Kiểm tra

Sau khi reload, options page phải có:
- ✅ Chỉ có "Gemini API Key" và "Gemini Model"
- ✅ Không có "Provider" dropdown
- ✅ Không có "DeepL API Key"
- ✅ Có "Target Language" và "Max Characters"

## Debug

Nếu vẫn không được, mở Console (F12) trong options page và check:
```javascript
console.log(document.getElementById('provider')); // phải null
console.log(document.getElementById('deeplKey')); // phải null
```

Nếu không null = vẫn đang load HTML cũ.
