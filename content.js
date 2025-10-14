
// content.js — Select text + Alt to translate (JP → VI/EN). v1.4.0

let overlay, overlayText, savedBtn, providerBadge, readingRow;
const DEFAULTS = { targetLang: 'VI', provider: 'gemini' };
const MAX_LEN_FALLBACK = 800;

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
      <span id="jht-provider" class="jht-badge"></span>
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
  providerBadge = overlay.querySelector('#jht-provider');
  const closeBtn = overlay.querySelector('#jht-close');

  savedBtn.addEventListener('click', async () => {
    const src = overlayText?.dataset?.source || '';
    const trans = overlayText?.textContent || '';
    if (!src) return;
    const entry = { word: src, translation: trans, ts: Date.now() };
    const store = await chrome.storage.local.get({ savedWords: [] });
    store.savedWords.unshift(entry);
    await chrome.storage.local.set({ savedWords: store.savedWords.slice(0, 1000) });
    savedBtn.textContent = '✅ Saved!';
    savedBtn.style.background = '#10b981';
    savedBtn.style.color = 'white';
    setTimeout(() => {
      savedBtn.textContent = '💾 Save Word';
      savedBtn.style.background = '';
      savedBtn.style.color = '';
    }, 1500);
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
  providerBadge.textContent = '';
  placeOverlayAtSelection();

  const cfg = await chrome.storage.sync.get(DEFAULTS);
  providerBadge.textContent = cfg.provider === 'deepl' ? 'DeepL' : 'Gemini';

  chrome.runtime.sendMessage({ type: 'TRANSLATE_TEXT', text }, (resp) => {
    const elapsed = Date.now() - startTime;
    console.log(`Translation took ${elapsed}ms`);
    
    overlayText.style.opacity = '1';
    
    if (!resp?.ok) {
      overlayText.textContent = `❌ ${resp?.error || 'Unknown error'}`;
      return;
    }
    overlayText.textContent = renderText(resp.translation || '');
    readingRow.textContent = resp.reading ? `/${resp.reading}/` : '';
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
document.addEventListener('keydown', (e) => {
  if (e.key === 'Alt' && !altPressed) {
    altPressed = true;
    const t = getSelectedText();
    if (t) doTranslate(t);
  }
});
document.addEventListener('keyup', (e) => { if (e.key === 'Alt') altPressed = false; });

// Hide overlay on click elsewhere or Esc
document.addEventListener('mousedown', (e) => {
  if (overlay && !overlay.contains(e.target)) overlay.style.display = 'none';
}, { capture: true });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay) overlay.style.display = 'none'; });
