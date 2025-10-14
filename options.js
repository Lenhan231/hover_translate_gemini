
const DEFAULTS = {
  provider: 'gemini',
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash',
  deeplApiKey: '',
  targetLang: 'VI',
  maxChars: 600
};

const els = {
  provider: document.getElementById('provider'),
  geminiKey: document.getElementById('geminiKey'),
  geminiModel: document.getElementById('geminiModel'),
  deeplKey: document.getElementById('deeplKey'),
  targetLang: document.getElementById('targetLang'),
  maxChars: document.getElementById('maxChars'),
  save: document.getElementById('save'),
  reset: document.getElementById('reset'),
  saved: document.getElementById('saved'),
  clear: document.getElementById('clear')
};

async function load() {
  const cfg = await chrome.storage.sync.get(DEFAULTS);
  els.provider.value = cfg.provider;
  els.geminiKey.value = cfg.geminiApiKey || '';
  els.geminiModel.value = cfg.geminiModel || 'gemini-2.0-flash';
  els.deeplKey.value = cfg.deeplApiKey || '';
  els.targetLang.value = cfg.targetLang || 'VI';
  els.maxChars.value = cfg.maxChars ?? 600;

  const loc = await chrome.storage.local.get({ savedWords: [] });
  renderSaved(loc.savedWords);
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
  const cfg = {
    provider: els.provider.value,
    geminiApiKey: els.geminiKey.value.trim(),
    geminiModel: els.geminiModel.value.trim() || 'gemini-2.0-flash',
    deeplApiKey: els.deeplKey.value.trim(),
    targetLang: els.targetLang.value,
    maxChars: parseInt(els.maxChars.value || '600', 10)
  };
  await chrome.storage.sync.set(cfg);
  alert('Saved.');
});

els.reset.addEventListener('click', async () => {
  await chrome.storage.sync.set(DEFAULTS);
  await load();
  alert('Reset to defaults.');
});

els.clear.addEventListener('click', async () => {
  await chrome.storage.local.set({ savedWords: [] });
  renderSaved([]);
});

load();
