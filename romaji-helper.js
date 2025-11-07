// romaji-helper.js - Smart romaji conversion with auxiliary verb handling
import { toRomaji, isKana } from 'wanakana';

// Auxiliary verb patterns to normalize (gom phụ trợ vào động từ)
const AUX_PATTERNS = [
    /し\s*すぎ/g,        // 〜しすぎ
    /て\s*しまう/g,      // 〜てしまう → ちゃう
    /て\s*いる/g,        // 〜ている
    /て\s*いく/g,        // 〜ていく
    /て\s*くる/g,        // 〜てくる
    /で\s*は\s*ない/g,   // ではない → じゃない
    /ちゃ\s*う/g,        // ちゃう
    /じゃ\s*ない/g       // じゃない
];

function normalizeAux(str) {
    let s = str;
    // Remove spaces in auxiliary patterns
    for (const r of AUX_PATTERNS) {
        s = s.replace(r, m => m.replace(/\s+/g, ''));
    }
    // Common contractions
    s = s.replace(/ではない/g, 'じゃない');
    s = s.replace(/てしまう/g, 'ちゃう');
    return s;
}

export function smartRomaji(input) {
    if (!input) return '';

    // Split by spaces, kanji, and punctuation
    const tokens = input.split(/(\s+|[、。？！?!])/).filter(Boolean);

    const out = tokens.map(tok => {
        // Keep non-kana as-is (kanji, punctuation, etc)
        if (!isKana(tok)) return tok;

        // Normalize auxiliaries before conversion
        const normalized = normalizeAux(tok);

        // Convert to romaji
        return toRomaji(normalized, { upcaseKatakana: false });
    });

    // Join and add minimal spacing
    return out.join('').replace(/([a-z])(?=[一-龯ぁ-んァ-ン])/g, '$1 ').trim();
}
