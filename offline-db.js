// offline-db.js — IndexedDB for offline readings (EN IPA, JA kana)
(function () {
  'use strict';

  const DB_NAME = 'qt_offline_db';
  const DB_VERSION = 1;
  const STORES = { IPA: 'ipa', JA: 'ja' };

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (ev) => {
        const db = ev.target.result;
        if (!db.objectStoreNames.contains(STORES.IPA)) {
          db.createObjectStore(STORES.IPA, { keyPath: 'w' }); // { w: word, v: ipa }
        }
        if (!db.objectStoreNames.contains(STORES.JA)) {
          db.createObjectStore(STORES.JA, { keyPath: 'k' }); // { k: kanjiOrKana, v: kana }
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IDB open error'));
    });
    return dbPromise;
  }

  function tx(db, store, mode) {
    return db.transaction([store], mode).objectStore(store);
  }

  async function clearStore(store) {
    const db = await openDB();
    await new Promise((res, rej) => {
      const r = tx(db, store, 'readwrite').clear();
      r.onsuccess = () => res();
      r.onerror = () => rej(r.error);
    });
  }

  async function countStore(store) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const r = tx(db, store, 'readonly').count();
      r.onsuccess = () => res(r.result || 0);
      r.onerror = () => rej(r.error);
    });
  }

  // ------- Importers -------
  async function importIPAFromText(text) {
    const lines = String(text || '').split(/\r?\n/);
    const db = await openDB();
    const store = tx(db, STORES.IPA, 'readwrite');
    let n = 0;
    for (const ln of lines) {
      const s = ln.trim();
      if (!s) continue;
      if (s[0] === '{') {
        try {
          const obj = JSON.parse(s);
          const w = String(obj.w || obj.word || '').toLowerCase();
          const ipa = String(obj.ipa || obj.v || '').trim();
          if (w && ipa) {
            await new Promise((res, rej) => { const r = store.put({ w, v: ipa }); r.onsuccess=()=>res(); r.onerror=()=>rej(r.error); });
            n++;
          }
        } catch (_) {}
        continue;
      }
      // TSV: word\tipa
      const m = s.split(/\t+/);
      if (m.length >= 2) {
        const w = m[0].toLowerCase();
        const ipa = m[1].trim();
        if (w && ipa) {
          await new Promise((res, rej) => { const r = store.put({ w, v: ipa }); r.onsuccess=()=>res(); r.onerror=()=>rej(r.error); });
          n++;
        }
      }
    }
    return { imported: n };
  }

  async function importJMdictFromText(text) {
    let arr;
    const s = String(text || '').trim();
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        arr = parsed;
      } else if (parsed && Array.isArray(parsed.words)) {
        // Handle full JMdict JSON dump with top-level { words: [...] }
        arr = parsed.words;
      } else {
        arr = parsed;
      }
    } catch (_) {
      // Try JSON lines (NDJSON)
      arr = s.split(/\r?\n/).map(t => { try { return JSON.parse(t); } catch { return null; } }).filter(Boolean);
    }
    if (!Array.isArray(arr)) throw new Error('Invalid JMdict format');
    const db = await openDB();
    const store = tx(db, STORES.JA, 'readwrite');
    let n = 0;

    function normalizeTexts(list, field) {
      if (!Array.isArray(list)) return [];
      // Accept either array of strings or array of objects with `text`
      const out = [];
      for (const item of list) {
        if (typeof item === 'string') out.push(item);
        else if (item && typeof item.text === 'string') out.push(item.text);
      }
      return out;
    }

    for (const it of arr) {
      // Accept both our earlier mini format and full JMdict-like
      const kanaListRaw = Array.isArray(it.r) ? it.r : (Array.isArray(it.kana) ? it.kana : []);
      const kanjiListRaw = Array.isArray(it.k) ? it.k : (Array.isArray(it.kanji) ? it.kanji : []);

      // Build kana entries [{text, appliesToKanji?: string[] }]
      const kanaEntries = [];
      if (Array.isArray(it.r)) {
        for (const r of it.r) if (r) kanaEntries.push({ text: String(r) });
      } else if (Array.isArray(it.kana)) {
        for (const k of it.kana) {
          if (!k) continue;
          const textVal = typeof k === 'string' ? k : k.text;
          if (!textVal) continue;
          const applies = (k.appliesToKanji && Array.isArray(k.appliesToKanji)) ? k.appliesToKanji : ['*'];
          const common = !!(k.common);
          kanaEntries.push({ text: String(textVal), appliesToKanji: applies, common });
        }
      }

      // Kanji strings
      const kanjiTexts = normalizeTexts(kanjiListRaw, 'text');

      if (!kanaEntries.length && !kanjiTexts.length) continue;

      // Prefer kana entry with common:true if available
      let preferred = null;
      if (Array.isArray(it.kana)) {
        const commonFirst = it.kana.find(x => x && x.common && x.text);
        if (commonFirst) preferred = commonFirst.text;
      }

      for (const ke of kanaEntries.length ? kanaEntries : (preferred ? [{ text: preferred }] : [])) {
        const reading = String(ke.text || '').trim();
        if (!reading) continue;

        if (kanjiTexts.length) {
          const applies = ke.appliesToKanji || ['*'];
          const targets = applies.includes('*') ? kanjiTexts : kanjiTexts.filter(k => applies.includes(k));
          for (const kj of targets) {
            const key = String(kj).trim(); if (!key) continue;
            // Prefer existing hiragana/common readings over katakana uncommon ones
            // eslint-disable-next-line no-await-in-loop
            await new Promise((res, rej) => {
              const getReq = store.get(key);
              getReq.onsuccess = () => {
                const existing = getReq.result && getReq.result.v;
                const exScore = existing ? ((/[\u3040-\u309F]/.test(existing) ? 1 : 0)) : 0; // hiragana > katakana
                const candScore = (/[\u3040-\u309F]/.test(reading) ? 1 : 0) + (ke.common ? 1 : 0);
                if (!existing || candScore >= exScore) {
                  const putReq = store.put({ k: key, v: reading });
                  putReq.onsuccess = () => res();
                  putReq.onerror = () => rej(putReq.error);
                } else {
                  res();
                }
              };
              getReq.onerror = () => rej(getReq.error);
            });
            n++;
          }
        } else {
          // No kanji: map kana itself to reading (useful for kana-only tokens)
          // eslint-disable-next-line no-await-in-loop
          await new Promise((res, rej) => { const r = store.put({ k: reading, v: reading }); r.onsuccess=()=>res(); r.onerror=()=>rej(r.error); });
          n++;
        }
      }
    }
    return { imported: n };
  }

  // ------- Lookups -------
  async function getIPA(word) {
    const w = String(word || '').toLowerCase();
    if (!w) return null;
    const db = await openDB();
    return new Promise((res, rej) => {
      const r = tx(db, STORES.IPA, 'readonly').get(w);
      r.onsuccess = () => res(r.result ? r.result.v : null);
      r.onerror = () => rej(r.error);
    });
  }

  function pickIpaVariant(ipaRaw, word) {
    if (!ipaRaw) return null;
    const variants = String(ipaRaw)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (variants.length === 0) return null;

    const w = String(word || '').toLowerCase();
    const functionWords = new Set(['a','an','the','and','or','but','for','to','of','in','on','at','from','by','with','as','about','into','over','after','before','between','through','during','without','under']);

    const score = (v) => {
      // Strip slashes to inspect
      const core = v.replace(/^\/+|\/+$/g, '');
      let s = 0;
      // Prefer no primary/secondary stress for function words; prefer stressed for content words
      const hasStress = /[ˈˌ]/.test(core);
      if (functionWords.has(w)) s += hasStress ? -2 : 2; else s += hasStress ? 2 : 0;
      // Prefer schwa/weakened forms for function words (ə ɚ ɐ ɜ)
      if (functionWords.has(w) && /[əɚɐɜ]/.test(core)) s += 2;
      // Slightly prefer shorter forms
      s += -core.length * 0.01;
      return s;
    };

    variants.sort((a,b) => score(b) - score(a));
    return variants[0];
  }

  function isLatinLetter(ch) { return /[A-Za-z]/.test(ch); }
  function isKana(ch) {
    const code = ch.charCodeAt(0);
    return (code >= 0x3040 && code <= 0x309F) || (code >= 0x30A0 && code <= 0x30FF);
  }
  function isHiragana(ch) { const c=ch.charCodeAt(0); return c>=0x3040 && c<=0x309F; }
  function isKatakana(ch) { const c=ch.charCodeAt(0); return c>=0x30A0 && c<=0x30FF; }
  function isKanji(ch) {
    const code = ch.charCodeAt(0);
    return (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF);
  }

  function kanaToRomaji(kana) {
    // Minimal same map as content.js (subset sufficient for UI)
    const map = {
      ぁ:'a', あ:'a', ぃ:'i', い:'i', ぅ:'u', う:'u', ぇ:'e', え:'e', ぉ:'o', お:'o', ゃ:'ya', や:'ya', ゅ:'yu', ゆ:'yu', ょ:'yo', よ:'yo', ゎ:'wa', わ:'wa', を:'o', ん:'n',
      か:'ka', き:'ki', く:'ku', け:'ke', こ:'ko', が:'ga', ぎ:'gi', ぐ:'gu', げ:'ge', ご:'go',
      さ:'sa', し:'shi', す:'su', せ:'se', そ:'so', ざ:'za', じ:'ji', ず:'zu', ぜ:'ze', ぞ:'zo',
      た:'ta', ち:'chi', つ:'tsu', て:'te', と:'to', だ:'da', ぢ:'ji', づ:'zu', で:'de', ど:'do',
      な:'na', に:'ni', ぬ:'nu', ね:'ne', の:'no', は:'ha', ひ:'hi', ふ:'fu', へ:'he', ほ:'ho', ば:'ba', び:'bi', ぶ:'bu', べ:'be', ぼ:'bo', ぱ:'pa', ぴ:'pi', ぷ:'pu', ぺ:'pe', ぽ:'po',
      ま:'ma', み:'mi', む:'mu', め:'me', も:'mo', ら:'ra', り:'ri', る:'ru', れ:'re', ろ:'ro',
      きゃ:'kya', きゅ:'kyu', きょ:'kyo', ぎゃ:'gya', ぎゅ:'gyu', ぎょ:'gyo', しゃ:'sha', しゅ:'shu', しょ:'sho', じゃ:'ja', じゅ:'ju', じょ:'jo', ちゃ:'cha', ちゅ:'chu', ちょ:'cho',
      にゃ:'nya', にゅ:'nyu', にょ:'nyo', ひゃ:'hya', ひゅ:'hyu', ひょ:'hyo', びゃ:'bya', びゅ:'byu', びょ:'byo', ぴゃ:'pya', ぴゅ:'pyu', ぴょ:'pyo', みゃ:'mya', みゅ:'myu', みょ:'myo', りゃ:'rya', りゅ:'ryu', りょ:'ryo', ゔ:'vu',
      ァ:'a', ア:'a', ィ:'i', イ:'i', ゥ:'u', ウ:'u', ェ:'e', エ:'e', ォ:'o', オ:'o', ャ:'ya', ヤ:'ya', ュ:'yu', ユ:'yu', ョ:'yo', ヨ:'yo', ヮ:'wa', ワ:'wa', ヲ:'o', ン:'n',
      カ:'ka', キ:'ki', ク:'ku', ケ:'ke', コ:'ko', ガ:'ga', ギ:'gi', グ:'gu', ゲ:'ge', ゴ:'go', サ:'sa', シ:'shi', ス:'su', セ:'se', ソ:'so', ザ:'za', ジ:'ji', ズ:'zu', ゼ:'ze', ゾ:'zo',
      タ:'ta', チ:'chi', ツ:'tsu', テ:'te', ト:'to', ダ:'da', ヂ:'ji', ヅ:'zu', デ:'de', ド:'do', ナ:'na', ニ:'ni', ヌ:'nu', ネ:'ne', ノ:'no', ハ:'ha', ヒ:'hi', フ:'fu', ヘ:'he', ホ:'ho',
      バ:'ba', ビ:'bi', ブ:'bu', ベ:'be', ボ:'bo', パ:'pa', ピ:'pi', プ:'pu', ペ:'pe', ポ:'po', マ:'ma', ミ:'mi', ム:'mu', メ:'me', モ:'mo', ラ:'ra', リ:'ri', ル:'ru', レ:'re', ロ:'ro',
      キャ:'kya', キュ:'kyu', キョ:'kyo', ギャ:'gya', ギュ:'gyu', ギョ:'gyo', シャ:'sha', シュ:'shu', ショ:'sho', ジャ:'ja', ジュ:'ju', ジョ:'jo', チャ:'cha', チュ:'chu', チョ:'cho',
      ニャ:'nya', ニュ:'nyu', ニョ:'nyo', ヒャ:'hya', ヒュ:'hyu', ヒョ:'hyo', ビャ:'bya', ビュ:'byu', ビョ:'byo', ピャ:'pya', ピュ:'pyu', ピョ:'pyo', ミャ:'mya', ミュ:'myu', ミョ:'myo', リャ:'rya', リュ:'ryu', リョ:'ryo', ヴ:'vu'
    };
    const sokuon = /[\u3063\u30C3]/; // small tsu
    const choon = '\u30FC';
    let out = '';
    const src = String(kana);
    for (let i = 0; i < src.length; ) {
      const three = src.slice(i, i+3);
      const two = src.slice(i, i+2);
      if (map[three]) { out += map[three]; i += 3; continue; }
      if (map[two]) { out += map[two]; i += 2; continue; }
      const ch = src[i];
      if (sokuon.test(ch)) {
        const next = src.slice(i+1, i+3);
        const roma = map[next] || map[src[i+1]] || '';
        if (roma) out += roma[0];
        i += 1; continue;
      }
      if (ch === choon) {
        const m = out.match(/[aeiou]$/); if (m) out += m[0];
        i += 1; continue;
      }
      out += map[ch] || ch; i += 1;
    }
    return out.replace(/nn(?=[bmp])/g, 'm');
  }

  async function lookupJAkanjiLongest(text, maxLen = 8) {
    const db = await openDB();
    const store = tx(db, STORES.JA, 'readonly');
    const s = String(text || '');
    const parts = [];
    let i = 0;
    while (i < s.length) {
      let matched = null; let matchedLen = 0;
      const limit = Math.min(maxLen, s.length - i);
      for (let l = limit; l >= 1; l--) {
        const sub = s.substr(i, l);
        // skip spaces/punct as standalone tokens
        if (/^[\s、。・.,!?"'()\[\]-]+$/.test(sub)) { matched = { kana: sub, punct: true, surface: sub }; matchedLen = l; break; }
        // try get
        // eslint-disable-next-line no-await-in-loop
        const v = await new Promise((res, rej) => { const r = store.get(sub); r.onsuccess=()=>res(r.result ? r.result.v : null); r.onerror=()=>rej(r.error); });
        if (v) { matched = { kana: v, surface: sub }; matchedLen = l; break; }
      }
      if (matched) {
        parts.push(matched.kana);
        i += matchedLen;
      } else {
        const ch = s[i];
        // Keep kana as-is (to be romanized), otherwise emit char
        parts.push(ch);
        i += 1;
      }
    }
    // Merge into romaji
    const kanaJoined = parts.join('');
    return kanaToRomaji(kanaJoined);
  }

  async function tokenizeJAKanaOrMap(text, maxLen = 8) {
    const db = await openDB();
    const store = tx(db, STORES.JA, 'readonly');
    const s = String(text || '');
    const tokens = [];
    let i = 0;
    while (i < s.length) {
      let matchedTok = null; let matchedLen = 0;
      const limit = Math.min(maxLen, s.length - i);
      for (let l = limit; l >= 1; l--) {
        const sub = s.substr(i, l);
        if (/^[\s]+$/.test(sub)) { matchedTok = { kind: 'space', text: sub }; matchedLen = l; break; }
        if (/^[、。・.,!?;:！？（）()\[\]「」『』-]+$/.test(sub)) { matchedTok = { kind: 'punct', text: sub }; matchedLen = l; break; }
        // eslint-disable-next-line no-await-in-loop
        const v = await new Promise((res, rej) => { const r = store.get(sub); r.onsuccess=()=>res(r.result ? r.result.v : null); r.onerror=()=>rej(r.error); });
        if (v) { matchedTok = { kind: 'word', surface: sub, kana: v }; matchedLen = l; break; }
      }
      if (matchedTok) {
        tokens.push(matchedTok);
        i += matchedLen;
      } else {
        const ch = s[i];
        if (isKana(ch)) {
          // Aggregate consecutive kana as a single run
          let j = i;
          let buf = '';
          while (j < s.length && isKana(s[j])) { buf += s[j]; j++; }
          tokens.push({ kind: 'kana', text: buf });
          i = j;
        } else {
          tokens.push({ kind: 'other', text: ch });
          i += 1;
        }
      }
    }
    return tokens;
  }

  function segmentKatakanaRun(run) {
    const vowels = new Set(['ア','イ','ウ','エ','オ','ヴ']);
    const smalls = new Set(['ァ','ィ','ゥ','ェ','ォ','ャ','ュ','ョ']);
    const segments = [];
    let cur = '';
    for (let i=0;i<run.length;i++){
      const ch = run[i];
      const prev = i>0 ? run[i-1] : '';
      if (ch === '・') { if (cur) segments.push(cur), cur=''; continue; }
      const breakHere = (i>0 && vowels.has(ch) && !smalls.has(prev) && prev !== '・' && prev !== 'ッ');
      if (breakHere && cur) { segments.push(cur); cur=''; }
      cur += ch;
    }
    if (cur) segments.push(cur);
    return segments;
  }

  async function readingForJapaneseTokens(text) {
    const toks = await tokenizeJAKanaOrMap(text);
    const buf = [];
    const pushWord = (s) => { if (!s) return; buf.push(s, ' '); };
    for (const t of toks) {
      if (t.kind === 'space') { buf.push(' '); continue; }
      if (t.kind === 'punct') { buf.push(t.text); continue; }
      if (t.kind === 'word') { pushWord(kanaToRomaji(t.kana)); continue; }
      if (t.kind === 'kana') {
        const run = t.text;
        if ([...run].every(isKatakana)) {
          const segs = segmentKatakanaRun(run);
          for (const seg of segs) pushWord(kanaToRomaji(seg));
        } else {
          pushWord(kanaToRomaji(run));
        }
        continue;
      }
      buf.push(t.text);
    }
    // Normalize spaces: collapse, remove leading/trailing, and remove spaces before punctuation
    let joined = buf.join('');
    joined = joined.replace(/\s+/g, ' ')
                   .replace(/\s+([、。.,!?;:！？）」』)\]])/g, '$1')
                   .replace(/^\s+|\s+$/g, '');
    if (!joined) return [];
    return joined.split(/\s+/);
  }

  async function readingForEnglish(text) {
    const words = String(text || '').match(/[A-Za-z]+/g);
    if (!words || !words.length) return '';
    const out = [];
    for (const w of words) {
      // eslint-disable-next-line no-await-in-loop
      const ipaRaw = await getIPA(w);
      const chosen = pickIpaVariant(ipaRaw, w);
      out.push(chosen || w);
    }
    return out.join(' ');
  }

  async function readingForJapanese(text) {
    const s = String(text || '');
    const hasKanji = [...s].some(isKanji);
    const hasKana = [...s].some(isKana);
    if (hasKana && !hasKanji) return kanaToRomaji(s);
    // Try longest-match via JMdict store
    return lookupJAkanjiLongest(s);
  }

  async function buildReading(text) {
    const s = String(text || '');
    if (/[A-Za-z]/.test(s) && !(/[\u3040-\u30FF\u4E00-\u9FFF]/.test(s))) {
      return readingForEnglish(s);
    }
    if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(s)) {
      return readingForJapanese(s);
    }
    return '';
  }

  async function buildReadingTokens(text) {
    const s = String(text || '');
    if (/[A-Za-z]/.test(s) && !(/[\u3040-\u30FF\u4E00-\u9FFF]/.test(s))) {
      const ipa = await readingForEnglish(s);
      return ipa ? ipa.split(/\s+/) : [];
    }
    if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(s)) {
      return readingForJapaneseTokens(s);
    }
    return [];
  }

  const API = {
    openDB,
    clearIPA: () => clearStore(STORES.IPA),
    clearJA: () => clearStore(STORES.JA),
    countIPA: () => countStore(STORES.IPA),
    countJA: () => countStore(STORES.JA),
    importIPAFromText,
    importJMdictFromText,
    getIPA,
    readingForEnglish,
    readingForJapanese,
    buildReading,
    buildReadingTokens,
    _kanaToRomaji: kanaToRomaji
  };

  const g = (typeof window !== 'undefined') ? window : (typeof self !== 'undefined' ? self : globalThis);
  g.OfflineDB = API;
})();
