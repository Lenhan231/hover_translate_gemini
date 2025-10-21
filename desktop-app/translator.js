// translator.js - Gemini API integration (reused from extension)
const fetch = require('node-fetch');
const Store = require('electron-store');
const store = new Store();

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
      try { return JSON.parse(m[0]); } catch (e) { }
    }
  }
  return null;
}

async function translateText(text) {
  try {
    const apiKey = store.get('geminiApiKey');
    if (!apiKey) {
      return { ok: false, error: 'Missing Gemini API key. Set it in Settings.' };
    }

    const model = store.get('geminiModel', 'gemini-2.0-flash');
    const targetLang = store.get('targetLang', 'VI');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const langLabel = targetLang === 'VI' ? 'Vietnamese' : 'English';
    
    // Enhanced prompt to ALWAYS get romaji for Japanese
    const prompt = `You are a professional translator. Translate the following text to ${langLabel}.

CRITICAL RULES:
1. If the source language is Japanese (日本語), you MUST ALWAYS include romaji reading
2. If the source language is Chinese (中文), include pinyin
3. If the source language is Korean (한국어), include romanization
4. For other languages, leave reading empty

OUTPUT FORMAT (strict JSON only, no markdown):
{
  "translation": "your translation here",
  "reading": "romaji/pinyin/romanization here (REQUIRED for Japanese/Chinese/Korean)"
}

EXAMPLE for Japanese:
Input: 日本語能力試験
Output: {"translation":"Kỳ thi năng lực Nhật ngữ","reading":"Nihongo Nōryoku Shiken"}

Now translate this text:
${text}`;

    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 300,
        topP: 0.8,
        topK: 10
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const errorText = await resp.text();
      return { ok: false, error: `Gemini HTTP ${resp.status}: ${errorText}` };
    }

    const data = await resp.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const obj = extractJsonLike(raw);

    if (obj && typeof obj.translation === 'string') {
      return {
        ok: true,
        translation: obj.translation,
        reading: obj.reading || ''
      };
    }

    const clean = raw.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
    return {
      ok: true,
      translation: clean || '(no text)',
      reading: ''
    };

  } catch (err) {
    if (err.name === 'AbortError') {
      return { ok: false, error: 'Translation timeout. Try shorter text.' };
    }
    return { ok: false, error: err.message };
  }
}

module.exports = { translateText };
