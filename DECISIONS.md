# Keputusan

## 1. Urutan alur: foto jadi langkah pertama (diminta pemilik)
Alur peneliti: profil → area → foto → pertanyaan → rekomendasi. Alur kami: **foto + area** → profil → prioritas → pertanyaan → rekomendasi.
Area dipilih di langkah foto karena pembacaan foto hanya ada untuk kamar mandi dan harus tahu areanya.

## 2. Foto opsional, bukan wajib
Situs peneliti mewajibkan 1–6 foto. Di sini foto bisa dilewati ("Lewati, isi sendiri"). Alasan: foto tanpa pembacaan tidak menambah apa pun, dan caregiver sering lelah. Untuk area selain kamar mandi, foto hanya referensi visual.

## 3. Pembacaan foto untuk semua area, hanya kamar mandi yang teruji
Awalnya hanya kamar mandi yang dibaca. Atas permintaan pemilik ("buat dulu saja, nanti kita uji belakangan") semua area kini dibaca AI. Prompt dan skema dibangun per area dari pertanyaannya (`susun()` di `server/analisis.ts`); permintaan membawa `area`.
`area.json`: `bisa_dipindai` (semua true) dan `foto_teruji` (hanya kamar mandi true). Area dengan `foto_teruji: false` menampilkan "Bisa dibaca AI (tahap uji)" dan disclaimer.
Aturan foto untuk mobilitas, dapur, dan kamar tidur (28 pertanyaan) sangat konservatif dan **belum diuji dengan foto asli sama sekali**: `bisa` hanya G-05, G-07, G-08, K-05, B-06, B-08 (visual atau berbasis jangkauan); `tidak` G-06, G-10, B-09 (butuh wawancara atau seluruh rute); sisanya `sebagian`. Aturan jangkauan untuk area lain adalah versi umum (belum teruji), kamar mandi tetap memakai teks lama.

## 4. Pilihan jawaban "Belum tahu" ditambahkan
Situs peneliti hanya Ya/Tidak. Sheet peneliti sendiri punya kategori D "Belum dapat dipastikan" dan aturan "jika bukti tidak memadai, jangan menyimpulkan tidak aksesibel". Kami menambahkan "Belum tahu" yang dipetakan ke kategori D (teks makna dan tindak lanjut diambil dari sheet).

## 5. Hasil: tiga status, tanpa B/C
Ya = sesuai, Tidak = "perlu penyesuaian", Belum tahu = D. Sheet mendefinisikan B dan C tetapi tidak menjelaskan cara memilih antara keduanya, jadi kami tidak membedakannya (tidak mengarang aturan).

## 6. Aturan foto per pertanyaan (ASUMSI, belum ditinjau peneliti)
`content/pindai.json`: M-01..M-06 `sebagian` (hanya "Tidak" yang boleh terisi dari foto), M-07..M-11 `bisa`, M-12 `tidak`.
M-06 (wastafel) sempat `bisa`; Gemini menjawab "Ya" dari foto padahal tinggi dan ruang pendekatan tidak bisa dipastikan, jadi dijadikan `sebagian`.
Dipaksa di tiga tempat: prompt, `bersihkan()` di server, dan `isiDariFoto()` di klien.

## 5b. Pelajaran dari Transisi yang dibawa
- Uji lewat jalur aplikasi (foto dikecilkan browser), bukan foto asli.
- Uji ulang semua foto setiap prompt berubah.
- Aturan prompt yang benar belum tentu dipatuhi model; penjagaan tambahan ada di kode.
- Gemini tidak diminta menebak posisi atau arah benda. Itu bagian paling rapuh di Pindai Transisi dan tidak dipakai di sini.

## 7. State di memori saja
Situs peneliti berjanji "Tanpa akun. Tanpa menyimpan data. Memuat ulang halaman menghapus semuanya." Kami mempertahankannya (tanpa localStorage). Konsekuensi: muat ulang menghapus jawaban dan foto. Teks privasi diubah agar jujur bahwa foto dikirim ke layanan AI hanya bila pengguna menekan "Baca foto dengan AI".

## 8. Konten rekomendasi disalin apa adanya dari sheet
Status `draf` pada semua pertanyaan; halaman hasil menampilkan lencana "Draf, belum ditinjau ahli". Angka yang sudah ditandai keliru di `riset/koreksi-untuk-tim-riset.md` (mis. diameter pegangan "32 - 51 cm" yang seharusnya mm, tinggi bibir wastafel, ukuran shower) **belum dikoreksi** di konten; menunggu keputusan pemilik dan tim peneliti.

## 9. Komentar internal sheet tidak disalin
Kolom catatan antar-peneliti di sheet "Asesmen Awal" tidak dimasukkan ke konten.

## 10. Pertanyaan profil memakai kata-kata situs live
Kata-kata pertanyaan profil mengikuti situs peneliti (lebih ringkas daripada sheet). Profil saat ini tidak mengubah hasil (sheet tidak mendefinisikan aturan yang memakainya); hanya dikumpulkan.
Aktivitas prioritas hanya ditampilkan di halaman hasil; sheet tidak memetakan pertanyaan ke aktivitas, jadi urutan hasil tidak dipengaruhi aktivitas.

## 11. Fungsi server memakai pola yang sama dengan Transisi
`server/analisis.ts` dibundel esbuild menjadi `api/analisis.mjs` (bundel mandiri, di-commit, diuji `tests/apiBundel.test.ts`). Batas: 6 foto, 900.000 karakter per foto, 4.000.000 total (batas badan Vercel 4,5 MB). Model utama `gemini-3.1-flash-lite` dengan cadangan, suhu 0.

## 12. Nama field di skema mempengaruhi hasil model
Saat menggeneralisasi, field `kamar_mandi` diganti `ruang_sesuai` (prompt lain tidak berubah). Hasil foto yang sama berubah dan stabil di dua kali uji (M-06 jadi "Tidak: wastafel tidak terlihat", M-08 jadi "Ya"), sedangkan versi live dengan nama lama tetap memberi hasil lama. Solusi: nama field per area (`FIELD_RUANG`), kamar mandi tetap `kamar_mandi`, server memetakan ke `ruang_sesuai`. Prompt kamar mandi diverifikasi identik byte per byte dengan versi teruji, dan hasil lama terkonfirmasi kembali.

## Belum diverifikasi
- Baru dua foto kamar mandi yang diuji dengan Gemini sungguhan (foto demo dan foto shower hujan hitam). Area lain: tidak ada satu pun foto uji.
- Belum diuji dengan beberapa foto sekaligus (2–6), dan belum diuji di Vercel (hanya lokal).
- Aturan foto per pertanyaan (butir 6) belum ditinjau peneliti.
- Tinggi sink, ruang manuver, dan transfer memang tidak terbaca dari foto; sengaja dibiarkan pengguna menjawab.

## 13. Rute dev `#/dev/hasil` dan foto contoh
`VITE_PINDAI_MOCK=true npm run dev` kini punya rute `#/dev/hasil` yang langsung membuka halaman hasil kamar mandi dengan foto contoh dan jawaban tiruan (`src/screens/DevHasil.tsx`). Rute hanya terpasang saat `import.meta.env.DEV` dan mock aktif; di build produksi kodenya terbuang (dicek: `dist` tidak memuat rute itu). Foto contoh dibaca dari `dev/mock-foto.jpg`, dikecilkan browser seperti jalur biasa. Folder `dev/` ada di `.gitignore`: foto itu buatan Dreamina AI dan masih berlogo, jadi tidak ikut repo publik. Dev lain harus menaruh foto sendiri di jalur itu.

## 14. Gambar "Ruang Anda" (tampak atas dan isometrik), disalin dari Transisi
**Dipindahkan dari Transisi:** penggambar isometrik SVG (`gambarShower`, `gambarBenda`, `dimensiGambar`, `objekUkuran`, `denahGeometri`, `tataLetak`, `proyeksiIso3D`, `PratinjauRuangIso3D`, `LapisPrimitif`) beserta tesnya. Tanpa Three.js. Tipe dan tata letak denah ada di `src/domain/denahPindai.ts`, terpisah dari `pindai.ts` supaya kontrak baca foto yang sudah teruji tidak tersentuh.
**Tidak dipindahkan:** `gambarAkses` (bak mandi, ember, bangku; itu skenario khusus Transisi) dan Three.js. Tes `proyeksiIso3D` yang membandingkan dengan kamera Three.js diganti tes sifat proyeksi.
**Tampak atas** ditulis ulang (`DenahTampakAtas.tsx`) dari bentuk benda di Transisi, tanpa lencana nomor dan status, karena di sini tidak ada status per benda.
**"Setelah penyesuaian"** hanya untuk area mandi: "Penyesuaian praktis" (mode `hack`: hand shower diturunkan ke jangkauan) dan "Modifikasi" (mode `permanen`). Dipetakan ke pertanyaan **M-07** karena isi Hack/Modifikasi M-07 di sheet (hand shower, holder rendah, pindah kontrol ke jangkauan) paling dekat dengan gambar itu. Ini asumsi tim produk, perlu ditinjau peneliti. Tombol hanya aktif bila M-07 dijawab "Tidak"; "Belum tahu" tidak digambar. Benda lain (grab bar, kursi mandi, pintu) belum punya gambar "setelah". Tampak atas hanya satu keadaan.
**Tabel ukuran** `content/ukuran-aksesibel.json` disalin dari Transisi (PerMen PUPR 14/2017 diutamakan, ADA 2010 pembanding). Dipakai hanya sebagai proporsi gambar; angka tidak pernah ditampilkan. Semua entri berstatus `draf`, dan catatan di tabel menyebut aturannya untuk toilet umum, bukan rumah tinggal. Sebagian ukuran (`DIMENSI_PERKIRAAN`: tinggi plafon, ukuran kloset, dan lain-lain) adalah perkiraan Transisi yang belum bersumber. Gambar diberi label "Ilustrasi skematik, bukan ukuran sebenarnya".
**Belum tampil untuk pengguna:** tata letak masih posisi bawaan (`POSISI_BAWAAN`), belum dibaca dari foto, jadi gambar bisa tidak cocok dengan ruang pengguna. Karena itu `RuangAnda` hanya muncul di mode pengembangan dengan foto tiruan (`import.meta.env.DEV` dan `VITE_PINDAI_MOCK`). Dibuka untuk umum setelah M3.
**Warna:** token `benda`, `dinding`, `lantai`, `utama.redup` ditambahkan di `tailwind.config.ts` (abu netral dari Transisi; `utama.redup` dipilih sendiri).
