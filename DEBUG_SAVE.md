# Debug lỗi không save được

## Bước 1: Test Storage API

1. Mở file `test_storage.html` trong extension:
   - Gõ `about:debugging`
   - Click "Inspect" trên extension
   - Trong DevTools Console, gõ:
   ```javascript
   window.open(browser.runtime.getURL('test_storage.html'))
   ```

2. Trong test page:
   - Nhập API key vào ô input
   - Click "Test Save"
   - Click "Test Load"
   - Xem output

## Bước 2: Check Console trong Options Page

1. Mở options page
2. Nhấn F12 để mở DevTools
3. Nhập API key
4. Click "Save"
5. Xem Console log:
   - Phải thấy: "Saving config: {...}"
   - Phải thấy: "Config saved successfully"
   - Phải thấy: "Verified saved config: {...}"

## Bước 3: Check Storage trực tiếp

Trong DevTools Console của options page, gõ:

```javascript
// Check storage API
console.log('browser:', typeof browser);
console.log('chrome:', typeof chrome);
console.log('storage:', browser?.storage || chrome?.storage);

// Try save manually
const api = browser || chrome;
await api.storage.sync.set({ geminiApiKey: 'test123' });
console.log('Manual save done');

// Try load
const result = await api.storage.sync.get('geminiApiKey');
console.log('Loaded:', result);
```

## Bước 4: Check Permissions

Trong `about:debugging`, check xem extension có permission "storage" không.

Trong manifest.json phải có:
```json
"permissions": [
  "storage",
  ...
]
```

## Các lỗi thường gặp

### Lỗi 1: "Storage API not available"
- Extension chưa được load đúng
- Thiếu permission "storage"
- **Fix**: Remove và load lại extension

### Lỗi 2: Save thành công nhưng load lại mất
- Storage sync có thể bị giới hạn
- **Fix**: Thử dùng `storage.local` thay vì `storage.sync`

### Lỗi 3: Alert "Saved" nhưng không thấy trong UI
- UI không reload sau khi save
- **Fix**: Thêm `await load()` sau khi save

## Quick Fix

Nếu vẫn không được, thử đổi sang `storage.local`:

Trong `options.js`, đổi:
```javascript
await storage.sync.set(cfg);
// thành
await storage.local.set(cfg);
```

Và trong `background.js`, đổi tất cả `sync` thành `local`.
