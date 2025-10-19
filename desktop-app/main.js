// main.js - Electron main process
const { app, BrowserWindow, Tray, Menu, globalShortcut, clipboard, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { translateText } = require('./translator');

const store = new Store();
let tray = null;
let overlayWindow = null;
let settingsWindow = null;

// Default settings
const DEFAULTS = {
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash',
  targetLang: 'VI',
  hotkey: 'Alt',
  autoHide: true,
  autoHideDelay: 5000
};

function createOverlayWindow() {
  overlayWindow = new BrowserWindow({
    width: 400,
    height: 250,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  overlayWindow.loadFile('overlay.html');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 500,
    title: 'Quick Translate - Settings',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  settingsWindow.loadFile('settings.html');

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function createTray() {
  // Use a simple icon (you'll need to create this)
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Quick Translate',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => createSettingsWindow()
    },
    {
      label: 'About',
      click: () => {
        const { dialog } = require('electron');
        dialog.showMessageBox({
          type: 'info',
          title: 'About',
          message: 'Quick Translate Desktop v1.0.0',
          detail: 'System-wide translation using Gemini AI\n\nPress Alt to translate selected text'
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ]);

  tray.setToolTip('Quick Translate - Press Alt to translate');
  tray.setContextMenu(contextMenu);

  // Double-click to open settings
  tray.on('double-click', () => createSettingsWindow());
}

function registerHotkey() {
  const hotkey = store.get('hotkey', DEFAULTS.hotkey);

  // Unregister previous hotkey
  globalShortcut.unregisterAll();

  // Register new hotkey
  const registered = globalShortcut.register(hotkey, async () => {
    console.log('Hotkey pressed:', hotkey);
    await handleTranslate();
  });

  if (!registered) {
    console.error('Failed to register hotkey:', hotkey);
  }
}

async function handleTranslate() {
  try {
    // Simulate Ctrl+C to copy selected text
    const { exec } = require('child_process');
    
    // Platform-specific copy command
    if (process.platform === 'darwin') {
      exec('osascript -e "tell application \\"System Events\\" to keystroke \\"c\\" using command down"');
    } else if (process.platform === 'win32') {
      exec('powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\\"^c\\")"');
    } else {
      exec('xdotool key ctrl+c');
    }

    // Wait a bit for clipboard to update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get text from clipboard
    const text = clipboard.readText().trim();
    
    if (!text) {
      console.log('No text in clipboard');
      return;
    }

    console.log('Translating:', text);

    // Show overlay with loading state
    showOverlay('⏳ Translating...', '');

    // Translate
    const result = await translateText(text);

    if (result.ok) {
      showOverlay(result.translation, result.reading);
    } else {
      showOverlay('❌ Error: ' + result.error, '');
    }

  } catch (err) {
    console.error('Translation error:', err);
    showOverlay('❌ Error: ' + err.message, '');
  }
}

function showOverlay(translation, reading) {
  if (!overlayWindow) return;

  // Get cursor position
  const { screen } = require('electron');
  const cursor = screen.getCursorScreenPoint();
  
  // Position overlay near cursor
  overlayWindow.setPosition(cursor.x + 10, cursor.y + 10);

  // Send data to overlay
  overlayWindow.webContents.send('show-translation', {
    translation,
    reading
  });

  overlayWindow.show();

  // Auto-hide if enabled
  const autoHide = store.get('autoHide', DEFAULTS.autoHide);
  if (autoHide) {
    const delay = store.get('autoHideDelay', DEFAULTS.autoHideDelay);
    setTimeout(() => {
      if (overlayWindow) overlayWindow.hide();
    }, delay);
  }
}

// IPC handlers
ipcMain.handle('get-settings', () => {
  return {
    geminiApiKey: store.get('geminiApiKey', DEFAULTS.geminiApiKey),
    geminiModel: store.get('geminiModel', DEFAULTS.geminiModel),
    targetLang: store.get('targetLang', DEFAULTS.targetLang),
    hotkey: store.get('hotkey', DEFAULTS.hotkey),
    autoHide: store.get('autoHide', DEFAULTS.autoHide),
    autoHideDelay: store.get('autoHideDelay', DEFAULTS.autoHideDelay)
  };
});

ipcMain.handle('save-settings', (event, settings) => {
  store.set(settings);
  
  // Re-register hotkey if changed
  if (settings.hotkey) {
    registerHotkey();
  }
  
  return { success: true };
});

ipcMain.handle('close-overlay', () => {
  if (overlayWindow) overlayWindow.hide();
});

// App lifecycle
app.whenReady().then(() => {
  // Initialize defaults
  Object.keys(DEFAULTS).forEach(key => {
    if (!store.has(key)) {
      store.set(key, DEFAULTS[key]);
    }
  });

  createOverlayWindow();
  createTray();
  registerHotkey();

  console.log('App ready. Press', store.get('hotkey', DEFAULTS.hotkey), 'to translate.');
});

app.on('window-all-closed', (e) => {
  // Don't quit on window close (run in background)
  e.preventDefault();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}
