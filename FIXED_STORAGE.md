# ✅ Đã fix lỗi save

## Vấn đề

Firefox `storage.sync` có thể gặp vấn đề với một số cấu hình hoặc profile.

## Giải pháp

Đã chuyển từ `storage.sync` sang `storage.local` trong tất cả files:
- ✅ `options.js` - Save/load settings
- ✅ `background.js` - Read API key
- ✅ `content.js` - Save words

## Cách test

1. **Remove extension cũ hoàn toàn**:
   ```
   about:debugging → Remove extension
   ```

2. **Load lại extension**:
   ```
   Load Temporary Add-on → Chọn manifest.json
   ```

3. **Mở options page**:
   - Click vào extension icon
   - Hoặc right-click → Preferences

4. **Nhập API key và Save**:
   - Nhập Gemini API key
   - Click "Save"
   - Phải thấy alert "✅ Saved successfully!"

5. **Verify**:
   - Đóng options page
   - Mở lại
   - API key phải vẫn còn đó

6. **Test dịch**:
   - Vào bất kỳ trang web nào
   - Chọn text
   - Nhấn Alt
   - Phải dịch được

## Debug

Nếu vẫn không được, mở Console (F12) trong options page và check:

```javascript
// Test storage
const api = browser || chrome;

// Save test
await api.storage.local.set({ test: 'hello' });
console.log('Saved');

// Load test
const result = await api.storage.local.get('test');
console.log('Loaded:', result);
```

## Khác biệt storage.sync vs storage.local

### storage.sync (CŨ - có vấn đề)
- Sync across devices
- Giới hạn: 100KB total, 8KB per item
- Có thể bị lỗi với Firefox

### storage.local (MỚI - ổn định)
- Chỉ lưu local
- Giới hạn: Không giới hạn (hoặc rất lớn)
- Ổn định hơn với Firefox/Zen

## Lưu ý

Settings giờ **không sync** giữa các devices nữa. Nếu dùng nhiều máy, phải nhập API key trên mỗi máy.
