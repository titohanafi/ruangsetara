# Published ChatGPT Site — version 2

Runnable source snapshot of https://ruang-setara-asesmen.tiaraparamita95.chatgpt.site/ (published 21 October 2026). Verified against Sites version 2 source commit `52f3767fb3b7c90e4b8caaf9c62d26650fcfb0c2` on 23 October 2026.

This reference is separate from the repository's React/Gemini application. It does not replace the root application or change Vercel deployment. The four files in `dist/` are unchanged from the published source.

## Run

With Node.js 20+ installed:

```sh
cd references/chatgpt-site
npm start
```

Open http://localhost:4173. No dependency installation or API key is needed. `npm run check` checks JavaScript syntax.

## Included

- Bahasa Indonesia profile → theme/activity → photos → questions → recommendations.
- Separate **Unggah foto dari perangkat** and **Ambil foto dengan kamera** buttons.
- 40 original PDF questions: mobility 10, kitchen 8, bedroom 10, bathroom 12.
- Per-question answer polarity: G-04/G-07 trigger on Ya; remaining questions trigger on Tidak.
- Practical adjustments, modifications, verification guidance, and source references.
- In-memory answers and photo previews; no photo uploads, database, or AI calls.
- Review/edit answers and print/save PDF through the browser.

## Integration notes

Treat this as a reference snapshot, not replacement content for `content/pertanyaan/`. The root project's research spreadsheet remains its source of truth. Its Gemini flow, content validation, and question corrections are independent of this earlier PDF-based version. Any migration should be reviewed separately.

AI room illustrations and generic downloadable visual references are not implemented. Priority activities are provisional. Recommendations reproduce the supplied PDF and have not been independently validated.

No participant photos, responses, credentials, or Sites hosting configuration are included.

## Validation

All four published source files match the clean local Git commit recorded by Sites version 2. The 40 question records and both button handlers were checked during import. Previous direct tests covered 44 recommendation-count scenarios. Re-running Node/browser checks during this import was blocked by the bundled Node runtime's macOS compatibility error; no new browser-test pass is claimed.
