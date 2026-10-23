// Gambar benda kamar mandi (kloset, wastafel, pintu) bergaya manual perakitan, dibangun dengan alat yang sama dengan
// gambar shower (`gambarShower.ts`): kerangka dinding, kotak, dan ekstrusi jejak lantai. Satuan gambar ilustratif,
// BUKAN ukuran produk, dan gambar tidak pernah memuat angka.
import { DIM } from "./dimensiGambar";
import {
  bersihkan,
  ekstrusi,
  footprintOval,
  footprintPutar,
  kerangkaPanel,
  keRuang,
  kotak,
  latarPanel,
  pikselPerSatuan,
  poligon,
  titik,
  type Kerangka,
  type Peran,
  type Primitif,
  type SisiDinding,
  type Titik,
} from "./gambarShower";

export const JENIS_BENDA = [
  "kloset_duduk",
  "kloset_jongkok",
  "kloset_tidak_jelas",
  "wastafel",
  "pintu",
  "pintu_ayun_luar",
  "pintu_geser",
  "pintu_tanpa_daun",
] as const;
export type JenisBenda = (typeof JENIS_BENDA)[number];

const oval = (k: Kerangka, a: number, n: number, ra: number, rn: number, u: number, segmen = 32): Titik[] =>
  footprintOval(a, n, ra, rn, segmen).map(([x, y]) => titik(k, x, y, u));

// Versi E (disetujui pemilik di papan Claude Design): mangkuk, kaki, dan cekungan digeser dari sumbu tangki supaya
// pusatnya tampak sejajar dengan pusat tangki di layar, dan satu garis menyambungkan dasar tangki ke badan mangkuk.
// Geseran ditetapkan di LAYAR (6 satuan ke arah sisi mangkuk dan 6 ke atas pada panel), lalu diubah ke koordinat lokal
// (a, n) menurut sumbu dinding dan kamera yang dipakai, supaya hasilnya sama di semua dinding dan sudut pandang. Pada
// panel dinding belakang hasilnya (-9,464; -2,536).
const GESER_LAYAR = 6;
// Panjang garis penyambung (satuan lokal) dari sudut bawah muka tangki menerus ke arah n sampai badan mangkuk.
const PANJANG_PENYAMBUNG = 14.56;

/** Sumbu lokal `a` dan `n` di layar (vektor per satu satuan lokal, sudah termasuk skala kerangka). */
function sumbuLayar(k: Kerangka): { a: Titik; n: Titik } {
  const o = titik(k, 0, 0, 0);
  const a = titik(k, 1, 0, 0);
  const n = titik(k, 0, 1, 0);
  return { a: [a[0] - o[0], a[1] - o[1]], n: [n[0] - o[0], n[1] - o[1]] };
}

/** Geseran lokal (a, n) yang menggeser mangkuk 6 satuan layar ke sisi n dan 6 ke atas, pada skala panel. */
function geseranMangkuk(k: Kerangka): { a: number; n: number } {
  const { a: A, n: N } = sumbuLayar(k);
  const skala = Math.hypot(A[0], A[1]);
  const sx = (N[0] >= 0 ? GESER_LAYAR : -GESER_LAYAR) * skala;
  const sy = -GESER_LAYAR * skala;
  const det = A[0] * N[1] - N[0] * A[1];
  return { a: (sx * N[1] - N[0] * sy) / det, n: (A[0] * sy - sx * A[1]) / det };
}

/** Sisi tangki (+1 atau -1 sepanjang `a`) yang menghadap kamera: di situ garis penyambung digambar. */
function sisiTerlihat(k: Kerangka): 1 | -1 {
  const lihat = k.lihat ?? { x: 1, y: 1 };
  const [x0, y0] = keRuang(k, 0, 0);
  const [x1, y1] = keRuang(k, 1, 0);
  return (x1 - x0) * lihat.x + (y1 - y0) * lihat.y >= 0 ? 1 : -1;
}

function klosetDuduk(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { a, n } = geseranMangkuk(k);
  const sisi = sisiTerlihat(k);
  const pusatN = 31 + n;
  const setengah = DIM.kloset.lebar / 2;
  const tinggiDudukan = DIM.kloset.tinggiDudukan;
  return [
    ...kotak(k, -setengah, setengah, 0, 18, 38, 80, peran),
    ...kotak(k, -setengah - 2, setengah + 2, -1, 19.5, 80, 85, peran),
    ...ekstrusi(k, footprintOval(0, 9.25, 3.5, 3.5, 12), 85, 88, peran, true),
    ...ekstrusi(k, footprintOval(a, pusatN, 11, 17, 24), 0, 28, peran, true),
    ...ekstrusi(k, footprintOval(a, pusatN, 18, 26, 32), 28, tinggiDudukan, peran, true),
    poligon("rongga", oval(k, a, pusatN, 12, 19, tinggiDudukan), peran),
    {
      jenis: "garis",
      dari: titik(k, sisi * setengah, 18, 38),
      ke: titik(k, sisi * setengah, 18 + PANJANG_PENYAMBUNG, 38),
      gaya: "tegas",
      peran: peran,
    },
  ];
}

// Kloset jongkok: pelat rata dengan lantai dan lubang oval tepat di tengah pelat (pusat n = setengah kedalaman pelat).
const PELAT_JONGKOK = { setengahLebar: 18, dalam: 58, tinggi: 4 };

function klosetJongkok(k: Kerangka): Primitif[] {
  const { setengahLebar, dalam, tinggi } = PELAT_JONGKOK;
  return [
    ...kotak(k, -setengahLebar, setengahLebar, 0, dalam, 0, tinggi, "netral"),
    poligon("rongga", oval(k, 0, dalam / 2, 8, 19, tinggi), "netral"),
  ];
}

// Wastafel: bak PerMen (lebar x dalam) dan tinggi pasang untuk pengguna kursi roda dari tabel. Meja berbentuk D:
// setengah belakang persegi (menempel dinding), setengah depan oval, tanpa patahan di sambungan.
function jejakMeja(lebar: number, dalam: number): [number, number][] {
  const [ra, rn] = [lebar / 2, dalam / 2];
  return [
    [-ra, 0],
    [ra, 0],
    ...Array.from({ length: 17 }, (_, i): [number, number] => {
      const th = (i / 16) * Math.PI;
      return [ra * Math.cos(th), rn + rn * Math.sin(th)];
    }),
  ];
}

function wastafel(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebarBak, dalamBak, tinggiPenggunaKursiRoda: atas } = DIM.wastafel;
  const tebalMeja = 8;
  const bawahMeja = atas - tebalMeja;
  return [
    ...ekstrusi(k, footprintOval(0, 12.5, 2.5, 2.5, 10), bawahMeja - 38, bawahMeja, peran, true),
    ...kotak(k, -2.5, 2.5, 7, 17, bawahMeja - 42, bawahMeja - 36, peran),
    ...kotak(k, -16, -12, 6, 30, bawahMeja - 11, bawahMeja, peran),
    ...kotak(k, 12, 16, 6, 30, bawahMeja - 11, bawahMeja, peran),
    ...ekstrusi(k, jejakMeja(lebarBak, dalamBak), bawahMeja, atas, peran, true),
    poligon("rongga", oval(k, 0, dalamBak / 2 + 2.5, lebarBak / 2 - 10, dalamBak / 2 - 7.5, atas), peran),
    ...bersihkan([...kotak(k, -2, 2, 3, 7, atas, atas + 11, peran), ...kotak(k, -1.5, 1.5, 5, 19, atas + 10, atas + 13, peran)]),
  ];
}

/** Arah tegak lurus (a, n) yang menghadap kamera, supaya gagang pintu dipasang di sisi daun yang terlihat. */
function normalTerlihat(k: Kerangka, na: number, nn: number): [number, number] {
  const lihat = k.lihat ?? { x: 1, y: 1 };
  const [x0, y0] = keRuang(k, 0, 0);
  const [x1, y1] = keRuang(k, na, nn);
  return (x1 - x0) * lihat.x + (y1 - y0) * lihat.y >= 0 ? [na, nn] : [-na, -nn];
}

const SUDUT_BUKA = (55 * Math.PI) / 180;

/** Kusen pintu: dua tiang dan ambang atas, mengapit bukaan bersih. */
function kusenPintu(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const s2 = DIM.pintu.bukaanBersih / 2;
  const tinggi = DIM.pintu.tinggi;
  return [
    ...kotak(k, -s2 - 4, -s2, 0, 8, 0, tinggi + 8, peran),
    ...kotak(k, s2, s2 + 4, 0, 8, 0, tinggi + 8, peran),
    ...kotak(k, -s2 - 4, s2 + 4, 0, 8, tinggi, tinggi + 8, peran),
  ];
}

/**
 * Bukaan pintu pada bidang dinding: lubang selebar bukaan bersih setinggi pintu, digambar di atas dinding berkeramik supaya
 * pintu tampak menembus dinding, bukan menempel di permukaannya.
 */
export function bukaanDinding(k: Kerangka): Primitif {
  const s2 = DIM.pintu.bukaanBersih / 2;
  const tinggi = DIM.pintu.tinggi;
  return poligon("kiri", [titik(k, -s2, 0, 0), titik(k, s2, 0, 0), titik(k, s2, 0, tinggi), titik(k, -s2, 0, tinggi)], "ruang");
}

/**
 * Pintu berengsel. `arah` = +1 membuka ke dalam ruangan (arah n), -1 ke luar. Daun yang membuka menjauhi kamera berada di
 * belakang kusen dan digambar lebih dulu supaya tertutup kusen; daun yang mendekati kamera digambar terakhir.
 */
function pintuAyun(k: Kerangka, arah: 1 | -1, peran: Peran = "netral"): Primitif[] {
  const bukaan = DIM.pintu.bukaanBersih;
  const tinggi = DIM.pintu.tinggi;
  const sudut = SUDUT_BUKA * arah;
  const engsel: [number, number] = [-bukaan / 2, 4];
  const panjang = bukaan;
  const vektor: [number, number] = [Math.cos(sudut), Math.sin(sudut)];
  const tengah: [number, number] = [engsel[0] + (vektor[0] * panjang) / 2, engsel[1] + (vektor[1] * panjang) / 2];
  const [na, nn] = normalTerlihat(k, -vektor[1], vektor[0]);
  const gagang: [number, number] = [engsel[0] + vektor[0] * panjang * 0.89 + na * 3.5, engsel[1] + vektor[1] * panjang * 0.89 + nn * 3.5];
  // Garis putus-putus lintasan ayun daun pintu di lantai.
  const lintasan: Titik[] = Array.from({ length: 13 }, (_, i) => {
    const p = (i / 12) * sudut;
    return titik(k, engsel[0] + Math.cos(p) * panjang, engsel[1] + Math.sin(p) * panjang, 0);
  });
  const daun = [
    ...ekstrusi(k, footprintPutar(tengah[0], tengah[1], panjang / 2, 2, sudut), 0, tinggi - 2, peran),
    ...ekstrusi(k, footprintPutar(gagang[0], gagang[1], 5, 1.5, sudut), 98, 102, peran),
  ];
  const { n: arahMasuk } = sumbuLayar(k);
  const daunDekat = arah * arahMasuk[1] > 0;
  const kusen = kusenPintu(k, peran);
  return [{ jenis: "garisPoli", titik: lintasan, peran: "hantu" }, ...(daunDekat ? [...kusen, ...daun] : [...daun, ...kusen])];
}

/** Pintu geser: daun bergeser di depan dinding pada rel di atas kusen, separuh terbuka. */
function pintuGeser(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const bukaan = DIM.pintu.bukaanBersih;
  const tinggi = DIM.pintu.tinggi;
  const s2 = bukaan / 2;
  const rel = kotak(k, -s2 - 4, s2 + bukaan / 2 + 8, 8, 14, tinggi + 8, tinggi + 12, peran);
  const daun = [...kotak(k, 5, 5 + bukaan, 9, 13, 2, tinggi - 2, peran), ...kotak(k, 10, 13, 13, 15, 95, 115, peran)];
  const { n: arahMasuk } = sumbuLayar(k);
  const kusen = kusenPintu(k, peran);
  return arahMasuk[1] > 0 ? [...kusen, ...rel, ...daun] : [...daun, ...kusen, ...rel];
}

/** Kloset yang jenisnya tidak terbaca dari foto: kotak putus-putus dengan tanda tanya, tidak menebak. */
function klosetTidakJelas(k: Kerangka): Primitif[] {
  const [tx, ty] = titik(k, 0, 30, 50);
  return [...kotak(k, -20, 20, 0, 60, 0, 50, "hantu"), { jenis: "tanda", x: tx, y: ty + 11 * pikselPerSatuan(k), teks: "?" }];
}

/** Gambar satu benda pada dinding yang ditentukan `kerangka` (bawaan: dinding kanan panel). */
/** `peran` hanya mengubah warna kloset duduk, wastafel, dan pintu: "aksen" menandai benda pengganti pada gambar setelah modifikasi. */
export function gambarBenda(jenis: JenisBenda, kerangka: Kerangka = kerangkaPanel("kanan"), peran: Peran = "netral"): Primitif[] {
  switch (jenis) {
    case "kloset_duduk":
      return klosetDuduk(kerangka, peran);
    case "kloset_jongkok":
      return klosetJongkok(kerangka);
    case "wastafel":
      return wastafel(kerangka, peran);
    case "kloset_tidak_jelas":
      return klosetTidakJelas(kerangka);
    case "pintu":
      return pintuAyun(kerangka, 1, peran);
    case "pintu_ayun_luar":
      return pintuAyun(kerangka, -1, peran);
    case "pintu_geser":
      return pintuGeser(kerangka, peran);
    case "pintu_tanpa_daun":
      return kusenPintu(kerangka, peran);
  }
}

/** Gambar lengkap untuk panel: latar polos + benda pada dinding kanan (belakang) atau kiri. */
export function susunBenda(jenis: JenisBenda, sisi: SisiDinding, opsi: { latar?: boolean } = {}): Primitif[] {
  const k = kerangkaPanel(sisi);
  return [...(opsi.latar === false ? [] : latarPanel(k)), ...gambarBenda(jenis, k)];
}

export function titikPrimitif(p: Primitif): Titik[] {
  switch (p.jenis) {
    case "poligon":
    case "jalur":
    case "garisPoli":
      return p.titik;
    case "garis":
      return [p.dari, p.ke];
    case "elips":
      return [
        [p.cx - p.rx, p.cy - p.ry],
        [p.cx + p.rx, p.cy + p.ry],
      ];
    case "badan":
      return [
        [p.cx - p.rx, p.yAtas - p.ry],
        [p.cx + p.rx, p.yBawah + p.ry],
      ];
    case "cakram":
      return [
        [p.cx - p.r * 40, p.cy - p.r * 40],
        [p.cx + p.r * 40, p.cy + p.r * 40],
      ];
    case "baut":
      return [[p.cx, p.cy]];
    case "tanda":
      return [[p.x, p.y]];
    case "ukur":
      return [p.dari, p.ke];
    case "label":
      return [[p.x, p.y]];
  }
}

/**
 * Bingkai (viewBox) yang pas dengan satu benda, dengan rasio yang sama dengan kanvas panel: dipakai untuk menampilkan
 * benda dari dekat. Latar dinding dan lantai tetap digambar penuh dan terpotong bingkai.
 */
export function bingkaiBenda(jenis: JenisBenda, sisi: SisiDinding, margin = 0.35): [number, number, number, number] {
  const pts = gambarBenda(jenis, kerangkaPanel(sisi)).flatMap(titikPrimitif);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const rasio = 380 / 500;
  let w = (x1 - x0) * (1 + margin * 2);
  let h = (y1 - y0) * (1 + margin * 2);
  if (w / h > rasio) h = w / rasio;
  else w = h * rasio;
  return [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h];
}
