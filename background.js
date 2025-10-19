// background.js — MV2 background page (Chrome/Firefox) & MV3 worker compatible
(function () {
  'use strict';

  const api = (typeof browser !== 'undefined') ? browser :
              ((typeof chrome !== 'undefined') ? chrome : null);

  if (!api) {
    console.error('No WebExtension API available (browser/chrome).');
    return;
  }

  const DEFAULTS = {
    geminiModel: 'gemini-2.0-flash',
    geminiApiKey: '',
    targetLang: 'VI',
    maxChars: 600
  };

  function getStore(kind) {
    return api.storage && api.storage[kind];
  }

  function storageGet(kind, keys) {
    const store = getStore(kind);
    if (!store || typeof store.get !== 'function') {
      return Promise.reject(new Error('No storage API available'));
    }
    // Firefox (browser.*) exposes Promise-based API with arity 1
    if (store.get.length <= 1) {
      try {
        const maybePromise = store.get(keys);
        if (maybePromise && typeof maybePromise.then === 'function') {
          return maybePromise;
        }
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return new Promise((resolve, reject) => {
      try {
        store.get(keys, (res) => {
          const err = api.runtime && api.runtime.lastError;
          if (err) {
            reject(new Error(err.message || String(err)));
          } else {
            resolve(res);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  function storageSet(kind, data) {
    const store = getStore(kind);
    if (!store || typeof store.set !== 'function') {
      return Promise.reject(new Error('No storage API available'));
    }
    if (store.set.length <= 1) {
      try {
        const maybePromise = store.set(data);
        if (maybePromise && typeof maybePromise.then === 'function') {
          return maybePromise;
        }
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return new Promise((resolve, reject) => {
      try {
        store.set(data, () => {
          const err = api.runtime && api.runtime.lastError;
          if (err) {
            reject(new Error(err.message || String(err)));
          } else {
            resolve();
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  function withDefaults(cfg) {
    return Object.assign({}, DEFAULTS, cfg || {});
  }

  api.runtime.onInstalled.addListener(() => {
    storageGet('local', DEFAULTS)
      .then((cfg) => storageSet('local', withDefaults(cfg)))
      .catch((err) => console.warn('Failed to prime defaults:', err));
  });

  function extractJsonLike(str) {
    if (!str) return null;
    let trimmed = String(str).trim();
    if (trimmed.startsWith('```')) {
      trimmed = trimmed.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
    }
    try {
      return JSON.parse(trimmed);
    } catch (err) {
      const m = trimmed.match(/\{[\s\S]*\}/);
      if (m) {
        try { return JSON.parse(m[0]); } catch (e) { /* ignore */ }
      }
    }
    return null;
  }

  async function translateWithGemini(text, target) {
    const cfg = withDefaults(await storageGet('local', DEFAULTS));
    const key = cfg.geminiApiKey;
    if (!key) throw new Error('Missing Gemini API key. Set it in Options.');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.geminiModel)}:generateContent?key=${encodeURIComponent(key)}`;

    const langLabel = target === 'VI' ? 'Vietnamese'
      : (target === 'EN' ? 'English' : target);
    const prompt = `Detect the source language and translate to ${langLabel}. If source is Japanese/Chinese/Korean, provide romanized reading.\nReturn JSON: {"translation":"...","reading":"romanization or empty"}\n\nText: ${text}`;

    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 200,
        topP: 0.8,
        topK: 10
      }
    };

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timeoutId;
    if (controller) {
      timeoutId = setTimeout(() => controller.abort(), 8000);
    }

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller ? controller.signal : undefined
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Gemini HTTP ${resp.status}: ${t}`);
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
        return { translation: obj.translation, reading: obj.reading || '' };
      }
      const clean = raw.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
      return { translation: clean || '(no text)', reading: '' };
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      if (err && err.name === 'AbortError') {
        throw new Error('Translation timeout. Try shorter text.');
      }
      throw err;
    }
  }

  api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'TRANSLATE_TEXT') {
      (async () => {
        try {
          const cfg = withDefaults(await storageGet('local', DEFAULTS));
          const text = String(msg.text || '').slice(0, cfg.maxChars);
          const target = cfg.targetLang || 'VI';
          const result = await translateWithGemini(text, target);
          sendResponse(Object.assign({ ok: true }, result));
        } catch (err) {
          sendResponse({ ok: false, error: err && err.message ? err.message : String(err) });
        }
      })();
      return true;
    }
    return undefined;
  });
})();
