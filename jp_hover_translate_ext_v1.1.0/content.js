
// content.js — Select text, then press Alt to translate (JP → VI/EN).

let overlay, overlayText, savedBtn, providerBadge;
const DEFAULTS = { targetLang: 'VI', provider: 'gemini' };
const MAX_LEN_FALLBACK = 800;

function ensureOverlay() {
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.id = 'jp-hover-translate-overlay';
  overlay.innerHTML = `
    <div class="jht-row">
      <span id="jht-provider" class="jht-badge"></span>
    </div>
    <div id="jht-text"></div>
    <div class="jht-actions">
      <button id="jht-save">+ Save</button>
    </div>
  `;
  document.documentElement.appendChild(overlay);
  overlayText = overlay.querySelector('#jht-text');
  savedBtn = overlay.querySelector('#jht-save');
  providerBadge = overlay.querySelector('#jht-provider');

  savedBtn.addEventListener('click', async () => {
    const src = overlayText?.dataset?.source || '';
    const trans = overlayText?.textContent || '';
    if (!src) return;
    const entry = { word: src, translation: trans, ts: Date.now() };
    const store = await chrome.storage.local.get({ savedWords: [] });
    store.savedWords.unshift(entry);
    await chrome.storage.local.set({ savedWords: store.savedWords.slice(0, 1000) });
    savedBtn.textContent = '✓ Saved';
    setTimeout(() => savedBtn.textContent = '+ Save', 1200);
  });
}

function placeOverlayAtSelection() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return { x: 0, y: 0 };
  const range = sel.getRangeAt(0).cloneRange();
  let rect = range.getBoundingClientRect();
  if (!rect || (rect.x===0 && rect.y===0 && rect.width===0 && rect.height===0)) {
    // fallback: create a temporary span
    const span = document.createElement('span');
    span.appendChild(document.createTextNode('\u200b'));
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

async function doTranslate(text) {
  ensureOverlay();
  overlayText.textContent = 'Translating…';
  overlayText.dataset.source = text;
  providerBadge.textContent = '';
  placeOverlayAtSelection();

  const cfg = await chrome.storage.sync.get(DEFAULTS);
  providerBadge.textContent = cfg.provider === 'deepl' ? 'DeepL' : 'Gemini';

  chrome.runtime.sendMessage({ type: 'TRANSLATE_TEXT', text }, (resp) => {
    if (!resp?.ok) {
      overlayText.textContent = `Error: ${resp?.error || 'Unknown'}`;
      return;
    }
    overlayText.textContent = resp.translation;
  });
}

function getSelectedText() {
  const sel = window.getSelection();
  if (!sel) return '';
  const text = sel.toString().trim();
  return text.slice(0, MAX_LEN_FALLBACK);
}

// Key handler: when Alt is pressed, translate current selection
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
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay) overlay.style.display = 'none';
});
