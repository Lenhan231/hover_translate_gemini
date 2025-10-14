
// background.js (service worker, MV3) — v1.3.0

const DEFAULTS = {
  provider: 'gemini',
  geminiModel: 'gemini-2.0-flash',
  geminiApiKey: '',
  deeplApiKey: '',
  targetLang: 'VI',
  maxChars: 600
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(DEFAULTS, (cfg) => {
    chrome.storage.sync.set({ ...DEFAULTS, ...cfg });
  });
});

function extractJsonLike(str) {
  if (!str) return null;
  // Remove code fences like ```json ... ```
  str = str.trim();
  if (str.startsWith("```")) {
    str = str.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
  }
  // Try direct JSON parse
  try { return JSON.parse(str); } catch (e) { }
  // Try to find the first {...} block
  const m = str.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch (e) { }
  }
  return null;
}

async function translateWithGemini(text, target) {
  const cfg = await chrome.storage.sync.get(DEFAULTS);
  const key = cfg.geminiApiKey;
  if (!key) throw new Error('Missing Gemini API key. Set it in Options.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.geminiModel}:generateContent?key=${encodeURIComponent(key)}`;

  // Shorter, more direct prompt for faster response
  const targetLang = target === 'VI' ? 'Vietnamese' : 'English';
  const prompt = `Translate Japanese to ${targetLang}. Also provide romaji reading.
Return only JSON format: {"translation":"translated text here","reading":"romaji reading here"}

Japanese text: ${text}`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,  // Lower = faster, more consistent
      maxOutputTokens: 200,  // Limit output for speed
      topP: 0.8,
      topK: 10
    }
  };

  // Add timeout for faster failure
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Gemini HTTP ${resp.status}: ${t}`);
    }

    const data = await resp.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const obj = extractJsonLike(raw);
    if (obj && typeof obj.translation === 'string') {
      return { translation: obj.translation, reading: obj.reading || '' };
    }
    // Fallback: treat raw text as translation, strip fences
    const clean = raw.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
    return { translation: clean || '(no text)', reading: '' };
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      throw new Error('Translation timeout. Try shorter text.');
    }
    throw e;
  }
}

async function translateWithDeepL(text, target) {
  const cfg = await chrome.storage.sync.get(DEFAULTS);
  const key = cfg.deeplApiKey;
  if (!key) throw new Error('Missing DeepL API key. Set it in Options.');

  const endpoint = 'https://api-free.deepl.com/v2/translate';
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
  const out = data?.translations?.[0]?.text?.trim() || '';
  return { translation: out, reading: '' };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'TRANSLATE_TEXT') {
    (async () => {
      try {
        const cfg = await chrome.storage.sync.get(DEFAULTS);
        const text = (msg.text || '').slice(0, cfg.maxChars);
        const target = cfg.targetLang || 'VI';
        let result;
        if (cfg.provider === 'deepl') {
          result = await translateWithDeepL(text, target);
        } else {
          result = await translateWithGemini(text, target);
        }
        sendResponse({ ok: true, ...result });
      } catch (e) {
        sendResponse({ ok: false, error: e.message || String(e) });
      }
    })();
    return true;
  }
});
