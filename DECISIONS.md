# Keputusan

## 1. Urutan alur: foto jadi langkah pertama (diminta pemilik)
Alur peneliti: profil → area → foto → pertanyaan → rekomendasi. Alur kami: **foto + area** → profil → prioritas → pertanyaan → rekomendasi.
Area dipilih di langkah foto karena pembacaan foto hanya ada untuk kamar mandi dan harus tahu areanya.

## 2. Foto opsional, bukan wajib
Situs peneliti mewajibkan 1–6 foto. Di sini foto bisa dilewati ("Lewati, isi sendiri"). Alasan: foto tanpa pembacaan tidak menambah apa pun, dan caregiver sering lelah. Untuk area selain kamar mandi, foto hanya referensi visual.

## 3. Pembacaan foto hanya untuk kamar mandi
Pemilik meminta semua area dibangun, tetapi hanya kamar mandi yang bisa dipindai. Area lain menampilkan disclaimer. `area.json` punya `bisa_dipindai` per area.

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

## Belum diverifikasi
- Baru dua foto kamar mandi yang diuji dengan Gemini sungguhan (foto demo dan foto shower hujan hitam).
- Belum diuji dengan beberapa foto sekaligus (2–6), dan belum diuji di Vercel (hanya lokal).
- Aturan foto per pertanyaan (butir 6) belum ditinjau peneliti.
- Tinggi sink, ruang manuver, dan transfer memang tidak terbaca dari foto; sengaja dibiarkan pengguna menjawab.
