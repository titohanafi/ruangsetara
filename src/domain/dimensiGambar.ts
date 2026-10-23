// Dimensi nyata yang dipakai SEMUA gambar (panel Claude Design, panel di hasil Pindai, dan tampilan ruangan).
// Satuan gambar = 1 cm. Tiap angka berasal dari tabel `content/ukuran-aksesibel.json` (PerMen PUPR 14/2017 diutamakan,
// lalu ADA 2010) atau tercatat sebagai PERKIRAAN di `DIMENSI_PERKIRAAN` di bawah, yang harus diperiksa tim riset. Gambar
// tidak pernah menampilkan angka.
import { nilaiAcuan, type KunciNilai } from "./ukuranAksesibel";

function dariTabel(id: string, kunci: KunciNilai): number {
  const n = nilaiAcuan(id, kunci);
  if (!n) throw new Error(`tabel ukuran aksesibel tidak punya ${id}/${kunci}`);
  return n.cm;
}

/** Dimensi yang BUKAN dari tabel: dipilih agar gambar masuk akal, belum bersumber. Daftar ini dilaporkan ke tim riset. */
export const DIMENSI_PERKIRAAN = {
  tinggiRuang: { cm: 260, keterangan: "Tinggi plafon ruangan; tidak ada di tabel." },
  tinggiPintu: { cm: 210, keterangan: "Tinggi daun pintu; PerMen dan ADA di tabel hanya memuat lebar bersih." },
  tebalDinding: { cm: 10, keterangan: "Tebal dinding yang digambar; hanya penampakan, tidak memengaruhi ruang dalam." },
  ubin: { cm: 30, keterangan: "Ukuran kotak garis keramik di dinding; konvensi gambar sebagai penggaris, bukan ukuran produk." },
  kloset: {
    cm: 36,
    keterangan: "Lebar tangki dan badan kloset duduk (juga bentuk lain: kedalaman, tinggi tangki); tabel hanya memuat tinggi dudukan.",
  },
  hookHandShowerLuarJangkauan: {
    cm: 180,
    keterangan: "Tinggi kait hand shower yang di luar zona jangkauan pada gambar kondisi dari foto.",
  },
  kepalaShowerTetap: { cm: 200, keterangan: "Tinggi kepala shower tetap pada gambar kondisi dari foto." },
  bakMandi: {
    cm: 110,
    keterangan: "Panjang bak mandi tembok pada gambar kondisi (juga kedalaman 70 cm dan tinggi bibir 50 cm); tidak ada di tabel.",
  },
  bagianKecilShower: {
    cm: 0.45,
    keterangan:
      "Pengali bentuk keran, kepala shower, holder, dan ember dari ilustrasi awal ke ukuran nyata (kepala sekitar 13 cm, ember sekitar 25 cm).",
  },
} as const;

export const DIM = {
  ruang: {
    lebar: dariTabel("toilet-disabilitas-ruang-dalam", "lebar_cm"),
    dalam: dariTabel("toilet-disabilitas-ruang-dalam", "panjang_cm"),
    tinggi: DIMENSI_PERKIRAAN.tinggiRuang.cm,
    tebalDinding: DIMENSI_PERKIRAAN.tebalDinding.cm,
  },
  ubin: DIMENSI_PERKIRAAN.ubin.cm,
  pintu: {
    bukaanBersih: dariTabel("pintu-toilet-lebar-bersih", "min_cm"),
    tinggi: DIMENSI_PERKIRAAN.tinggiPintu.cm,
  },
  kloset: {
    tinggiDudukan: dariTabel("kloset-tinggi-dudukan", "nilai_cm"),
    lebar: DIMENSI_PERKIRAAN.kloset.cm,
  },
  wastafel: {
    lebarBak: dariTabel("wastafel-ukuran-bak", "panjang_cm"),
    dalamBak: dariTabel("wastafel-ukuran-bak", "lebar_cm"),
    tinggiPenggunaKursiRoda: dariTabel("wastafel-tinggi-pengguna-kursi-roda", "nilai_cm"),
  },
  akses: {
    tempatDuduk: dariTabel("pancuran-tempat-duduk", "min_cm"),
    lebarBilik: dariTabel("pancuran-lebar-bilik", "min_cm"),
    dalamBilik: dariTabel("pancuran-lebar-bilik", "panjang_cm"),
    panjangBak: DIMENSI_PERKIRAAN.bakMandi.cm,
    dalamBak: 70,
    bibirBak: 50,
  },
  // Pegangan rambat (grab bar): semua dari tabel, dipakai hanya untuk proporsi gambar.
  pegangan: {
    diameter: dariTabel("pegangan-diameter", "nilai_cm"),
    tinggiMaks: dariTabel("pegangan-tinggi-horizontal", "maks_cm"),
    jarakDinding: dariTabel("pegangan-jarak-ke-dinding", "nilai_cm"),
    panjangSamping: dariTabel("pegangan-panjang-samping", "min_cm"),
    panjangBelakang: dariTabel("pegangan-panjang-belakang", "min_cm"),
  },
  /** Diameter ruang putar kursi roda (PerMen, ADA sama). */
  ruangPutar: dariTabel("ruang-putar-kursi-roda", "min_cm"),
  /** Panjang area shower tanpa undakan (roll-in); ADA, PerMen tidak mengatur. Lebarnya memakai bilik pancuran PerMen (`akses.lebarBilik`). */
  rollIn: { panjang: dariTabel("pancuran-roll-in-ukuran", "panjang_cm") },
  shower: {
    zonaBawah: dariTabel("jangkauan-zona-perlengkapan", "min_cm"),
    zonaAtas: dariTabel("pancuran-tinggi-kran", "maks_cm"),
    selangMin: dariTabel("pancuran-selang-hand-shower", "min_cm"),
    kaitLuarJangkauan: DIMENSI_PERKIRAAN.hookHandShowerLuarJangkauan.cm,
    kepalaTetap: DIMENSI_PERKIRAAN.kepalaShowerTetap.cm,
    bagianKecil: DIMENSI_PERKIRAAN.bagianKecilShower.cm,
  },
} as const;
