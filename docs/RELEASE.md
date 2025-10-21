# Release Guide

1. Bump version in `manifest.json`.
2. Update `docs/CHANGELOG.md` and `README.md` (Changelog section) with highlights.
3. Rebuild package: `./build.sh` → produces `quick-translate-vi.xpi`.
4. Manual test on Zen/Firefox:
   - Gemini translation with short JP/EN text
   - DeepL fallback (simulate by removing Gemini key)
   - Offline readings: import small IPA and JMdict, verify readings appear when API lacks them
   - Tokenized romaji has spaces and line breaks
5. Tag the release in VCS and attach the `.xpi`.

