
# JP Hover Translate (Gemini / DeepL) — v1.1.0

**New UX:** Select text, then press **Alt** to translate (JP → VI/EN).  
Popup appears near the selection. Click **+ Save** to store the pair locally.

## Install (Developer mode)
1. Download & unzip this folder.
2. Open **Chrome/Brave → chrome://extensions**.
3. Turn on **Developer mode** → **Load unpacked** → select this folder.
4. Open **Options** (`chrome-extension://<ID>/options.html`) and paste your API key.

## Usage
- **Bôi đen (select)** đoạn tiếng Nhật → **nhấn Alt**.  
- Popup sẽ hiển thị bản dịch (Gemini default, hoặc DeepL nếu chọn).  
- Nhấn **+ Save** để lưu (xem trong Options).

## Tips
- Model nhập trong Options, ví dụ: `gemini-2.0-flash`.
- Max characters per lookup: chỉnh trong Options (mặc định 600, content script còn giới hạn 800 để an toàn).
