# Contributing

Thanks for contributing! Please follow these guidelines:

- Keep changes focused; avoid unrelated refactors
- Match existing code style (vanilla JS, minimal deps)
- For features impacting UX, update docs and README
- For releases, follow `docs/RELEASE.md`

Dev workflow:
- Load temporary add-on from `about:debugging` while iterating
- Use `./build.sh` to package a fresh `.xpi`
- Check background console logs for API errors and reading builders

