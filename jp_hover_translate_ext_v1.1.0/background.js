
// background.js (service worker, MV3)

const DEFAULTS = {
  provider: 'gemini', // 'gemini' or 'deepl'
  geminiModel: 'gemini-2.0-flash',
  geminiApiKey: '',
  deeplApiKey: '',
  targetLang: 'VI', // VI or EN
  maxChars: 600
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(DEFAULTS, (cfg) => {
    chrome.storage.sync.set({ ...DEFAULTS, ...cfg });
  });
});

async function translateWithGemini(text, target) {
  const cfg = await chrome.storage.sync.get(DEFAULTS);
  const key = cfg.geminiApiKey;
  if (!key) throw new Error('Missing Gemini API key. Set it in Options.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.geminiModel}:generateContent?key=${encodeURIComponent(key)}`;

  const system = `You are a precise translator. Translate Japanese to ${target === 'VI' ? 'Vietnamese' : 'English'}. 
- If text is already ${target}, keep it natural but short.
- Return ONLY the translation, no quotes or extra notes.`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {text: system},
          {text: `Text:\n${text}`}
        ]
      }
    ]
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Gemini HTTP ${resp.status}: ${t}`);
  }

  const data = await resp.json();
  const out = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!out) throw new Error('Gemini responded without text.');
  return out;
}

async function translateWithDeepL(text, target) {
  const cfg = await chrome.storage.sync.get(DEFAULTS);
  const key = cfg.deeplApiKey;
  if (!key) throw new Error('Missing DeepL API key. Set it in Options.');

  const endpoint = key.startswith?.('dp_') ? 'https://api-free.deepl.com/v2/translate' : 'https://api-free.deepl.com/v2/translate';
  const params = new URLSearchParams();
  params.append('text', text);
  params.append('target_lang', target);
  params.append('source_lang', 'JA');

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`DeepL HTTP ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  const out = data?.translations?.[0]?.text?.trim();
  if (!out) throw new Error('DeepL responded without text.');
  return out;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'TRANSLATE_TEXT') {
    (async () => {
      try {
        const cfg = await chrome.storage.sync.get(DEFAULTS);
        const text = (msg.text || '').slice(0, cfg.maxChars);
        const target = cfg.targetLang || 'VI';
        let translation = '';
        if (cfg.provider === 'deepl') {
          translation = await translateWithDeepL(text, target);
        } else {
          translation = await translateWithGemini(text, target);
        }
        sendResponse({ ok: true, translation });
      } catch (e) {
        sendResponse({ ok: false, error: e.message || String(e) });
      }
    })();
    return true; // keep port open for async sendResponse
  }
});
