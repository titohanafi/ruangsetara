# Ruang Setara

Asesmen aksesibilitas rumah untuk pengguna kursi roda. Foto kamar mandi dibaca AI untuk mengisi sebagian jawaban otomatis.

```
npm install
npm run dev                       # http://localhost:5173
VITE_PINDAI_MOCK=true npm run dev # baca foto tiruan, tanpa kunci API
npm test && npm run lint && npm run typecheck
npm run build
```

Isi pertanyaan berasal dari checklist peneliti (`riset/checklist-peneliti.xlsx`, tidak di-commit) lewat `python3 scripts/impor_xlsx.py`.
Aturan proyek ada di `CLAUDE.md`, keputusan di `DECISIONS.md`.

Deploy: Vercel. Isi `GEMINI_API_KEY` di Environment Variables. Fungsi server ada di `api/analisis.mjs` dan `api/denah.mjs` (hasil `npm run bundel:api`).
