# DeepL Fallback

When Gemini returns an error (e.g., 429 quota), the extension can fallback to DeepL if configured.

## Configure

- Options → DeepL API Key (optional): paste your key
- Options → DeepL Endpoint: Free (api-free.deepl.com) or Pro (api.deepl.com)

## Behavior

- Pipeline: Gemini → DeepL (fallback)
- Reading:
  - DeepL does not return romaji/IPA. The extension will build reading offline (IPA or romaji) if data is imported.
- Timeout: ~6 seconds (configurable in code: background.js)

## Permissions

- Host permissions are declared in manifest for both Free and Pro endpoints.

