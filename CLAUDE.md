# Ruang Setara

Asesmen aksesibilitas rumah untuk pengguna kursi roda dan caregiver. Alur: foto ruangan → profil → prioritas → pertanyaan → rekomendasi.
Foto kamar mandi dibaca AI (Gemini) untuk mengisi sebagian jawaban otomatis; pengguna selalu bisa mengubahnya.

Proyek ini menyatukan situs asesmen tim peneliti (isi pertanyaan dan rekomendasi) dengan fitur baca foto yang dikembangkan di proyek Transisi (`../transisi`).

## Sumber konten
- Isi pertanyaan, indikator, cara verifikasi, rekomendasi (Hack/Modifikasi), dan kategori hasil berasal dari **checklist peneliti**: `riset/checklist-peneliti.xlsx` (lokal, tidak di-commit).
- `python3 scripts/impor_xlsx.py` mengubahnya menjadi `content/pertanyaan/*.json` dan `content/hasil.json`. Jangan edit JSON itu dengan tangan; ubah sheet lalu impor ulang.
- `riset/koreksi-untuk-tim-riset.md` mencatat angka di sheet yang perlu dikoreksi peneliti. Semua kartu `status_validasi: "draf"`.

## Aturan konten (keras)
- **Jangan mengarang** ukuran, angka, rujukan, atau klaim medis. Bila tidak ada di sheet, isi `null` atau "menyusul" dan laporkan.
- Hasil asesmen bukan sertifikasi keselamatan. Nyeri, luka, dan protesis tidak dijawab; arahkan ke dokter rehabilitasi medik atau prostetis-ortotis.
- Semua teks antarmuka ada di `content/ui.json`, bukan di komponen.
- Bahasa Indonesia, sapaan "Anda", kalimat pendek. Pakai "penyandang disabilitas", "pengguna kursi roda", "caregiver". Hindari "cacat", "korban", "penderita", "kasihan".

## Aturan baca foto (keras)
- AI hanya mengisi bila jelas terlihat. Ragu = "tidak jelas" = dibiarkan kosong, bukan ditebak.
- `content/pindai.json` menentukan per pertanyaan: `bisa` (Ya/Tidak boleh terisi), `sebagian` (hanya Tidak), `tidak` (tidak ditanyakan ke AI). Itu asumsi tim produk, belum ditinjau peneliti.
- Jawaban dari foto selalu bertanda "Terisi dari foto" dan bisa diubah. Jawaban pengguna tidak pernah ditimpa pembacaan foto.
- Foto hanya dikirim ke Gemini setelah pengguna menekan "Baca foto dengan AI" di bawah teks persetujuan. Foto tidak disimpan.
- Setiap perubahan prompt (`server/analisis.ts`) wajib diuji ulang dengan semua foto uji lewat jalur aplikasi (foto dikecilkan browser), bukan foto asli.

## Aturan teknis
- Vite + React 18 + TypeScript (strict) + Tailwind + React Router (HashRouter) + Zod + Vitest.
- State hanya di memori (tanpa localStorage): jawaban dan foto hilang saat halaman dimuat ulang, sesuai janji privasi situs peneliti.
- Satu fungsi server: `server/analisis.ts` dibundel menjadi `api/analisis.mjs` (`npm run bundel:api`, bundel ikut di-commit). Kunci `GEMINI_API_KEY` hanya di server.
- Mobile-first (360px), area sentuh minimal 44x44px, WCAG 2.2 AA, ringan untuk kuota rendah (tanpa pustaka berat, font sistem).
- Token desain di `tailwind.config.ts`, mengikuti warna situs peneliti (hijau tua `#245C4C`, tinta `#183F37`).
- Logika murni di `src/domain/` dengan tes di `tests/`.

## Perintah
- `npm run dev`, `npm run build` (validasi konten + bundel API + typecheck + build), `npm test`, `npm run lint`, `npm run typecheck`, `npm run validasi`, `npm run format`, `npm run format:cek`
- `VITE_PINDAI_MOCK=true npm run dev`: baca foto memakai hasil tiruan, tanpa Gemini dan tanpa kunci.
- Uji sungguhan: salin `.env.example` menjadi `.env.local`, isi `GEMINI_API_KEY`, jalankan `npm run dev`.

## Cara bekerja
- Rencanakan dulu, kerjakan per milestone. Setelah tiap milestone: tes, lint, typecheck; commit dengan pesan jelas; berhenti dan ringkas.
- Jelaskan dalam bahasa Indonesia sederhana. Pemilik adalah desainer, bukan engineer.
- Keputusan yang tidak ada di dokumen ini: pilih opsi paling sederhana dan catat di `DECISIONS.md`.
- Di akhir tiap milestone, daftarkan hal yang diasumsikan atau tidak bisa diverifikasi.
