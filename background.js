// background.js — MV2 background page (Chrome/Firefox) & MV3 worker compatible
(function () {
  'use strict';

  // Use Chrome API for Brave/Chromium browsers
  const api = chrome;

  const DEFAULTS = {
    geminiModel: 'gemini-2.0-flash',
    geminiApiKey: '',
    targetLang: 'VI', // fixed: always translate to Vietnamese
    maxChars: 120,
    deepLApiKey: '',
    deepLEndpoint: 'free',
    maxWordsPerLine: 8
  };

  function getStore(kind) {
    return api.storage && api.storage[kind];
  }

  function storageGet(kind, keys) {
    const store = getStore(kind);
    if (!store || typeof store.get !== 'function') {
      return Promise.reject(new Error('No storage API available'));
    }

    // Use callback-based API for Chrome/Brave
    return new Promise((resolve, reject) => {
      store.get(keys, (res) => {
        if (api.runtime.lastError) {
          reject(new Error(api.runtime.lastError.message));
        } else {
          resolve(res);
        }
      });
    });
  }

  function storageSet(kind, data) {
    const store = getStore(kind);
    if (!store || typeof store.set !== 'function') {
      return Promise.reject(new Error('No storage API available'));
    }

    // Use callback-based API for Chrome/Brave
    return new Promise((resolve, reject) => {
      store.set(data, () => {
        if (api.runtime.lastError) {
          reject(new Error(api.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  function withDefaults(cfg) {
    return Object.assign({}, DEFAULTS, cfg || {});
  }

  function formatReadingTokens(tokens, cfg) {
    if (!Array.isArray(tokens)) return '';
    const lines = [];
    let cur = [];
    let count = 0;
    const limit = Math.max(1, parseInt((cfg && cfg.maxWordsPerLine) || 8, 10));
    const isEnd = (tok) => /[。！？!?]/.test(tok && tok.slice(-1));
    for (const tok of tokens) {
      if (!tok) continue;
      cur.push(tok);
      count++;
      if (isEnd(tok) || count >= limit) {
        lines.push(cur.join(' '));
        cur = [];
        count = 0;
      }
    }
    if (cur.length) lines.push(cur.join(' '));
    return lines.join('\n');
  }

  // Aggressive LRU cache to reduce API calls
  const CACHE_LIMIT = 200; // Increased cache size
  const cache = new Map(); // key: text, value: { translation, reading, source }
  function cacheGet(key) {
    if (!cache.has(key)) return null;
    const v = cache.get(key);
    cache.delete(key); // refresh recency
    cache.set(key, v);
    return v;
  }
  function cacheSet(key, val) {
    if (cache.has(key)) cache.delete(key);
    cache.set(key, val);
    if (cache.size > CACHE_LIMIT) {
      const first = cache.keys().next().value;
      cache.delete(first);
    }
  }

  api.runtime.onInstalled.addListener(() => {
    storageGet('local', DEFAULTS)
      .then((cfg) => storageSet('local', withDefaults(cfg)))
      .catch((err) => console.warn('Failed to prime defaults:', err));

    // Create context menu for selection translation
    if (api.contextMenus) {
      api.contextMenus.create({
        id: 'translate-selection',
        title: 'Translate to Vietnamese',
        contexts: ['selection']
      });
    }
  });

  function extractJsonLike(str) {
    if (!str) return null;
    let s = String(str).trim();
    // Strip common code fences and language hints
    s = s.replace(/^```(?:json|javascript)?\n?|```$/gim, '').trim();
    // Fast path
    try { return JSON.parse(s); } catch (_) { }
    // Collect balanced JSON object substrings and try parse
    const candidates = [];
    let depth = 0, start = -1;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0 && start !== -1) {
          candidates.push(s.slice(start, i + 1));
          start = -1;
        }
      }
    }
    for (const c of candidates.reverse()) { // prefer the last complete object
      try { return JSON.parse(c); } catch (_) { }
      // naive single-quote repair as a last resort
      if (c.includes("'") && !c.includes('"')) {
        const repaired = c.replace(/'([^']*)'/g, '"$1"');
        try { return JSON.parse(repaired); } catch (_) { }
      }
    }
    return null;
  }

  function parseRetryDelaySeconds(errorJson) {
    try {
      const details = errorJson && errorJson.error && errorJson.error.details;
      if (Array.isArray(details)) {
        for (const d of details) {
          if (d && d['@type'] && String(d['@type']).includes('google.rpc.RetryInfo')) {
            const delay = d.retryDelay || d.retry_delay || '';
            const m = String(delay).match(/(\d+)(?:\.(\d+))?s/);
            if (m) {
              const s = parseInt(m[1] || '0', 10);
              return s;
            }
          }
        }
      }
    } catch (_) { /* ignore */ }
    return null;
  }

  async function translateWithGemini(text, target) {
    const cfg = withDefaults(await storageGet('local', DEFAULTS));
    const key = cfg.geminiApiKey;
    if (!key) throw new Error('Missing Gemini API key. Set it in Options.');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.geminiModel)}:generateContent?key=${encodeURIComponent(key)}`;

    const langLabel = 'Vietnamese'; // fixed translation target
    const isShort = String(text || '').trim().length <= 120;
    // Optimized prompt for JP/EN → VI with reading
    const prompt = `Translate to Vietnamese. Return ONLY valid JSON: {"translation":"..."}

Text: ${text}

JSON:`;

    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: isShort ? 40 : 60, // Reduced - only translation needed
        topP: 0.95,
        topK: 40,
        candidateCount: 1
      }
    };

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timeoutId;
    if (controller) {
      timeoutId = setTimeout(() => controller.abort(), isShort ? 4000 : 6000); // Reduced timeout
    }

    async function doFetch() {
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller ? controller.signal : undefined
      });
    }

    try {
      let resp = await doFetch();

      if (timeoutId) clearTimeout(timeoutId);

      if (!resp.ok) {
        if (resp.status === 429) {
          // Try to parse retry delay and retry once if reasonable (<= 20s)
          let retrySec = null;
          try {
            const ej = await resp.json();
            retrySec = parseRetryDelaySeconds(ej);
          } catch (_) {
            // fall back to text and no retry
          }
          if (typeof retrySec === 'number' && retrySec > 0 && retrySec <= 20) {
            await new Promise(r => setTimeout(r, retrySec * 1000));
            // New controller not strictly necessary if previous not aborted
            resp = await doFetch();
          }
          if (!resp.ok) {
            const t = await resp.text();
            throw new Error(`Gemini HTTP ${resp.status}: ${t}`);
          }
        } else {
          const t = await resp.text();
          throw new Error(`Gemini HTTP ${resp.status}: ${t}`);
        }
      }

      const data = await resp.json();
      const candidates = (data && data.candidates) || [];
      const first = candidates.length ? candidates[0] : null;
      const content = first && first.content;
      const parts = content && content.parts;
      const part = parts && parts.length ? parts[0] : null;
      const raw = part && part.text ? String(part.text).trim() : '';
      const obj = extractJsonLike(raw);
      if (obj && typeof obj.translation === 'string') {
        return { translation: obj.translation, reading: '' }; // Reading from offline DB
      }
      const clean = raw
        .replace(/^```[\s\S]*?```$/g, '')
        .replace(/^```[a-zA-Z]*\n?/, '')
        .replace(/```$/, '')
        .trim();
      return { translation: clean || '(no text)', reading: '' };
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      if (err && err.name === 'AbortError') {
        throw new Error('Translation timeout. Try shorter text.');
      }
      throw err;
    }
  }

  async function translateWithDeepL(text) {
    const cfg = withDefaults(await storageGet('local', DEFAULTS));
    const key = (cfg.deepLApiKey || '').trim();
    if (!key) throw new Error('Missing DeepL API key. Set it in Options.');
    const isPro = (cfg.deepLEndpoint || 'free') === 'pro';
    const url = isPro ? 'https://api.deepl.com/v2/translate' : 'https://api-free.deepl.com/v2/translate';
    const params = new URLSearchParams();
    params.append('text', text);
    params.append('target_lang', 'VI');
    // Leave source_lang empty for auto-detect

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timeoutId;
    if (controller) timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `DeepL-Auth-Key ${key}`
        },
        body: params.toString(),
        signal: controller ? controller.signal : undefined
      });
      if (timeoutId) clearTimeout(timeoutId);
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`DeepL HTTP ${resp.status}: ${t}`);
      }
      const data = await resp.json();
      const translated = data && Array.isArray(data.translations) && data.translations[0] && data.translations[0].text;
      return { translation: translated || '(no text)', reading: '' };
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      if (err && err.name === 'AbortError') {
        throw new Error('DeepL timeout. Try shorter text.');
      }
      throw err;
    }
  }

  // (LibreTranslate fallback removed)

  // Simplified pipeline: call Gemini directly (JP/EN → VI only)
  async function translatePipeline(text, cfg) {
    const t = String(text || '').trim();
    if (!t) return { translation: '', reading: '' };
    const cached = cacheGet(t);
    if (cached) return Object.assign({ cached: true }, cached);
    try {
      const result = await translateWithGemini(t, 'VI');
      const out = Object.assign({ source: 'gemini' }, result);
      if (!out.reading && typeof OfflineDB !== 'undefined' && OfflineDB && typeof OfflineDB.buildReadingTokens === 'function') {
        try {
          const tokens = await OfflineDB.buildReadingTokens(t);
          let reading = Array.isArray(tokens) ? formatReadingTokens(tokens, cfg) : '';

          // Post-process: proper spacing with strict lookaround
          // Match particles only when NOT preceded/followed by letters or apostrophes
          reading = reading
            .replace(/(?<![A-Za-z''])(kara|made|yori|shika|dake|koso|tte|nado|wa|ga|wo|o|ni|de|he|e|to|ya|mo|no)(?![A-Za-z''])/g, ' $1 ');

          // Gom auxiliaries (no space)
          reading = reading
            .replace(/shi\s+sugi/g, 'shisugi')
            .replace(/te\s+shimau/g, 'teshimau')
            .replace(/te\s+iru/g, 'teiru')
            .replace(/te\s+iku/g, 'teiku')
            .replace(/te\s+kuru/g, 'tekuru')
            .replace(/de\s+wa\s+nai/g, 'janai')
            .replace(/ja\s+nai/g, 'janai')
            .replace(/cha\s+u/g, 'chau');

          // Add apostrophe for n + y to avoid misreading
          reading = reading.replace(/n([yY][aeiou])/g, "n'$1");

          // Clean up spacing
          reading = reading
            .replace(/\s+([,.;!?、。！？])/g, '$1')
            .replace(/\s{2,}/g, ' ')
            .trim();

          out.reading = reading;
        } catch (_) { }
      }
      cacheSet(t, out);
      return out;
    } catch (e) {
      // Fallback to DeepL if configured
      const cfg2 = withDefaults(cfg);
      if (cfg2.deepLApiKey) {
        const dl = await translateWithDeepL(t);
        const out2 = Object.assign({ source: 'deepl' }, dl);
        if (!out2.reading && typeof OfflineDB !== 'undefined' && OfflineDB && typeof OfflineDB.buildReadingTokens === 'function') {
          try {
            const tokens2 = await OfflineDB.buildReadingTokens(t);
            let reading = Array.isArray(tokens2) ? formatReadingTokens(tokens2, cfg2) : '';

            // Post-process: proper spacing with strict lookaround
            reading = reading
              .replace(/(?<![A-Za-z''])(kara|made|yori|shika|dake|koso|tte|nado|wa|ga|wo|o|ni|de|he|e|to|ya|mo|no)(?![A-Za-z''])/g, ' $1 ');

            reading = reading
              .replace(/shi\s+sugi/g, 'shisugi')
              .replace(/te\s+shimau/g, 'teshimau')
              .replace(/te\s+iru/g, 'teiru')
              .replace(/te\s+iku/g, 'teiku')
              .replace(/te\s+kuru/g, 'tekuru')
              .replace(/de\s+wa\s+nai/g, 'janai')
              .replace(/ja\s+nai/g, 'janai')
              .replace(/cha\s+u/g, 'chau')
              .replace(/n([yY][aeiou])/g, "n'$1")
              .replace(/\s+([,.;!?、。！？])/g, '$1')
              .replace(/\s{2,}/g, ' ')
              .trim();

            out2.reading = reading;
          } catch (_) { }
        }
        cacheSet(t, out2);
        return out2;
      }
      throw e;
    }
  }

  // Context menu click handler
  if (api.contextMenus) {
    api.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'translate-selection' && info.selectionText) {
        // Send message to content script to show translation
        api.tabs.sendMessage(tab.id, {
          type: 'TRANSLATE_FROM_CONTEXT',
          text: info.selectionText
        });
      }
    });
  }

  api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'TRANSLATE_TEXT') {
      (async () => {
        try {
          const cfg = withDefaults(await storageGet('local', DEFAULTS));
          const text = String(msg.text || '').slice(0, cfg.maxChars);
          const result = await translatePipeline(text, cfg);
          sendResponse(Object.assign({ ok: true }, result));
        } catch (err) {
          sendResponse({ ok: false, error: err && err.message ? err.message : String(err) });
        }
      })();
      return true;
    }

    if (msg && msg.type === 'GET_TTS_AUDIO') {
      (async () => {
        try {
          const text = encodeURIComponent(msg.text || '');
          const lang = msg.lang === 'ja' ? 'ja-JP' : 'en-US';
          const gender = 'female';

          // ResponsiveVoice TTS API
          const url = `https://texttospeech.responsivevoice.org/v1/text:synthesize?text=${text}&lang=${lang}&engine=g1&name=&pitch=0.5&rate=0.45&volume=1&key=f1Z4PY3y&gender=${gender}`;

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`TTS API error: ${response.status}`);
          }

          const audioBlob = await response.blob();
          const arrayBuffer = await audioBlob.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

          sendResponse({ ok: true, audioBase64: base64, mimeType: audioBlob.type });

        } catch (err) {
          sendResponse({ ok: false, error: err && err.message ? err.message : String(err) });
        }
      })();
      return true;
    }

    return undefined;
  });
})();
