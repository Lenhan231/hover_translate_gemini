# ✅ Đã fix lỗi CSP (Content Security Policy)

## Vấn đề

Lỗi trong Console:
```
Content-Security-Policy: The page's settings blocked an inline script (script-src-elem) 
from being executed because it violates the following directive: "script-src 'self'"
```

## Nguyên nhân

`options.html` đang dùng **inline script** để load `options.js`:
```html
<script>
  window.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('script');
    s.src = 'options.js';
    document.body.appendChild(s);
  });
</script>
```

Firefox/Zen Browser block inline scripts vì lý do bảo mật.

## Giải pháp

Đã đổi thành load trực tiếp:
```html
<script src="options.js"></script>
```

## Cách test

1. **Remove extension cũ hoàn toàn**:
   ```
   about:debugging → Remove
   ```

2. **Clear browser cache** (quan trọng!):
   ```
   Ctrl+Shift+Delete → Clear cache
   ```

3. **Load lại extension**:
   ```
   Load Temporary Add-on → manifest.json
   ```

4. **Mở options page**:
   - Right-click extension icon → Preferences
   - Hoặc click vào extension

5. **Mở Console (F12)**:
   - Không còn lỗi CSP màu đỏ
   - Phải thấy: "Loading config with defaults: {...}"
   - Phải thấy: "Options page loaded successfully"

6. **Test save**:
   - Nhập API key
   - Click "Save"
   - Phải thấy alert "✅ Saved successfully!"
   - Console phải log: "Saving config: {...}"

7. **Verify**:
   - Đóng options page
   - Mở lại
   - API key phải vẫn còn

## Debug

Nếu vẫn có lỗi, trong Console gõ:

```javascript
// Check if options.js loaded
console.log('DEFAULTS:', typeof DEFAULTS);
console.log('els:', typeof els);
console.log('storage:', typeof storage);

// Should all be 'object', not 'undefined'
```

## Lưu ý

- **Phải remove và load lại extension** để clear cache
- **Phải clear browser cache** nếu vẫn thấy lỗi CSP
- Inline scripts không được phép trong WebExtensions
