
const DEFAULTS = {
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash',
  targetLang: 'VI', // fixed
  maxChars: 120,
  deepLApiKey: '',
  deepLEndpoint: 'free',
  maxWordsPerLine: 8
};

const els = {
  geminiKey: document.getElementById('geminiKey'),
  geminiModel: document.getElementById('geminiModel'),
  maxChars: document.getElementById('maxChars'),
  maxWordsPerLine: document.getElementById('maxWordsPerLine'),
  ipaFile: document.getElementById('ipaFile'),
  jaFile: document.getElementById('jaFile'),
  importIPA: document.getElementById('importIPA'),
  importJA: document.getElementById('importJA'),
  clearIPA: document.getElementById('clearIPA'),
  clearJA: document.getElementById('clearJA'),
  countIPA: document.getElementById('countIPA'),
  countJA: document.getElementById('countJA'),
  deepLApiKey: document.getElementById('deepLKey'),
  deepLEndpoint: document.getElementById('deepLEndpoint'),
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
    els.maxChars.value = cfg.maxChars ?? 120;
    els.maxWordsPerLine.value = cfg.maxWordsPerLine ?? 8;
    els.deepLApiKey.value = cfg.deepLApiKey || '';
    els.deepLEndpoint.value = cfg.deepLEndpoint || 'free';

    const savedData = await storage.local.get({ savedWords: [] });
    renderSaved(savedData.savedWords);

    // Load counts for offline DB
    try {
      const ipaCount = await (window.OfflineDB ? window.OfflineDB.countIPA() : Promise.resolve(0));
      const jaCount = await (window.OfflineDB ? window.OfflineDB.countJA() : Promise.resolve(0));
      els.countIPA.textContent = `(entries: ${ipaCount})`;
      els.countJA.textContent = `(entries: ${jaCount})`;
    } catch (e) {
      console.warn('OfflineDB count failed:', e);
    }
    
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
      targetLang: 'VI',
      maxChars: parseInt(els.maxChars.value || '120', 10),
      deepLApiKey: els.deepLApiKey.value.trim(),
      deepLEndpoint: els.deepLEndpoint.value,
      maxWordsPerLine: parseInt(els.maxWordsPerLine.value || '8', 10)
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

// ------- Offline import handlers -------
async function readFileAsText(file) {
  if (!file) throw new Error('No file selected');
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ''));
    fr.onerror = () => reject(fr.error || new Error('Read error'));
    fr.readAsText(file);
  });
}

if (window.OfflineDB) {
  els.importIPA?.addEventListener('click', async () => {
    try {
      const txt = await readFileAsText(els.ipaFile.files[0]);
      const res = await window.OfflineDB.importIPAFromText(txt);
      const c = await window.OfflineDB.countIPA();
      els.countIPA.textContent = `(entries: ${c})`;
      alert(`Imported IPA: ${res.imported} entries`);
    } catch (e) {
      alert('Import IPA failed: ' + (e && e.message ? e.message : e));
    }
  });

  els.clearIPA?.addEventListener('click', async () => {
    await window.OfflineDB.clearIPA();
    const c = await window.OfflineDB.countIPA();
    els.countIPA.textContent = `(entries: ${c})`;
  });

  els.importJA?.addEventListener('click', async () => {
    try {
      const txt = await readFileAsText(els.jaFile.files[0]);
      const res = await window.OfflineDB.importJMdictFromText(txt);
      const c = await window.OfflineDB.countJA();
      els.countJA.textContent = `(entries: ${c})`;
      alert(`Imported JMdict entries: ${res.imported}`);
    } catch (e) {
      alert('Import JMdict failed: ' + (e && e.message ? e.message : e));
    }
  });

  els.clearJA?.addEventListener('click', async () => {
    await window.OfflineDB.clearJA();
    const c = await window.OfflineDB.countJA();
    els.countJA.textContent = `(entries: ${c})`;
  });
}
