// Katalog objek perabot yang disebut di sheet peneliti (indikator, hack, modifikasi) tetapi belum dipakai di gambar pertanyaan mana pun:
// kursi roda (acuan skala), kursi, meja makan, sofa, rak sepatu, galon dan dispenser, kardus, keset, meja dorong, pegboard, tabung gas,
// APAR, lampu meja, dan bak mandi tembok. Tiap objek digambar berpusat di a = 0 dan bersandar di dinding (n = 0).
// Ukuran hanya untuk proporsi (`UKURAN`, perkiraan, tidak ditulis di gambar, dilaporkan ke peneliti). Gambar tidak pernah memuat angka.
import { ekstrusi, footprintOval, kotak, poligon, titik, type Kerangka, type Peran, type Primitif } from "./gambarShower";

/** Ukuran ilustratif (cm). Perkiraan untuk proporsi, BUKAN dari sheet atau tabel. */
export const UKURAN = {
  kursiRoda: { lebarKursi: 44, dalam: 42, tinggiDudukan: 48, tinggiSandaran: 90, jariRodaBesar: 30, jariRodaKecil: 8 },
  kursi: { lebar: 42, dalam: 42, tinggiDudukan: 45, tinggiSandaran: 90 },
  mejaMakan: { lebar: 140, dalam: 80, tinggi: 75 },
  sofa: { lebar: 180, dalam: 85, tinggiDudukan: 42, tinggiSandaran: 80 },
  rakSepatu: { lebar: 80, dalam: 30, tinggi: 100 },
  dispenser: { lebar: 32, dalam: 32, tinggi: 95, jariGalon: 13, tinggiGalon: 48 },
  kardus: { lebar: 44, dalam: 32, tinggi: 32 },
  keset: { lebar: 60, dalam: 40 },
  mejaDorong: { lebar: 60, dalam: 40, tinggi: 80 },
  pegboard: { lebar: 80, tinggi: 60, dasar: 100 },
  tabungGas: { jari: 15, tinggi: 55 },
  apar: { jari: 8, tinggi: 45 },
  lampuMeja: { jariDasar: 8, tinggi: 38, jariKap: 14 },
  bakMandi: { lebar: 110, dalam: 70, tinggi: 50 },
} as const;

/** Lingkaran tegak (roda) pada bidang sejajar dinding di kedalaman `n`, berpusat di (a, u), jari-jari `r`. */
function cakram(k: Kerangka, a: number, n: number, u: number, r: number, peran: Peran, jarijari = true): Primitif[] {
  const pts = (rr: number) =>
    Array.from({ length: 28 }, (_, i) => titik(k, a + rr * Math.cos((i / 28) * Math.PI * 2), n, u + rr * Math.sin((i / 28) * Math.PI * 2)));
  const hasil: Primitif[] = [
    poligon("kanan", pts(r), peran),
    poligon("rongga", pts(r * 0.62), peran),
    poligon("atas", pts(r * 0.16), peran),
  ];
  if (jarijari) {
    for (let i = 0; i < 6; i++) {
      const t = (i / 6) * Math.PI * 2;
      hasil.push({
        jenis: "garis",
        dari: titik(k, a, n, u),
        ke: titik(k, a + r * 0.62 * Math.cos(t), n, u + r * 0.62 * Math.sin(t)),
        gaya: "tegas",
        peran,
      });
    }
  }
  return hasil;
}

/** Kursi roda manual dilihat dari samping (menghadap +a): dudukan, sandaran, pegangan dorong, dua roda besar, roda kecil, dan tumpuan kaki. */
export function kursiRoda(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { dalam, tinggiDudukan, tinggiSandaran, jariRodaBesar, jariRodaKecil } = UKURAN.kursiRoda;
  const n0 = 6;
  const n1 = n0 + dalam;
  return [
    ...cakram(k, -10, n0 - 2, jariRodaBesar, jariRodaBesar, peran),
    ...kotak(k, -26, 24, n0, n1, tinggiDudukan - 3, tinggiDudukan, peran),
    ...kotak(k, -26, -22, n0, n1, tinggiDudukan, tinggiSandaran, peran),
    ...kotak(k, -34, -26, n0 + 2, n0 + 6, tinggiSandaran - 6, tinggiSandaran - 3, peran),
    ...kotak(k, -34, -26, n1 - 6, n1 - 2, tinggiSandaran - 6, tinggiSandaran - 3, peran),
    ...kotak(k, -20, 18, n0, n0 + 2, tinggiDudukan, tinggiDudukan + 20, peran),
    ...kotak(k, 24, 28, n0 + 2, n0 + 5, 14, tinggiDudukan - 3, peran),
    ...kotak(k, 24, 28, n1 - 5, n1 - 2, 14, tinggiDudukan - 3, peran),
    ...kotak(k, 26, 44, n0 + 2, n1 - 2, 10, 13, peran),
    ...cakram(k, 36, n0 + 3, jariRodaKecil, jariRodaKecil, peran, false),
    ...cakram(k, 36, n1 - 3, jariRodaKecil, jariRodaKecil, peran, false),
    ...cakram(k, -10, n1 + 2, jariRodaBesar, jariRodaBesar, peran),
  ];
}

/** Kursi makan: dudukan, sandaran, empat kaki. */
export function kursi(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam, tinggiDudukan, tinggiSandaran } = UKURAN.kursi;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  const kaki = (a: number, n: number) => kotak(k, a, a + 4, n, n + 4, 0, tinggiDudukan - 3, peran);
  return [
    ...kaki(a0 + 1, 2),
    ...kaki(a1 - 5, 2),
    ...kaki(a0 + 1, dalam - 6),
    ...kaki(a1 - 5, dalam - 6),
    ...kotak(k, a0, a1, 0, dalam, tinggiDudukan - 3, tinggiDudukan, peran),
    ...kotak(k, a0, a1, 0, 4, tinggiDudukan, tinggiSandaran, peran),
  ];
}

/** Meja makan atau meja kerja besar yang berdiri bebas: papan dan empat kaki. */
export function mejaMakan(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam, tinggi } = UKURAN.mejaMakan;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  const kaki = (a: number, n: number) => kotak(k, a, a + 6, n, n + 6, 0, tinggi - 4, peran);
  return [
    ...kaki(a0 + 4, 4),
    ...kaki(a1 - 10, 4),
    ...kaki(a0 + 4, dalam - 10),
    ...kaki(a1 - 10, dalam - 10),
    ...kotak(k, a0, a1, 0, dalam, tinggi - 4, tinggi, peran),
  ];
}

/** Sofa: alas, dua bantal dudukan, sandaran, dan dua lengan. */
export function sofa(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam, tinggiDudukan, tinggiSandaran } = UKURAN.sofa;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  return [
    ...kotak(k, a0, a1, 0, dalam, 0, 18, peran),
    ...kotak(k, a0 + 14, -1, 16, dalam - 2, 18, tinggiDudukan, peran),
    ...kotak(k, 1, a1 - 14, 16, dalam - 2, 18, tinggiDudukan, peran),
    ...kotak(k, a0, a1, 0, 16, 18, tinggiSandaran, peran),
    ...kotak(k, a0, a0 + 14, 0, dalam, 18, 62, peran),
    ...kotak(k, a1 - 14, a1, 0, dalam, 18, 62, peran),
  ];
}

/** Rak sepatu terbuka: dua sisi, tiga papan, dan beberapa sepatu. */
export function rakSepatu(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam, tinggi } = UKURAN.rakSepatu;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  const papan = [3, tinggi / 3, (2 * tinggi) / 3].flatMap((u) => kotak(k, a0, a1, 0, dalam, u, u + 3, peran));
  const sepatu = [a0 + 12, a0 + 38, a0 + 60].flatMap((a) =>
    [3, tinggi / 3, (2 * tinggi) / 3].flatMap((u) => kotak(k, a, a + 14, 6, 24, u + 3, u + 11, peran)),
  );
  return [
    ...kotak(k, a0, a0 + 3, 0, dalam, 0, tinggi, peran),
    ...kotak(k, a1 - 3, a1, 0, dalam, 0, tinggi, peran),
    ...papan,
    ...sepatu,
    ...kotak(k, a0, a1, 0, 2, 0, tinggi, peran),
  ];
}

/** Dispenser dengan galon air di atasnya (silinder dengan leher). */
export function dispenser(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam, tinggi, jariGalon, tinggiGalon } = UKURAN.dispenser;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  return [
    ...kotak(k, a0, a1, 0, dalam, 0, tinggi, peran),
    ...kotak(k, -7, 7, dalam, dalam + 2, tinggi - 40, tinggi - 36, peran),
    ...ekstrusi(k, footprintOval(0, dalam / 2, jariGalon, jariGalon, 24), tinggi, tinggi + tinggiGalon, peran, true),
    ...ekstrusi(k, footprintOval(0, dalam / 2, 5, 5, 16), tinggi + tinggiGalon, tinggi + tinggiGalon + 7, peran, true),
  ];
}

/** Kardus bertumpuk satu, dengan pita perekat di tengah tutup. */
export function kardus(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam, tinggi } = UKURAN.kardus;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  return [...kotak(k, a0, a1, 0, dalam, 0, tinggi, peran), ...kotak(k, -3, 3, 0, dalam, tinggi, tinggi + 0.5, peran)];
}

/** Keset: alas tipis dengan tiga garis tekstur. */
export function keset(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam } = UKURAN.keset;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  const garis = [0.25, 0.5, 0.75].map((f): Primitif => ({
    jenis: "garis",
    dari: titik(k, a0 + 4, dalam * f, 1.5),
    ke: titik(k, a1 - 4, dalam * f, 1.5),
    gaya: "tegas",
    peran,
  }));
  return [...kotak(k, a0, a1, 0, dalam, 0, 1.5, peran), ...garis];
}

/** Meja dorong: dua papan, empat kaki beroda, dan pegangan di satu sisi. */
export function mejaDorong(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam, tinggi } = UKURAN.mejaDorong;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  const kaki = (a: number, n: number) => [
    ...kotak(k, a, a + 3, n, n + 3, 6, tinggi, peran),
    ...kotak(k, a - 1, a + 4, n - 1, n + 4, 0, 6, peran),
  ];
  return [
    ...kaki(a0 + 1, 2),
    ...kaki(a1 - 4, 2),
    ...kaki(a0 + 1, dalam - 5),
    ...kaki(a1 - 4, dalam - 5),
    ...kotak(k, a0, a1, 0, dalam, tinggi - 3, tinggi, peran),
    ...kotak(k, a0, a1, 0, dalam, 24, 27, peran),
    ...kotak(k, a0 - 6, a0 + 1, 4, dalam - 4, tinggi, tinggi + 3, peran),
  ];
}

/** Pegboard di dinding: papan dengan titik lubang dan tiga pengait. */
export function pegboard(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, tinggi, dasar } = UKURAN.pegboard;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  const lubang: Primitif[] = [];
  for (let a = a0 + 8; a <= a1 - 8; a += 12)
    for (let u = dasar + 8; u <= dasar + tinggi - 8; u += 12)
      lubang.push({ jenis: "baut", cx: titik(k, a, 3, u)[0], cy: titik(k, a, 3, u)[1], peran });
  const pengait = [-24, 0, 24].flatMap((a) => kotak(k, a - 1, a + 1, 3, 12, dasar + 28, dasar + 30, peran));
  return [...kotak(k, a0, a1, 0, 3, dasar, dasar + tinggi, peran), ...lubang, ...pengait];
}

/** Tabung gas elpiji: silinder dengan kerah dan katup. */
export function tabungGas(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { jari, tinggi } = UKURAN.tabungGas;
  return [
    ...ekstrusi(k, footprintOval(0, jari + 2, jari, jari, 28), 0, tinggi, peran, true),
    ...ekstrusi(k, footprintOval(0, jari + 2, 7, 7, 16), tinggi, tinggi + 5, peran, true),
    ...kotak(k, -3, 3, jari - 1, jari + 5, tinggi + 5, tinggi + 12, peran),
  ];
}

/** Alat pemadam api ringan (APAR): silinder dengan kepala, tuas, dan selang. */
export function apar(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { jari, tinggi } = UKURAN.apar;
  const selang: Primitif = {
    jenis: "jalur",
    titik: [titik(k, 3, jari + 3, tinggi + 6), titik(k, 14, jari + 8, tinggi - 6), titik(k, 12, jari + 10, 20)],
    gaya: "selang",
    peran,
  };
  return [
    ...ekstrusi(k, footprintOval(0, jari + 2, jari, jari, 24), 0, tinggi, peran, true),
    ...ekstrusi(k, footprintOval(0, jari + 2, 4, 4, 14), tinggi, tinggi + 4, peran, true),
    ...kotak(k, -6, 6, jari - 2, jari + 6, tinggi + 4, tinggi + 7, peran),
    selang,
  ];
}

/** Lampu meja: dasar bulat, tiang tipis, dan kap. */
export function lampuMeja(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { jariDasar, tinggi, jariKap } = UKURAN.lampuMeja;
  return [
    ...ekstrusi(k, footprintOval(0, jariKap, jariDasar, jariDasar, 20), 0, 3, peran, true),
    ...kotak(k, -1, 1, jariKap - 1, jariKap + 1, 3, tinggi - 12, peran),
    ...ekstrusi(k, footprintOval(0, jariKap, jariKap, jariKap, 24), tinggi - 14, tinggi, peran, true),
  ];
}

/** Bak mandi tembok: kotak dengan cekungan, bibir tinggi yang sulit dilewati dari kursi roda. */
export function bakMandi(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam, tinggi } = UKURAN.bakMandi;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  const cekung = poligon(
    "rongga",
    [titik(k, a0 + 6, 6, tinggi), titik(k, a1 - 6, 6, tinggi), titik(k, a1 - 6, dalam - 6, tinggi), titik(k, a0 + 6, dalam - 6, tinggi)],
    peran,
  );
  return [...kotak(k, a0, a1, 0, dalam, 0, tinggi, peran), cekung];
}

export interface ObjekKatalog {
  id: string;
  nama: string;
  /** Kata di teks sheet (indikator, hack, modifikasi) yang menyebut objek ini; dipakai tes dan lembar tinjauan untuk mencari pertanyaan terkait. */
  kata: RegExp;
  gambar: (k: Kerangka, peran?: Peran) => Primitif[];
}

/** Objek yang disebut di sheet tetapi belum dipakai di gambar pertanyaan; dipakai untuk ditinjau dan sebagai bahan pembacaan foto nanti. */
export const KATALOG_OBJEK: readonly ObjekKatalog[] = [
  { id: "kursi-roda", nama: "Kursi roda (acuan skala)", kata: /kursi roda/i, gambar: kursiRoda },
  { id: "kursi", nama: "Kursi", kata: /\bkursi\b(?! (roda|mandi|toilet|shower))/i, gambar: kursi },
  { id: "meja-makan", nama: "Meja makan atau meja kerja besar", kata: /\bmeja\b/i, gambar: mejaMakan },
  { id: "sofa", nama: "Sofa", kata: /furnitur|perabot/i, gambar: sofa },
  { id: "rak-sepatu", nama: "Rak sepatu", kata: /rak sepatu/i, gambar: rakSepatu },
  { id: "dispenser", nama: "Galon dan dispenser", kata: /galon|dispenser/i, gambar: dispenser },
  { id: "kardus", nama: "Kardus", kata: /kardus/i, gambar: kardus },
  { id: "keset", nama: "Keset", kata: /keset/i, gambar: keset },
  { id: "meja-dorong", nama: "Meja dorong", kata: /meja dorong/i, gambar: mejaDorong },
  { id: "pegboard", nama: "Pegboard", kata: /pegboard/i, gambar: pegboard },
  { id: "tabung-gas", nama: "Tabung gas", kata: /tabung gas/i, gambar: tabungGas },
  { id: "apar", nama: "APAR kecil", kata: /\bapar\b/i, gambar: apar },
  { id: "lampu-meja", nama: "Lampu meja", kata: /\blampu\b|nakas/i, gambar: lampuMeja },
  { id: "bak-mandi", nama: "Bak mandi tembok", kata: /bak mandi/i, gambar: bakMandi },
];
