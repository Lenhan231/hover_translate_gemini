# Supported Import Formats

## English IPA

- TSV: `word\t/ipa/` (single variant) or `word\t/ipa1/, /ipa2/`
- JSON Lines (NDJSON): `{"w":"word","ipa":"/ipa/[, /variants/]"}`

Notes:
- For function words (for, to, of, a, the, …) the extension prefers unstressed schwa variants.
- Only lowercase matching is used; entries should be lowercase.
 - Sample file: `data/en_US.txt`

## JMdict Mini (Japanese)

- Full JMdict-like entry:
```
{
  "kanji": [{"text": "現代"}],
  "kana": [{"text": "げんだい", "appliesToKanji": ["*"]}]
}
```

- Minimal entry:
```
{"k":["現代"], "r":["げんだい"]}
```

- Top-level container:
  - JSON array `[ {...}, {...} ]` or
  - NDJSON (one JSON object per line) or
  - Object with `words: [ ... ]` (as seen in some packaged dumps)
  - Sample file: `data/jmdict-eng-3.6.1.json`

Rules:
- Each kanji form maps to the preferred kana. If multiple kana exist, hiragana/common readings are preferred.
- If no kanji provided, the kana maps to itself (useful for kana-only longest-match).
