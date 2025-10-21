# Developer Guide

## Architecture

- `manifest.json`: MV2 (Firefox/Zen). Background is non-persistent.
- `background.js`: handles Options storage, API calls (Gemini/DeepL), reading fallback, caching, context menu.
- `offline-db.js`: IndexedDB helpers and reading builders (IPA + romaji).
- `content.js`: selection capture, overlay UI, sends messages to background.
- `options.html`/`options.js`: settings page + import UI.
- `overlay.css`: overlay styles.

## Data Flow

1. User selects text and presses Alt (or context menu → Translate)
2. content.js sends `{ type: 'TRANSLATE_TEXT', text }` to background
3. background.js:
   - trims to `maxChars`
   - calls Gemini → parse strict-JSON response
   - if error/quota and DeepL configured → fallback to DeepL
   - if reading missing → use OfflineDB to build reading (IPA/romaji)
   - caches result (LRU, in-memory)
4. content.js displays translation, reading, and provider badge

## Offline DB

- DB: `qt_offline_db`
- Stores: `ipa` (EN), `ja` (JA)
- Import formats: see `docs/FORMATS.md`
- Reading builders:
  - `buildReading(text)` → string
  - `buildReadingTokens(text)` → array of tokens (used for line breaks)

## Development

- Load temporary add-on: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → select `manifest.json`
- Rebuild `.xpi`: run `./build.sh` (packages only extension files)
- Background console: open from `about:debugging` → Inspect → Console

## Release Checklist

- Update `manifest.json` version
- Update `docs/CHANGELOG.md` and root `README.md` changelog section
- Rebuild `quick-translate-vi.xpi`
- Smoke test: short JP/EN selection, DeepL fallback, import IPA/JMdict

