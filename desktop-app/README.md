# Quick Translate Desktop

System-wide translation app using Gemini AI. Translate text from **any application** on your computer.

## Features

- 🌍 **System-wide**: Works in any app (browser, PDF, Word, games, etc.)
- ⌨️ **Global hotkey**: Press Alt to translate selected text
- 🚀 **Fast**: 1-3 seconds translation with Gemini AI
- 💾 **Persistent**: Runs in system tray
- 🎨 **Beautiful overlay**: Modern, transparent UI
- 🔧 **Customizable**: Change hotkey, language, auto-hide behavior

## Installation

### Prerequisites

- Node.js 16+ installed
- Gemini API key (free at https://aistudio.google.com/app/apikey)

### Steps

1. **Install dependencies**:
   ```bash
   cd desktop-app
   npm install
   ```

2. **Run the app**:
   ```bash
   npm start
   ```

3. **Configure**:
   - App will appear in system tray
   - Double-click tray icon or right-click → Settings
   - Enter your Gemini API key
   - Click Save

## Usage

1. **Select text** in any application
2. **Press Alt** (or your custom hotkey)
3. **See translation** in overlay window
4. Overlay auto-hides after 5 seconds (configurable)

## Build Executable

### Windows
```bash
npm run build:win
```
Output: `dist/Quick Translate Setup.exe`

### macOS
```bash
npm run build:mac
```
Output: `dist/Quick Translate.dmg`

### Linux
```bash
npm run build:linux
```
Output: `dist/Quick Translate.AppImage`

## Configuration

Settings available in Settings window:
- **Gemini API Key**: Your API key
- **Model**: gemini-2.0-flash (recommended)
- **Target Language**: Vietnamese or English
- **Hotkey**: Alt, Ctrl+Shift+T, or Ctrl+Shift+D
- **Auto-hide**: Enable/disable auto-hide
- **Auto-hide delay**: How long to show overlay (ms)

## Troubleshooting

### Hotkey not working
- Make sure no other app is using the same hotkey
- Try changing to a different hotkey in Settings
- Restart the app after changing hotkey

### Translation not working
- Check API key is correct
- Check internet connection
- Open DevTools (Ctrl+Shift+I in Settings window) to see errors

### App not starting
- Make sure Node.js is installed
- Run `npm install` again
- Check console for errors

## Development

```bash
# Run in development mode
npm start

# Build for all platforms
npm run build
```

## Tech Stack

- Electron (desktop framework)
- electron-store (settings storage)
- node-fetch (API calls)
- Gemini AI (translation)

## License

MIT
