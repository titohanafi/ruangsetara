# Aturan Ruang Setara

Halaman ini mengumpulkan aturan yang dipakai situs, **dari mana asalnya**, dan **apakah sudah ditinjau peneliti**. Ditulis untuk dibaca tim peneliti dan pemilik produk, bukan untuk engineer. Setiap baris menyebut berkas tempat aturan itu tinggal, jadi bisa dicek atau diubah.

**Sumber** artinya salah satu dari:
- **Sheet peneliti**: diambil dari `riset/checklist-peneliti.xlsx`.
- **Tim produk / pembangun**: dibuat saat membangun situs ini (bukan dari sheet). Ini asumsi, perlu ditinjau.
- **Transisi**: dibawa dari proyek Transisi (`../transisi`), dibuat di sana oleh tim yang sama, bukan oleh peneliti.
- **Pedoman proyek**: aturan keras di `CLAUDE.md`.

**Ditinjau peneliti?** Saat ini **belum ada satu pun** aturan di halaman ini yang ditinjau peneliti, kecuali isi sheet itu sendiri. Semua kartu rekomendasi berstatus `draf`.

---

## 1. Isi pertanyaan dan rekomendasi

| Yang ditampilkan | Sumber | Berkas |
|---|---|---|
| Pertanyaan, elemen indikator, indikator ideal, cara verifikasi | Sheet peneliti | `content/pertanyaan/*.json` |
| Teks "Penyesuaian praktis" (Hack) dan "Modifikasi", rujukan | Sheet peneliti | `content/pertanyaan/*.json` |
| Empat kategori hasil (A, B, C, D) dan "Aturan penting" | Sheet peneliti | `content/hasil.json` |
| Pertanyaan profil pengguna | Situs peneliti yang sudah live | `content/profil.json` |

Berkas `content/pertanyaan/*.json` dibuat otomatis dari sheet (`python3 scripts/impor_xlsx.py`) dan tidak diedit tangan. Untuk mengubah isinya, ubah sheet lalu impor ulang.

Angka di sheet yang tampak keliru dicatat di `riset/koreksi-untuk-tim-riset.md` dan **belum dikoreksi** di situs (menunggu keputusan peneliti).

---

## 2. Pertanyaan mana yang boleh diisi otomatis dari foto

Aturan ini **diturunkan dari kolom "Cara Verifikasi" di sheet** (keputusan pemilik: "ikutin sheet"), memakai `scripts/aturan_foto.py`. Hasilnya di `content/pindai.json`.

| Bila Cara Verifikasi di sheet berisi... | Aturan | Artinya |
|---|---|---|
| **wawancara** | `tidak` | Tidak ditanyakan ke AI sama sekali |
| **ukur, uji, simulasi, konfirmasi, kekokohan, genangan**, atau **langsung** (diperiksa di tempat) | `sebagian` | AI hanya boleh mengisi **Tidak** (hambatan yang jelas terlihat). "Ya" tidak pernah terisi dari foto |
| hanya **observasi** atau **foto** | `bisa` | AI boleh mengisi Ya atau Tidak |

Klausa yang berisi "bila diperlukan" atau "bila memungkinkan" dianggap opsional dan tidak dihitung.

**Satu pengecualian tertulis, atas keputusan pemilik: M-08 (akses area mandi) = `bisa`.** Alasannya: Cara Verifikasi M-08 di sheet diawali "Foto area mandi", dan hambatan utamanya (ambang, bibir bak) kelihatan di foto. Foto **tidak** membuktikan ambang kecil, ruang pendekatan, atau metode mandi, jadi jawabannya tetap bertanda "Terisi dari foto" dan bisa diubah. Alasan lengkap ada di `content/pindai.json` (kunci `pengecualian`). **Perlu ditinjau peneliti.**

**Penafsiran saya sebagai pembangun, perlu diperiksa peneliti:** kata "ukur", "uji", "simulasi", "konfirmasi", dan "kekokohan" saya anggap sebagai hal yang tidak bisa dipastikan dari foto. Kata "genangan" (air menggenang, kemiringan ke saluran) dan "langsung" (diperiksa di tempat) juga saya anggap tidak bisa dipastikan dari foto. Kata "observasi" dan "foto" saya anggap bisa dilihat dari foto. Dengan penafsiran ini, selain M-08, AI hanya boleh menandai hambatan (Tidak), tidak pernah menyatakan sesuatu sudah sesuai (Ya).


### Mobilitas di rumah (tahap uji, belum diuji dengan foto sama sekali)

| ID | Pertanyaan | Cara Verifikasi di sheet | Aturan foto |
|---|---|---|---|
| G-01 | Apakah jalur sirkulasi dapat dilalui kursi roda? | Ukur lebar bersih pada titik tersempit; foto jalur dari beberapa sudut. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| G-02 | Apakah pengguna dapat berputar dengan kursi roda? | Ukur diameter atau dimensi area bebas; uji manuver langsung bila memungkinkan. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| G-03 | Apakah pintu dapat dilewati dengan mudah? | Ukur bukaan bersih ketika pintu terbuka; periksa pegangan dan posisi daun pintu. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| G-04 | Apakah terdapat ambang yang menghambat? | Foto ambang; ukur tinggi perbedaan level dan kemiringan transisi. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| G-05 | Apakah permukaan lantai aman dilalui? | Observasi foto; periksa sambungan, kerusakan, dan kondisi permukaan langsung. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| G-06 | Apakah pengguna dapat berpindah antarruang tanpa hambatan? | Telusuri rute pada denah atau foto; ukur titik tersempit. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| G-07 | Apakah furnitur menghalangi pergerakan? | Observasi foto; ukur jarak bebas di antara furnitur. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| G-08 | Apakah fasilitas penting dapat dijangkau? | Ukur ketinggian dan jarak jangkauan; konfirmasi kepada pengguna. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| G-09 | Apakah pengguna dapat membuka dan menutup pintu secara mandiri? | Foto posisi pendekatan; ukur ruang bebas; simulasi pembukaan pintu. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| G-10 | Apakah pengguna merasa aman dan dapat bergerak mandiri? | Wawancara pengguna; observasi aktivitas; catat bantuan yang masih diperlukan. | **tidak**: tidak ditanyakan ke AI |

### Dapur (tahap uji, belum diuji dengan foto sama sekali)

| ID | Pertanyaan | Cara Verifikasi di sheet | Aturan foto |
|---|---|---|---|
| K-01 | Apakah pengguna dapat masuk dan bergerak di dapur? | Foto dapur; ukur lebar pintu, jalur, dan ruang manuver. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| K-02 | Apakah meja kerja dapat digunakan dari posisi duduk? | Ukur tinggi meja, kedalaman, dan ruang bebas bawah meja; uji aktivitas. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| K-03 | Apakah wastafel dapat digunakan dari kursi roda? | Ukur tinggi bibir wastafel, ruang pendekatan, dan ruang bawah; uji jangkauan. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| K-04 | Apakah peralatan masak dapat dijangkau dengan aman? | Foto posisi kompor; ukur jangkauan kontrol; konfirmasi kemampuan pengguna. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| K-05 | Apakah penyimpanan peralatan dapat dijangkau? | Ukur tinggi rak dan laci; inventarisasi barang yang sering digunakan; uji jangkauan. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| K-06 | Apakah kulkas dapat digunakan secara mandiri? | Foto pintu dan interior; ukur posisi rak; uji membuka pintu dan mengambil barang. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| K-07 | Apakah tersedia area untuk menyiapkan makanan? | Ukur area bebas dan jarak antarelemen; simulasi urutan menyiapkan makanan. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| K-08 | Apakah dapur aman digunakan dari posisi duduk? | Observasi foto dan langsung; wawancara pengguna; identifikasi risiko aktivitas. | **tidak**: tidak ditanyakan ke AI |

### Kamar tidur (tahap uji, belum diuji dengan foto sama sekali)

| ID | Pertanyaan | Cara Verifikasi di sheet | Aturan foto |
|---|---|---|---|
| B-01 | Apakah kamar tidur dapat dimasuki kursi roda? | Foto akses masuk; ukur bukaan pintu dan jalur. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| B-02 | Apakah tersedia ruang untuk bermanuver? | Ukur area bebas; tandai furnitur yang menghalangi; uji manuver. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| B-03 | Apakah pengguna dapat mendekati tempat tidur? | Ukur jarak bebas di sisi tempat tidur; konfirmasi cara transfer; lakukan simulasi jika aman. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| B-04 | Apakah tinggi tempat tidur sesuai kebutuhan transfer? | Ukur tinggi dudukan kursi roda dan kasur; konfirmasi kemudahan transfer. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| B-05 | Apakah pengguna dapat berpindah antara kursi roda dan tempat tidur? | Observasi posisi furnitur; ukur area transfer; konfirmasi metode transfer. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| B-06 | Apakah lemari pakaian dapat digunakan dari posisi duduk? | Ukur ketinggian rak dan laci; uji jangkauan; periksa ruang membuka pintu lemari. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| B-07 | Apakah meja samping tempat tidur dan barang pribadi dapat dijangkau? | Foto area samping tempat tidur; ukur jangkauan; konfirmasi kebutuhan pengguna. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| B-08 | Apakah sakelar dan stopkontak dapat digunakan? | Ukur tinggi dan posisi kontrol; foto jalur kabel; uji penggunaan. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| B-09 | Apakah tersedia ruang untuk berpakaian dan merawat diri? | Simulasikan urutan aktivitas; ukur area yang digunakan; wawancara pengguna. | **tidak**: tidak ditanyakan ke AI |
| B-10 | Apakah jalur dari tempat tidur menuju pintu dan kamar mandi aman? | Foto jalur; observasi pencahayaan; konfirmasi rutinitas malam hari. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |

### Kamar mandi (baru diuji dengan tiga foto, dua di antaranya buatan AI)

| ID | Pertanyaan | Cara Verifikasi di sheet | Aturan foto |
|---|---|---|---|
| M-01 | Apakah pintu kamar mandi dapat dilewati kursi roda? | Ukur bukaan bersih; foto arah bukaan dan ruang pendekatan. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| M-02 | Apakah tersedia ruang untuk bermanuver di kamar mandi? | Ukur area bebas; petakan perlengkapan sanitasi dan hambatannya. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| M-03 | Apakah toilet dapat didekati dari kursi roda? | Ukur jarak bebas di depan dan samping toilet; konfirmasi metode transfer. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| M-04 | Apakah tinggi toilet mendukung transfer yang aman? | Ukur tinggi dudukan toilet dan kursi roda; konfirmasi pengalaman transfer. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| M-05 | Apakah tersedia pegangan bantu yang sesuai? | Foto pegangan; ukur posisi dan dimensi; periksa kekokohan oleh pihak kompeten. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| M-06 | Apakah wastafel dapat digunakan dari posisi duduk? | Ukur tinggi wastafel dan ruang bawah; uji jangkauan keran. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| M-07 | Apakah keran dan perlengkapan mandi mudah dioperasikan? | Ukur ketinggian dan jangkauan; uji pengoperasian; konfirmasi pengguna. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| M-08 | Apakah area mandi dapat diakses tanpa hambatan? | Foto area mandi; ukur ambang dan ruang pendekatan; konfirmasi metode mandi. | **bisa** (pengecualian): AI boleh mengisi Ya atau Tidak |
| M-09 | Apakah lantai kamar mandi aman untuk kursi roda? | Observasi permukaan; periksa genangan; ukur kemiringan bila diperlukan. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| M-10 | Apakah tersedia tempat duduk mandi yang aman? | Foto dudukan; periksa kekokohan; konfirmasi kenyamanan dan metode transfer. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| M-11 | Apakah barang mandi dapat dijangkau? | Ukur ketinggian rak dan gantungan; uji jangkauan; konfirmasi pengguna. | **sebagian**: AI hanya boleh mengisi Tidak (hambatan yang jelas terlihat) |
| M-12 | Apakah pengguna dapat menjaga privasi dan keselamatan? | Observasi mekanisme pintu; wawancara pengguna; tinjau skenario bantuan darurat. | **tidak**: tidak ditanyakan ke AI |

Yang terjadi bila jawaban sudah terisi dari foto: bertanda "Terisi dari foto", selalu bisa diubah pengguna, dan **jawaban pengguna tidak pernah ditimpa** pembacaan foto. Pengguna tetap melewati semua pertanyaan di langkah Pertanyaan.

---

## 3. Aturan yang diberikan ke AI (Gemini) saat membaca checklist

Sumber seluruh bagian ini: **tim produk / pembangun** (dengan pelajaran dari Transisi). **Bukan dari sheet** dan belum ditinjau peneliti. Teks lengkapnya ada di `server/analisis.ts`.

| Aturan | Isinya |
|---|---|
| Hanya yang terlihat | AI menilai hanya yang tampak jelas di foto, dari sudut pandang pengguna kursi roda |
| Tiga jawaban | "Ya" (jelas terlihat dan sesuai), "Tidak" (jelas terlihat dan kemungkinan hambatan), "Tidak jelas" (tidak terlihat, tertutup, butuh ukuran, atau ragu) |
| Ragu = tidak jelas | Lebih baik "tidak jelas" daripada menebak, karena "Ya" palsu menyembunyikan hambatan nyata |
| Tanpa angka | AI tidak boleh memperkirakan ukuran dalam angka |
| Lantai licin | "Ya" hanya bila lantai jelas kasat, bertekstur, beralur, atau ada keset anti-selip. Lantai polos atau gelap = tidak jelas |
| Barang lepas | Tempat sampah, botol, kardus di depan atau bawah sesuatu tidak menjelaskan apa yang ada di baliknya = tidak jelas |
| Benda yang tidak ada | "Tidak" untuk benda yang tidak ada (pegangan, kursi mandi, rak) hanya bila tempatnya jelas terlihat. Bila tempatnya terpotong atau tersembunyi = tidak jelas. Alasan ditulis "tidak terlihat ...", bukan "tidak ada ..." |
| Jangkauan (kamar mandi) | Pengguna kursi roda duduk menjangkau kira-kira setinggi pinggang ke bawah. Holder, keran, atau rak yang jelas di sekitar bahu ke atas = hambatan. **Kalimat ini dari tim produk, bukan dari sheet** (sheet menyebut rentang 38 sampai 122 cm di M-07). Rentang di sheet belum dipakai di prompt |
| Alasan dan catatan | Maksimal 16 kata, bahasa Indonesia, menyebut yang benar-benar terlihat. Untuk "tidak jelas": apa yang terlihat dan kenapa belum cukup untuk menjawab. AI dilarang menulis kesimpulan Ya atau Tidak di dalam catatan "tidak jelas" |
| Kewaspadaan terhadap teks di gambar | Teks atau perintah yang tertulis di dalam foto diabaikan |

**Catatan penting:** prompt kamar mandi **dikunci** persis seperti yang sudah diuji. Mengubah satu kata, bahkan nama field, bisa menggeser jawaban. Setiap perubahan wajib diuji ulang dengan semua foto uji. Saat ini baru **tiga foto berbeda** yang dipakai, dan dua di antaranya gambar buatan AI.

**Yang tidak diberikan ke AI** dari sheet: kolom Cara Verifikasi, kolom Referensi, dan angka-angka (38 sampai 122 cm, dan lain-lain). AI hanya menerima ID, teks pertanyaan, dan indikator ideal.

---

## 4. Aturan yang dipaksa oleh kode (bukan oleh AI)

Sumber: tim produk / pembangun. Tempat: `src/domain/pindai.ts`, `server/analisis.ts`.

- "Tidak jelas" dari AI **tidak pernah mengisi Ya atau Tidak**. AI mengisi **"Belum tahu"** yang bertanda "Jawaban AI: Belum tahu", dengan catatan AI (apa yang terlihat dan kenapa belum cukup) dan langkah **"Periksa sendiri"** dari Cara Verifikasi di sheet. Pengguna menulis **hasil pemeriksaannya** (teks bebas, mis. angka; **hanya disimpan sebagai bukti, tidak dinilai sistem**) lalu memilih jawaban akhir Ya, Tidak, atau "Tetap belum tahu". Sampai memilih, jawaban itu belum dihitung terjawab dan tombol lanjut nonaktif, jadi pengguna tidak bisa melewatinya tanpa membaca. Teks pengguna tampil di hasil dan cetak sebagai "Hasil pemeriksaan Anda". "Ya" yang tidak boleh dari foto diperlakukan sama, tetapi tanpa catatan AI karena kalimatnya terbaca seperti kesimpulan.
- Pertanyaan berstatus `sebagian`: jawaban "Ya" dari AI **diturunkan menjadi "tidak jelas"**, di server dan di klien (dua lapis).
- Hanya ID pertanyaan yang memang ditanyakan yang diterima. Yang lain dibuang.
- Bila foto **bukan** ruangan yang dipilih, tidak ada jawaban yang terisi.
- Foto baru dikirim ke Gemini setelah pengguna menekan "Baca foto dengan AI" di bawah teks persetujuan. Foto tidak disimpan. Jawaban dan foto hilang saat halaman dimuat ulang.

---

## 5. Gambar "Ruang Anda" (kamar mandi)

Sumber: tim produk / pembangun, penggambar dari **Transisi**. Tempat: `DECISIONS.md` nomor 14 dan 15.

| Aturan | Isinya |
|---|---|
| Hanya foto pertama | Tata letak dibaca dari foto pertama saja. Beberapa foto dari sudut berbeda membuat "dinding mana" tidak konsisten |
| Tata letak kasar | AI hanya menyebut dinding dan zona (kiri, tengah, kanan, depan, belakang) tiap benda, **bukan ukuran** |
| Tidak terlihat = tidak digambar | Benda yang tidak terbaca tidak digambar. Jenis kloset yang tidak jelas tampil sebagai kotak putus-putus berlogo "?" |
| Gambar bukan ukuran | Diberi label "Ilustrasi skematik. Bukan ukuran sebenarnya" dan tidak pernah memuat angka |
| Proporsi gambar | Dari tabel PerMen PUPR 14/2017 dan ADA 2010 (`content/ukuran-aksesibel.json`, semua berstatus `draf`; tabel menyebut itu aturan toilet umum, bukan rumah tinggal), ditambah beberapa perkiraan Transisi yang belum bersumber |
| Gambar "setelah modifikasi" | Satu ilustrasi isometrik seluruh ruangan. Tiap pertanyaan yang dijawab **Tidak** menambahkan gambar penyesuaiannya sesuai teks **Modifikasi** di sheet (hijau). "Ya" dan "Belum tahu" tidak digambar. Semua 12 pertanyaan kamar mandi punya gambar: M-01 pintu membuka ke luar, M-02 ruang putar, M-03 area bebas kloset, M-04 kloset duduk, M-05 pegangan, M-06 wastafel dan cermin, M-07 hand shower di jangkauan (hanya hand shower yang digantung), M-08 lantai shower rata, M-09 lantai bertekstur, M-10 kursi mandi, M-11 rak dan handuk, M-12 tombol darurat. **Pemetaan teks Modifikasi ke gambar adalah penafsiran pembangun, perlu ditinjau peneliti.** Tidak ada "Penyesuaian praktis" di gambar |

---

## 6. Aturan konten dari pedoman proyek

Sumber: `CLAUDE.md`.

- **Jangan mengarang** ukuran, angka, rujukan, atau klaim medis. Bila tidak ada di sheet, isi kosong atau "menyusul".
- Hasil asesmen **bukan sertifikasi keselamatan**. Nyeri, luka, dan protesis tidak dijawab; pengguna diarahkan ke dokter rehabilitasi medik atau prostetis-ortotis.
- Semua kartu berstatus `draf` dan menampilkan lencana "Draf, belum ditinjau ahli".
- Bahasa Indonesia, sapaan "Anda", kalimat pendek. Pakai "penyandang disabilitas", "pengguna kursi roda", "caregiver". Hindari "cacat", "korban", "penderita", "kasihan".
- Semua teks antarmuka ada di `content/ui.json`.

---

## 7. Yang perlu diputuskan atau diperiksa peneliti

1. Apakah penafsiran kata kunci di bagian 2 benar (ukur, uji, simulasi, konfirmasi, kekokohan = tidak bisa dari foto)? Khususnya M-09 ("observasi permukaan; periksa genangan"), G-05 ("periksa ... kondisi permukaan langsung"), dan G-06.
2. Apakah rentang jangkauan di sheet (38 sampai 122 cm, M-07 dan M-11) boleh dijadikan dasar kalimat "jangkauan" di prompt AI? Saat ini prompt memakai "setinggi pinggang ke bawah".
3. Angka yang dicatat di `riset/koreksi-untuk-tim-riset.md` perlu dikoreksi di sheet.
4. Apakah gambar tiap modifikasi (pegangan di belakang dan samping kloset, kursi lipat, area shower rata dengan saluran, ruang putar, area bebas) sudah mewakili teks Modifikasi di sheet?
5. Perlu foto uji kamar mandi yang nyata dan beragam (baru ada tiga foto, dua di antaranya buatan AI).
6. Mobilitas, dapur, dan kamar tidur **belum pernah diuji** dengan foto. Aturan fotonya hanya turunan dari sheet.

