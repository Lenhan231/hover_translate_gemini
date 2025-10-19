
const DEFAULTS = {
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash',
  targetLang: 'VI',
  maxChars: 600
};

const els = {
  geminiKey: document.getElementById('geminiKey'),
  geminiModel: document.getElementById('geminiModel'),
  targetLang: document.getElementById('targetLang'),
  maxChars: document.getElementById('maxChars'),
  save: document.getElementById('save'),
  reset: document.getElementById('reset'),
  saved: document.getElementById('saved'),
  clear: document.getElementById('clear')
};

// Firefox (and forks like Zen) expose the WebExtensions API as `browser`.
// Chrome exposes `chrome`. Prefer `browser.storage` when available, otherwise
// fall back to `chrome.storage`. If neither is available we'll log an error
// so the console shows a clear message instead of a ReferenceError.
const storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage
  : ((typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : null);

if (!storage) {
  console.error('No storage API available: browser.storage and chrome.storage are undefined.');
}

async function load() {
  if (!storage) {
    console.error('Storage not available');
    return;
  }
  
  try {
    console.log('Loading config with defaults:', DEFAULTS);
    // Use local storage instead of sync for better compatibility
    const cfg = await storage.local.get(DEFAULTS);
    console.log('Loaded config:', cfg);
    
    els.geminiKey.value = cfg.geminiApiKey || '';
    els.geminiModel.value = cfg.geminiModel || 'gemini-2.0-flash';
    els.targetLang.value = cfg.targetLang || 'VI';
    els.maxChars.value = cfg.maxChars ?? 600;

    const savedData = await storage.local.get({ savedWords: [] });
    renderSaved(savedData.savedWords);
    
    console.log('Options page loaded successfully');
  } catch (err) {
    console.error('Load error:', err);
  }
}

function renderSaved(list) {
  els.saved.innerHTML = '';
  if (!list || !list.length) { els.saved.textContent = '(empty)'; return; }
  const ul = document.createElement('ul');
  list.forEach((it) => {
    const li = document.createElement('li');
    const d = new Date(it.ts || Date.now());
    li.textContent = `${it.word} → ${it.translation}  — ${d.toLocaleString()}`;
    ul.appendChild(li);
  });
  els.saved.appendChild(ul);
}

els.save.addEventListener('click', async () => {
  if (!storage) {
    alert('Storage API not available in this context.');
    return;
  }
  
  try {
    const apiKey = els.geminiKey.value.trim();
    if (!apiKey) {
      alert('Please enter Gemini API Key!');
      return;
    }
    
    const cfg = {
      geminiApiKey: apiKey,
      geminiModel: els.geminiModel.value.trim() || 'gemini-2.0-flash',
      targetLang: els.targetLang.value,
      maxChars: parseInt(els.maxChars.value || '600', 10)
    };
    
    console.log('Saving config:', cfg);
    // Use local storage instead of sync for better compatibility
    await storage.local.set(cfg);
    console.log('Config saved successfully');
    
    // Verify save
    const saved = await storage.local.get(Object.keys(cfg));
    console.log('Verified saved config:', saved);
    
    alert('✅ Saved successfully!');
  } catch (err) {
    console.error('Save error:', err);
    alert('❌ Error saving: ' + err.message);
  }
});

els.reset.addEventListener('click', async () => {
  if (!storage) return;
  await storage.local.set(DEFAULTS);
  await load();
  alert('Reset to defaults.');
});

els.clear.addEventListener('click', async () => {
  if (!storage) return;
  await storage.local.set({ savedWords: [] });
  renderSaved([]);
});

load();
