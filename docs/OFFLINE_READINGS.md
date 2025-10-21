# Offline Readings (IPA + Romaji)

This extension can add readings offline to reduce latency and avoid quota limits.

- English: IPA transcription per word (from a user-imported dictionary)
- Japanese: Romaji from kana or via JMdict mini for kanji → kana → romaji

## How It Works

- Storage: IndexedDB database `qt_offline_db` with 2 stores:
  - `ipa`: `{ w: wordLowercase, v: "/ipa/[, /variants/]" }`
  - `ja`: `{ k: kanjiOrKana, v: kanaReading }`
- At runtime, when the API returns no `reading`, background builds one:
  - English: looks up each token in `ipa` and picks one variant
  - Japanese: greedy longest-match using `ja`; romanizes kana; tokenizes Katakana runs
  - Output is tokenized and line-broken by sentence punctuation

## Import Data

Open Options → Offline Readings

- Import English IPA (TSV or JSON lines)
  - TSV: `word\t/ipa/`
  - JSON lines: `{ "w": "example", "ipa": "/ɪɡˈzɑːmpɫ/" }`
- Import JMdict mini (JSON / NDJSON)
  - Full JMdict-like entries supported:
    ```json
    {
      "kanji": [{"text": "現代"}],
      "kana": [{"text": "げんだい", "appliesToKanji": ["*"]}]
    }
    ```
  - Minimal format also supported:
    ```json
    {"k":["現代"], "r":["げんだい"]}
    ```

## Heuristics & Priorities

- When JMdict has conflicting readings for the same kanji key:
  - Prefer hiragana over katakana; prefer kana with `common: true`
- Katakana runs are segmented at boundaries (e.g., vowels, ・) to reduce long glued romaji
- English function words (for, to, of, a, the, …) prefer unstressed schwa variants

## Performance Notes

- Import is done in a single transaction; large files may take time
- Progress is currently modal at the end (entry count). For very large files, consider splitting and importing in batches

## Clear / Counts

- Options shows count of entries; Clear buttons wipe each store independently

