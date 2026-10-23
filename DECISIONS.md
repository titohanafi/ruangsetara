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

## 15. Tata letak kamar mandi dibaca dari foto (M3): fungsi server kedua
**Fungsi terpisah `server/denah.ts` (`api/denah.mjs`)**, bukan tambahan di `analisis.ts`. Alasan: prompt dan skema checklist kamar mandi sudah teruji dan dikunci (lihat butir 12). Dicek: `api/analisis.mjs` tidak berubah byte pun. Biayanya satu panggilan Gemini tambahan per pembacaan foto kamar mandi.
**Isi prompt** disalin dari fungsi pindai Transisi (dinding dan zona tiap benda, jenis shower, kloset, arah pintu) **tanpa bagian penilaian checklist** yang ada di Transisi. Karena nama field dan isi prompt memengaruhi hasil model, ini dianggap prompt baru dan diuji ulang (di bawah). Tidak ada ukuran dan angka yang diminta dari AI.
**Hanya foto pertama yang dibaca.** Beberapa foto dari sudut berbeda membuat penilaian "dinding mana" tidak konsisten. Dikirim bersamaan dengan pembacaan checklist, dari tombol "Baca foto dengan AI" yang sama (teks persetujuan tidak berubah). Foto itu kini dikirim ke Gemini dua kali dalam satu pembacaan.
**Kegagalan tidak mengganggu checklist:** bila pembacaan denah gagal atau foto bukan kamar mandi, "Ruang Anda" tidak ditampilkan, dan jawaban checklist tetap terisi seperti biasa. Hasil denah dibuang bila foto atau area berubah.
**Benda yang tidak terlihat tidak digambar.** Nilai asing atau hilang dari model menjadi "tidak jelas" atau "tidak terlihat". Jenis kloset "tidak jelas" tampil sebagai kotak putus-putus berlogo "?".
**"Setelah penyesuaian" hanya untuk hand shower yang digantung.** Jenis shower lain (tetap, ember-gayung, tidak jelas) hanya punya "Kondisi sekarang", dan layar menjelaskannya.
**Sudut pandang awal** dipilih yang menampilkan paling banyak benda (`sudutAwal`), seri jatuh ke "kanan"; pengguna bisa memutar dan menampilkan semua benda.
**Hasil uji** (lewat `sips`: sisi terpanjang 1024 px, JPEG 70, sebagai tiruan pengecilan browser; tiap foto 3 kali, `temperature` 0, model `gemini-3.1-flash-lite`):
- Foto Dreamina A (shower di dinding belakang, kloset kanan, wastafel kiri, pintu depan): identik 3 kali, sesuai penglihatan saya. Satu kali lagi dicoba lewat aplikasi sungguhan di browser (foto dikecilkan browser), hasil sama.
- Foto demo Transisi (kloset dan wastafel di dinding belakang, shower di dinding kanan): identik 3 kali, sama dengan hasil baik yang tercatat di Transisi.
- Foto Dreamina B: identik 3 kali, tetapi wastafel (yang tampak di dinding kanan) terbaca "belakang/kanan"; sudut ruang ambigu. Masih masuk akal, bukan salah jelas.
- Hanya tiga foto berbeda (foto demo Transisi sama dengan `kamar-mandi-memanjang1.jpg`). Foto Dreamina adalah gambar buatan AI, bukan kamar mandi sungguhan. Belum diuji dengan foto kamar mandi nyata yang beragam, foto dari sudut aneh, atau foto bukan kamar mandi.

## 16. Aturan baca foto diturunkan dari "Cara Verifikasi" di sheet (menggantikan butir 6 dan 6b)
**Pemicu:** foto Dreamina menjawab M-07 ("keran dan perlengkapan mandi mudah dioperasikan") **Ya** 5 dari 5 kali, padahal holder shower terpasang kira-kira setinggi bahu. Sheet menyebut cara verifikasi M-07 "ukur ketinggian dan jangkauan; uji pengoperasian; konfirmasi pengguna", tiga-tiganya tidak bisa dari foto, tetapi aturan kami `bisa`. Aturan lama itu tebakan tim produk, bukan dari sheet; prompt hanya memakai ID, pertanyaan, dan indikator dari sheet.
**Aturan baru (atas keputusan pemilik: "ikutin sheet"):** `scripts/aturan_foto.py` menulis `content/pindai.json` dari kolom Cara Verifikasi: ada **wawancara** = `tidak`; ada **ukur / uji / simulasi / konfirmasi / kekokohan** = `sebagian` (hanya "Tidak" yang boleh terisi dari foto); selain itu (observasi atau foto saja) = `bisa`. Klausa "bila diperlukan" atau "bila memungkinkan" tidak dihitung. `tests/aturanFoto.test.ts` menjaga berkas tetap sesuai sheet.
**Perubahan (11 pertanyaan):** kamar mandi M-07, M-08, M-10, M-11 `bisa` jadi `sebagian`. Area lain: G-06 `tidak` jadi `sebagian` (sheet: "telusuri rute pada denah atau foto; ukur titik tersempit", jadi foto memang disebut), K-08 `sebagian` jadi `tidak` (wawancara), G-07, G-08, K-05, B-06, B-08 `bisa` jadi `sebagian`. Kamar mandi kini hanya M-09 yang `bisa` ("observasi permukaan; periksa genangan"); G-05 juga tetap `bisa`.
**Uji ulang kamar mandi** (3 foto, 3 kali tiap foto, lewat pengecilan `sips` 1024 px/JPEG 70, model `gemini-3.1-flash-lite`): hasil identik di tiap foto dan **tidak ada "Ya" lagi pada M-07, M-08, M-10, M-11**. Sebelum: M-07 = Ya pada ketiga foto, M-08 = Ya pada foto demo Transisi.
  - Foto Dreamina A: M-07 kini "tidak jelas" (tadinya Ya), M-11 "tidak jelas" (tadinya Tidak).
  - Foto demo Transisi: M-07 kini **Tidak** (holder shower tinggi di dinding, sesuai harapan), M-08 "tidak jelas" (tadinya Ya).
  - **Efek samping:** M-02 dan M-03 pada foto Dreamina A berubah dari Tidak menjadi "tidak jelas" walau aturannya tidak diubah. Perubahan teks prompt menggeser jawaban lain, seperti yang sudah diperingatkan di `CLAUDE.md`. Lebih konservatif (dibiarkan kosong), tapi mengurangi hambatan yang terisi otomatis.
**Koreksi angka:** lewat jalur aplikasi sungguhan (foto dikecilkan browser, bukan `sips`), foto Dreamina A mengisi **7** dari 12 pertanyaan (M-02, M-03, M-05, M-06, M-08, M-10, M-11, semuanya "Tidak"), bukan 3 sampai 4 seperti uji `sips`. Pengecilan berbeda memberi jawaban berbeda, sesuai peringatan di `CLAUDE.md`: uji berikutnya harus lewat browser.
**Belum ditangani:** Gemini tidak menerapkan aturan tinggi pasang di prompt secara konsisten (holder setinggi bahu tetap dijawab Ya sebelum aturan diubah). Sekarang tertutup karena "Ya" tidak lagi bisa terisi, tetapi belum dijamin bahwa "Tidak" muncul bila memang tinggi. Prompt jangkauan belum diubah. Aturan area lain (mobilitas, dapur, kamar tidur) berubah mengikuti sheet tetapi **belum diuji** dengan foto.

## 17. "Setelah modifikasi": ilustrasi isometrik seluruh ruangan per jawaban Tidak (menggantikan butir 14 bagian "setelah")
**Keputusan pemilik:** tidak ada "Penyesuaian praktis" di gambar; hanya dua keadaan, **Kondisi sekarang** dan **Setelah modifikasi**. Pada "Setelah modifikasi", semua pertanyaan yang dijawab Tidak digambar sekaligus di satu ruangan isometrik, sesuai teks **Modifikasi** di sheet (hijau = ditambahkan atau diganti). "Belum tahu" dan "Ya" tidak digambar.
**Dikerjakan (M4a):** M-02 lingkaran ruang putar (garis putus-putus), M-03 area bebas di samping kloset (persegi putus-putus), M-04 kloset diganti kloset duduk berwarna hijau, M-05 pegangan di dinding belakang dan dinding samping terdekat kloset, M-07 hand shower di jangkauan (gambar yang sudah ada; hanya untuk hand shower yang digantung), M-08 lantai shower rata dengan saluran memanjang dan panah kemiringan, M-10 kursi lipat di dinding area shower (dipasang di sisi yang lebih jauh dari kloset).
**Lima sisanya (M-01, M-06, M-09, M-11, M-12) dikerjakan di butir 18.**
**Ukuran:** hanya untuk proporsi, dari tabel (`DIM.pegangan`, `DIM.ruangPutar`, `DIM.rollIn`, `DIM.akses`). Pegangan: bagian atasnya setinggi batas atas rentang tabel (91,5 cm), tepat di atas tutup tangki. Area shower: lebar bilik PerMen 90 cm, panjang roll-in ADA 152,5 cm (dijepit ke panjang dinding). **M-03 memakai ukuran ruang putar (152,5 cm), bukan "152,5 x 142" dari teks sheet**, karena angka 142 belum terverifikasi (`riset/koreksi-untuk-tim-riset.md`). Tidak ada angka yang ditampilkan.
**Aturan penempatan:** gambar mengikuti hasil baca foto. Bagian yang dipasang pada benda yang tidak terbaca di foto tidak digambar (disebut di layar); bagian pada benda yang disembunyikan (dinding tidak tergambar dari sudut itu) ikut disembunyikan sampai "Tampilkan semua benda". Pegangan samping hanya digambar bila dinding sampingnya tergambar.
**Batas yang diketahui:** pada tata letak sempit gambar bisa bertumpuk (pegangan samping melewati holder hand shower; lingkaran ruang putar sama lebarnya dengan ruangan). Kursi mandi bisa terlihat seperti meja kecil. Benda di dinding yang tidak digambar tampak melayang bila ditampilkan lewat "Tampilkan semua benda" (batas yang sama dengan Transisi).

## 18. M4b: lima modifikasi terakhir digambar (semua 12 pertanyaan kamar mandi kini punya gambar)
**M-01 pintu:** pintu diganti pintu berengsel yang membuka ke luar, berwarna hijau (lebar bersih dari tabel PerMen). Alternatif pintu geser di teks sheet tidak digambar (satu bentuk saja). Ruang bebas 152,5 cm antara pintu dan kloset tidak digambar. **M-12** juga memakai gambar pintu ini, karena teks Modifikasinya menyebut pintu ke luar.
**M-06 wastafel:** wastafel digambar ulang berwarna hijau (gambar wastafel memang sudah gantung tanpa kabinet, jadi yang berubah hanya warna) dan ditambah cermin di atasnya. Tepi bawah cermin 101,5 cm (batas ADA, angka yang dipakai teks Modifikasi), tepi atas 180 cm (batas pasang PerMen); sheet mencatat dua acuan itu berbeda tujuan dan perlu diputuskan peninjau. Ruang lutut dan keran tuas tidak punya bentuk tersendiri di gambar.
**M-09 lantai bertekstur:** goresan pendek tersebar di seluruh lantai (jarak 20 cm, bergeser tiap baris). Kemiringan ke saluran digambar di M-08.
**M-11 rak dan handuk:** satu rak di dinding area shower (di sisi seberang hand shower) dan satu batang handuk dengan handuk di dinding wastafel (di sisi yang lebih jauh dari kloset). Tinggi pasang di tengah rentang jangkauan tabel (38 sampai 122 cm). Tengah rentang itu pilihan saya untuk gambar, bukan angka dari sheet.
**M-12 tombol darurat:** pelat kecil dengan tombol di dinding samping tangki kloset (ke arah tengah ruangan) dan di dinding area shower, setinggi batas bawah rentang jangkauan (38 cm) supaya terjangkau juga dari lantai.
**Aturan penampilan:** sebuah pertanyaan dianggap tidak terbaca bila **semua** bendanya tidak terbaca (M-11 cukup salah satu dari area mandi dan wastafel; M-12 cukup salah satu dari kloset, area mandi, pintu). Gambar yang bendanya ada di dinding yang tidak tergambar dari sudut ini disebut di layar ("Tidak tampak dari sudut ini ...") dan muncul lewat memutar sudut atau "Tampilkan semua benda". Pintu di dinding depan hampir selalu begitu.
**Batas yang diketahui:** gambar pintu di dinding depan tumpang tindih dengan isi ruangan saat ditampilkan (batas yang sama dengan Transisi). Pada tata letak sempit beberapa gambar bertumpuk. Lantai bertekstur hanyalah simbol, bukan bentuk keramik sebenarnya.

## 19. Aturan foto diperketat lagi: "genangan" dan "langsung" tidak bisa dari foto (tidak ada lagi pertanyaan `bisa`)
**Pemicu:** pada foto contoh (`dev/mock-foto.jpg`, foto Dreamina A), M-09 ("lantai aman untuk kursi roda") terisi **Ya** di layar pemilik dengan alasan "tekstur kasar yang tidak licin", padahal lantai di foto tampak halus (ubin krem besar) dan prompt sendiri menyuruh lantai yang kelicinannya tidak bisa dinilai dijawab "tidak jelas". Di uji saya (jalur `sips`, 9 percobaan) M-09 selalu "tidak jelas", jadi "Ya" itu muncul pada jalur pengecilan lain atau model cadangan; sebabnya belum terbukti (jalur browser tidak bisa diuji saat itu karena ekstensi Chrome terputus).
**Akar masalah yang diperbaiki:** aturan turunan dari sheet (butir 16) menganggap "periksa genangan" bisa dari foto, padahal itu butuh melihat langsung, dan tidak konsisten dengan "periksa kekokohan" yang dianggap tidak bisa. Kata kunci `genangan` dan `langsung` kini ikut menandai "tidak bisa dari foto" di `scripts/aturan_foto.py` dan di `tests/aturanFoto.test.ts`.
**Perubahan:** M-09 dan G-05 ("periksa ... kondisi permukaan langsung") dari `bisa` menjadi `sebagian`. Akibatnya **tidak ada pertanyaan `bisa` di area mana pun**: AI hanya boleh mengisi Tidak. Tes jalur `bisa` memakai aturan buatan (`isiDariFoto`, `bersihkan`).
**Uji ulang** (3 foto × 3 kali, `sips`): hasil identik per foto, tidak ada "Ya" sama sekali, M-09 "tidak jelas" di ketiganya. Efek samping seperti sebelumnya: jawaban lain bergeser sedikit tiap kali teks prompt berubah (mis. M-02 dan M-03 pada foto Dreamina A kembali terisi Tidak, pada foto Dreamina B M-03 terisi Tidak). **Jalur browser belum diuji ulang**; itu yang paling dibutuhkan sebelum dipublikasikan.
