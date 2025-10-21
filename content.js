
// content.js — Select text + Alt to translate any language to Vietnamese. v2.0.0

let overlay, overlayText, savedBtn, readingRow, providerBadge;
const DEFAULTS = { targetLang: 'VI' };
const MAX_LEN_FALLBACK = 120;

// Cross-browser API compatibility
const api = (typeof browser !== 'undefined') ? browser : chrome;

// Soft selection style
(function injectSelectionStyle() {
  const st = document.createElement('style');
  st.textContent = `::selection { background: #fff3b0; color: #111; }`;
  document.documentElement.appendChild(st);
})();

function ensureOverlay() {
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.id = 'jp-hover-translate-overlay';
  overlay.innerHTML = `
    <div class="jht-row">
      <span class="jht-badge">Gemini AI</span>
      <button id="jht-close" title="Close">✕</button>
    </div>
    <div id="jht-text" class="jht-translation"></div>
    <div id="jht-reading" class="jht-reading"></div>
    <div class="jht-actions">
      <button id="jht-save">💾 Save Word</button>
    </div>
  `;
  document.documentElement.appendChild(overlay);
  overlayText = overlay.querySelector('#jht-text');
  readingRow = overlay.querySelector('#jht-reading');
  savedBtn = overlay.querySelector('#jht-save');
  providerBadge = overlay.querySelector('.jht-badge');
  const closeBtn = overlay.querySelector('#jht-close');

  savedBtn.addEventListener('click', async () => {
    const src = overlayText?.dataset?.source || '';
    const trans = overlayText?.textContent || '';
    if (!src) return;
    try {
      const entry = { word: src, translation: trans, ts: Date.now() };
      const store = await api.storage.local.get({ savedWords: [] });
      store.savedWords.unshift(entry);
      await api.storage.local.set({ savedWords: store.savedWords.slice(0, 1000) });
      savedBtn.textContent = '✅ Saved!';
      savedBtn.style.background = '#10b981';
      savedBtn.style.color = 'white';
      setTimeout(() => {
        savedBtn.textContent = '💾 Save Word';
        savedBtn.style.background = '';
        savedBtn.style.color = '';
      }, 1500);
    } catch (err) {
      console.error('Save word error:', err);
      savedBtn.textContent = '❌ Error';
      setTimeout(() => {
        savedBtn.textContent = '💾 Save Word';
      }, 1500);
    }
  });

  closeBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
  });
}

function placeOverlayAtSelection() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0).cloneRange();
  let rect = range.getBoundingClientRect();
  if (!rect || (rect.x === 0 && rect.y === 0 && rect.width === 0 && rect.height === 0)) {
    const span = document.createElement('span');
    span.appendChild(document.createTextNode('\\u200b'));
    range.insertNode(span);
    rect = span.getBoundingClientRect();
    span.parentNode && span.parentNode.removeChild(span);
  }
  const x = window.scrollX + rect.left;
  const y = window.scrollY + rect.bottom;
  overlay.style.left = (x + 8) + 'px';
  overlay.style.top = (y + 8) + 'px';
  overlay.style.display = 'block';
}

function renderText(s) {
  // Strip markdown fences if any
  return (s || '').replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
}

async function doTranslate(text) {
  ensureOverlay();
  const startTime = Date.now();
  overlayText.textContent = '⏳ Translating…';
  overlayText.style.opacity = '0.6';
  readingRow.textContent = '';
  overlayText.dataset.source = text;
  placeOverlayAtSelection();

  api.runtime.sendMessage({ type: 'TRANSLATE_TEXT', text }, (resp) => {
    const elapsed = Date.now() - startTime;
    console.log(`Translation took ${elapsed}ms`);
    
    overlayText.style.opacity = '1';
    
    if (!resp?.ok) {
      overlayText.textContent = `❌ ${resp?.error || 'Unknown error'}`;
      return;
    }
    // Dynamic provider label
    try {
      const src = resp.source || 'gemini';
      providerBadge.textContent = src === 'deepl' ? 'DeepL' : 'Gemini AI';
    } catch (_) {}

    overlayText.textContent = renderText(resp.translation || '');
    let reading = resp.reading || '';

    // If backend provided tokens (space-separated), keep spacing; otherwise fallback
    if (!reading) {
      const srcText = (overlayText?.dataset?.source || '').trim();
      if (isKanaOnly(srcText)) reading = kanaToRomaji(srcText);
    }

    readingRow.textContent = reading ? `/${reading}/` : '';
  });
}

function getSelectedText() {
  const sel = window.getSelection();
  if (!sel) return '';
  const text = sel.toString().trim();
  return text.slice(0, MAX_LEN_FALLBACK);
}

// Alt to translate
let altPressed = false;

// Alt key handler for quick translate on web pages
const handleAltKey = (e) => {
  if (e.key === 'Alt' && !altPressed) {
    altPressed = true;
    const t = getSelectedText();
    if (t) {
      console.log('Alt pressed, translating:', t);
      doTranslate(t);
    }
  }
};

const handleAltRelease = (e) => {
  if (e.key === 'Alt') altPressed = false;
};

// Simple listeners (no PDF viewer special cases)
document.addEventListener('keydown', handleAltKey, true);
document.addEventListener('keyup', handleAltRelease, true);

// Listen for context menu translation
api.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'TRANSLATE_FROM_CONTEXT' && msg.text) {
    console.log('Context menu translation:', msg.text);
    doTranslate(msg.text);
  }
});

// Hide overlay on click elsewhere or Esc
document.addEventListener('mousedown', (e) => {
  if (overlay && !overlay.contains(e.target)) overlay.style.display = 'none';
}, { capture: true });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay) overlay.style.display = 'none'; });

// --- Lightweight kana→romaji converter for fallback (no kanji support) ---
const KANA_SMALL_TSU = /[\u3063\u30c3]/g; // っ, ッ
const CHOONPU = /\u30fc/g; // ー

function isKanaOnly(s) {
  if (!s) return false;
  // Allow spaces and punctuation while requiring at least one kana
  let hasKana = false;
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    const isHira = code >= 0x3040 && code <= 0x309F;
    const isKata = code >= 0x30A0 && code <= 0x30FF;
    const isAllowed = isHira || isKata || /[\s、。・.,!?"'()\[\]-]/.test(ch);
    if (!isAllowed) return false;
    if (isHira || isKata) hasKana = true;
  }
  return hasKana;
}

function kanaToRomaji(input) {
  if (!input) return '';
  // Basic Hepburn-like mapping; handles digraphs and prolonged sound mark
  const map = {
    ぁ:'a', あ:'a', ぃ:'i', い:'i', ぅ:'u', う:'u', ぇ:'e', え:'e', ぉ:'o', お:'o', ゃ:'ya', や:'ya', ゅ:'yu', ゆ:'yu', ょ:'yo', よ:'yo', ゎ:'wa', わ:'wa', を:'o', ん:'n',
    か:'ka', き:'ki', く:'ku', け:'ke', こ:'ko', が:'ga', ぎ:'gi', ぐ:'gu', げ:'ge', ご:'go',
    さ:'sa', し:'shi', す:'su', せ:'se', そ:'so', ざ:'za', じ:'ji', ず:'zu', ぜ:'ze', ぞ:'zo',
    た:'ta', ち:'chi', つ:'tsu', て:'te', と:'to', だ:'da', ぢ:'ji', づ:'zu', で:'de', ど:'do',
    な:'na', に:'ni', ぬ:'nu', ね:'ne', の:'no',
    は:'ha', ひ:'hi', ふ:'fu', へ:'he', ほ:'ho', ば:'ba', び:'bi', ぶ:'bu', べ:'be', ぼ:'bo', ぱ:'pa', ぴ:'pi', ぷ:'pu', ぺ:'pe', ぽ:'po',
    ま:'ma', み:'mi', む:'mu', め:'me', も:'mo',
    ら:'ra', り:'ri', る:'ru', れ:'re', ろ:'ro',
    きゃ:'kya', きゅ:'kyu', きょ:'kyo', ぎゃ:'gya', ぎゅ:'gyu', ぎょ:'gyo',
    しゃ:'sha', しゅ:'shu', しょ:'sho', じゃ:'ja', じゅ:'ju', じょ:'jo',
    ちゃ:'cha', ちゅ:'chu', ちょ:'cho', にゃ:'nya', にゅ:'nyu', にょ:'nyo',
    ひゃ:'hya', ひゅ:'hyu', ひょ:'hyo', びゃ:'bya', びゅ:'byu', びょ:'byo', ぴゃ:'pya', ぴゅ:'pyu', ぴょ:'pyo',
    みゃ:'mya', みゅ:'myu', みょ:'myo', りゃ:'rya', りゅ:'ryu', りょ:'ryo',
    ゔ:'vu',
    // Katakana basic
    ァ:'a', ア:'a', ィ:'i', イ:'i', ゥ:'u', ウ:'u', ェ:'e', エ:'e', ォ:'o', オ:'o', ャ:'ya', ヤ:'ya', ュ:'yu', ユ:'yu', ョ:'yo', ヨ:'yo', ヮ:'wa', ワ:'wa', ヲ:'o', ン:'n',
    カ:'ka', キ:'ki', ク:'ku', ケ:'ke', コ:'ko', ガ:'ga', ギ:'gi', グ:'gu', ゲ:'ge', ゴ:'go',
    サ:'sa', シ:'shi', ス:'su', セ:'se', ソ:'so', ザ:'za', ジ:'ji', ズ:'zu', ゼ:'ze', ゾ:'zo',
    タ:'ta', チ:'chi', ツ:'tsu', テ:'te', ト:'to', ダ:'da', ヂ:'ji', ヅ:'zu', デ:'de', ド:'do',
    ナ:'na', ニ:'ni', ヌ:'nu', ネ:'ne', ノ:'no',
    ハ:'ha', ヒ:'hi', フ:'fu', ヘ:'he', ホ:'ho', バ:'ba', ビ:'bi', ブ:'bu', ベ:'be', ボ:'bo', パ:'pa', ピ:'pi', プ:'pu', ペ:'pe', ポ:'po',
    マ:'ma', ミ:'mi', ム:'mu', メ:'me', モ:'mo',
    ラ:'ra', リ:'ri', ル:'ru', レ:'re', ロ:'ro',
    キャ:'kya', キュ:'kyu', キョ:'kyo', ギャ:'gya', ギュ:'gyu', ギョ:'gyo',
    シャ:'sha', シュ:'shu', ショ:'sho', ジャ:'ja', ジュ:'ju', ジョ:'jo',
    チャ:'cha', チュ:'chu', チョ:'cho', ニャ:'nya', ニュ:'nyu', ニョ:'nyo',
    ヒャ:'hya', ヒュ:'hyu', ヒョ:'hyo', ビャ:'bya', ビュ:'byu', ビョ:'byo', ピャ:'pya', ピュ:'pyu', ピョ:'pyo',
    ミャ:'mya', ミュ:'myu', ミョ:'myo', リャ:'rya', リュ:'ryu', リョ:'ryo',
    ヴ:'vu'
  };

  // Handle small tsu (促音) by doubling next consonant
  function handleSokuon(s) {
    return s.replace(KANA_SMALL_TSU, function (_, idx) {
      // doubling handled in main loop; placeholder kept
      return '\u0001'; // marker
    });
  }

  // Compose digraphs first, then singles; apply sokuon and choonpu
  const src = handleSokuon(input);
  let out = '';
  let i = 0;
  while (i < src.length) {
    const two = src.slice(i, i + 2);
    const three = src.slice(i, i + 3);
    let roma = null;
    if (map[three]) { roma = map[three]; i += 3; }
    else if (map[two]) { roma = map[two]; i += 2; }
    else {
      const ch = src[i];
      if (ch === '\u0001') {
        // double next consonant if any
        const nextTwo = src.slice(i + 1, i + 3);
        const nextOne = src[i + 1];
        let nextRoma = map[nextTwo] || map[nextOne] || '';
        if (nextRoma) {
          const c = nextRoma[0];
          if (/[bcdfghjklmnpqrstvwxyz]/.test(c)) out += c;
        }
        i += 1;
        continue;
      }
      if (CHOONPU.test(ch)) {
        // prolong last vowel
        const m = out.match(/[aeiou]$/);
        if (m) out += m[0];
        i += 1;
        continue;
      }
      roma = map[ch] || ch;
      i += 1;
    }
    out += roma || '';
  }
  return out.replace(/nn(?=[bmp])/g, 'm');
}
