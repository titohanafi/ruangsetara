// Katalog objek perabot yang disebut di sheet peneliti (indikator, hack, modifikasi) tetapi belum dipakai di gambar pertanyaan mana pun:
// kursi roda (acuan skala), kursi, meja makan, sofa, rak sepatu, galon dan dispenser, kardus, keset, meja dorong, pegboard, tabung gas,
// APAR, lampu meja, dan bak mandi tembok. Tiap objek digambar berpusat di a = 0 dan bersandar di dinding (n = 0).
// Ukuran hanya untuk proporsi (`UKURAN`, perkiraan, tidak ditulis di gambar, dilaporkan ke peneliti). Gambar tidak pernah memuat angka.
import { bukaanDinding, gambarBenda } from "./gambarBenda";
import { tuas } from "./gambarRuang";
import { ekstrusi, footprintOval, keRuang, kotak, poligon, titik, type Kerangka, type Peran, type Primitif } from "./gambarShower";

/** Bagian benda dengan titik pusatnya (a, n, u) di ruang lokal, untuk diurutkan menurut kedalaman. */
export interface Bagian {
  readonly pusat: readonly [number, number, number];
  readonly daftar: Primitif[];
}

/** Bagian berupa kotak; pusatnya titik tengah kotak. */
export function bagKotak(k: Kerangka, a0: number, a1: number, n0: number, n1: number, u0: number, u1: number, peran: Peran): Bagian {
  return { pusat: [(a0 + a1) / 2, (n0 + n1) / 2, (u0 + u1) / 2], daftar: kotak(k, a0, a1, n0, n1, u0, u1, peran) };
}

/** Garis di antara dua titik lokal, sebagai bagian yang diurutkan menurut titik tengahnya. */
export function bagGaris(
  k: Kerangka,
  dari: readonly [number, number, number],
  ke: readonly [number, number, number],
  peran: Peran,
): Bagian {
  return {
    pusat: [(dari[0] + ke[0]) / 2, (dari[1] + ke[1]) / 2, (dari[2] + ke[2]) / 2],
    daftar: [{ jenis: "garis", dari: titik(k, ...dari), ke: titik(k, ...ke), gaya: "tegas", peran }],
  };
}

/** Lengan penarik berupa pita tebal 3 satuan (bukan garis), dari titik atas (n, u) ke titik bawah (n, u) pada sisi `a`. */
export function bagLengan(k: Kerangka, a: number, dari: readonly [number, number], ke: readonly [number, number], peran: Peran): Bagian {
  const t = (da: number, [n, u]: readonly [number, number]) => titik(k, a + da, n, u);
  return {
    pusat: [a, (dari[0] + ke[0]) / 2, (dari[1] + ke[1]) / 2],
    daftar: [poligon("kiri", [t(-1.5, dari), t(1.5, dari), t(1.5, ke), t(-1.5, ke)], peran)],
  };
}

/**
 * Urutan gambar (algoritma pelukis): bagian yang lebih jauh dari kamera digambar lebih dulu, yang lebih dekat sesudahnya,
 * sehingga kaki dan panel sisi dekat kamera menutupi isi di belakangnya, bukan sebaliknya. Sama jauh: yang lebih rendah dulu.
 */
export function urutkanKedalaman(k: Kerangka, bagian: readonly Bagian[]): Primitif[] {
  const lihat = k.lihat ?? { x: 1, y: 1 };
  const kunci = (b: Bagian): [number, number] => {
    const [x, y] = keRuang(k, b.pusat[0] * k.skala, b.pusat[1] * k.skala);
    return [x * lihat.x + y * lihat.y, b.pusat[2]];
  };
  return bagian
    .map((b, i) => ({ b, i, k: kunci(b) }))
    .sort((p, q) => p.k[0] - q.k[0] || p.k[1] - q.k[1] || p.i - q.i)
    .flatMap((p) => p.b.daftar);
}

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
  kabinetAtas: { lebar: 80, dalam: 32, tinggi: 60, dasar: 140 },
  rakPiring: { lebar: 60, dalam: 28, dasar: 120 },
  microwave: { lebar: 46, dalam: 34, tinggi: 28 },
  riceCooker: { jari: 14, tinggi: 24 },
  komporInduksi: { lebar: 40, dalam: 34, tinggi: 6 },
  mejaTamu: { lebar: 100, dalam: 50, tinggi: 40 },
  rakTv: { lebar: 120, dalam: 40, tinggi: 45, lebarTv: 100, tinggiTv: 60 },
  rakBuku: { lebar: 80, dalam: 30, tinggi: 180 },
  tangga: { lebar: 90, dalam: 28, tinggiAnak: 18, jumlah: 3 },
  tanamanPot: { jariPot: 14, tinggiPot: 28, jariDaun: 24, tinggiDaun: 40 },
  kipas: { jariDasar: 18, tinggiTiang: 90, jariKepala: 22 },
  cerminBerdiri: { lebar: 50, tinggi: 150 },
  mejaBelajar: { lebar: 110, dalam: 55, tinggi: 75 },
  ranjangMedis: { lebar: 95, panjang: 200, tinggiKasur: 55 },
  waterHeater: { jari: 18, tinggi: 60, dasar: 150 },
  keranjangCucian: { jari: 20, tinggi: 50 },
  tempatSampah: { jari: 14, tinggi: 38 },
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

/** Kursi makan: dudukan, sandaran, empat kaki. `balik` = sandaran di sisi jauh dari dinding (menghadap dinding, mis. di meja belajar). */
export function kursi(k: Kerangka, peran: Peran = "netral", balik = false): Primitif[] {
  const { lebar, dalam, tinggiDudukan, tinggiSandaran } = UKURAN.kursi;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  const kaki = (a: number, n: number) => kotak(k, a, a + 4, n, n + 4, 0, tinggiDudukan - 3, peran);
  return [
    ...kaki(a0 + 1, 2),
    ...kaki(a1 - 5, 2),
    ...kaki(a0 + 1, dalam - 6),
    ...kaki(a1 - 5, dalam - 6),
    ...kotak(k, a0, a1, 0, dalam, tinggiDudukan - 3, tinggiDudukan, peran),
    ...(balik
      ? kotak(k, a0, a1, dalam - 4, dalam, tinggiDudukan, tinggiSandaran, peran)
      : kotak(k, a0, a1, 0, 4, tinggiDudukan, tinggiSandaran, peran)),
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
  const kaki = (a: number, n: number): Bagian[] => [
    bagKotak(k, a, a + 3, n, n + 3, 6, tinggi - 3, peran),
    bagKotak(k, a - 1, a + 4, n - 1, n + 4, 0, 6, peran),
  ];
  return urutkanKedalaman(k, [
    ...kaki(a0 + 1, 2),
    ...kaki(a1 - 4, 2),
    ...kaki(a0 + 1, dalam - 5),
    ...kaki(a1 - 4, dalam - 5),
    bagKotak(k, a0, a1, 0, dalam, tinggi - 3, tinggi, peran),
    bagKotak(k, a0, a1, 0, dalam, 24, 27, peran),
    bagKotak(k, a0 - 6, a0 + 1, 4, dalam - 4, tinggi, tinggi + 3, peran),
  ]);
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
export function lampuMeja(k: Kerangka, peran: Peran = "netral", u0 = 0): Primitif[] {
  const { jariDasar, tinggi, jariKap } = UKURAN.lampuMeja;
  return [
    ...ekstrusi(k, footprintOval(0, jariKap, jariDasar, jariDasar, 20), u0, u0 + 3, peran, true),
    ...kotak(k, -1, 1, jariKap - 1, jariKap + 1, u0 + 3, u0 + tinggi - 12, peran),
    ...ekstrusi(k, footprintOval(0, jariKap, jariKap, jariKap, 24), u0 + tinggi - 14, u0 + tinggi, peran, true),
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

/** Kabinet dinding (di atas meja dapur): kotak tergantung dengan dua pintu. */
export function kabinetAtas(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam, tinggi, dasar } = UKURAN.kabinetAtas;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  return [
    ...kotak(k, a0, a1, 0, dalam, dasar, dasar + tinggi, peran),
    { jenis: "garis", dari: titik(k, 0, dalam, dasar + 3), ke: titik(k, 0, dalam, dasar + tinggi - 3), gaya: "tegas", peran },
    ...kotak(k, -9, -6, dalam, dalam + 2, dasar + 6, dasar + 22, peran),
    ...kotak(k, 6, 9, dalam, dalam + 2, dasar + 6, dasar + 22, peran),
  ];
}

/** Rak piring dinding: dua rangka tipis dengan piring berdiri. */
export function rakPiring(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam, dasar } = UKURAN.rakPiring;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  const tingkat = [dasar, dasar + 28].flatMap((u) => [
    ...kotak(k, a0, a1, 0, dalam, u, u + 2, peran),
    ...kotak(k, a0, a0 + 2, 0, dalam, u, u + 26, peran),
    ...kotak(k, a1 - 2, a1, 0, dalam, u, u + 26, peran),
    ...[-18, -6, 6, 18].flatMap((a) => kotak(k, a - 1, a + 1, 4, dalam - 4, u + 2, u + 22, peran)),
  ]);
  return tingkat;
}

/** Microwave di atas meja: kotak dengan jendela dan panel kontrol; `u0` = tinggi alas. */
export function microwave(k: Kerangka, peran: Peran = "netral", u0 = 0): Primitif[] {
  const { lebar, dalam, tinggi } = UKURAN.microwave;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  return [
    ...kotak(k, a0, a1, 0, dalam, u0, u0 + tinggi, peran),
    poligon(
      "rongga",
      [
        titik(k, a0 + 4, dalam, u0 + 4),
        titik(k, a1 - 14, dalam, u0 + 4),
        titik(k, a1 - 14, dalam, u0 + tinggi - 4),
        titik(k, a0 + 4, dalam, u0 + tinggi - 4),
      ],
      peran,
    ),
    ...kotak(k, a1 - 10, a1 - 4, dalam, dalam + 1, u0 + 6, u0 + tinggi - 6, peran),
  ];
}

/** Penanak nasi (rice cooker): silinder pendek bertutup dengan pegangan; `u0` = tinggi alas. */
export function riceCooker(k: Kerangka, peran: Peran = "netral", u0 = 0): Primitif[] {
  const { jari, tinggi } = UKURAN.riceCooker;
  return [
    ...ekstrusi(k, footprintOval(0, jari + 2, jari, jari, 24), u0, u0 + tinggi - 6, peran, true),
    ...ekstrusi(k, footprintOval(0, jari + 2, jari - 1, jari - 1, 24), u0 + tinggi - 6, u0 + tinggi, peran, true),
    ...kotak(k, -3, 3, jari + 2 - 2, jari + 2 + 2, u0 + tinggi, u0 + tinggi + 3, peran),
  ];
}

/** Kompor induksi portable: papan datar dengan cincin pemanas dan dua tombol di depan; `u0` = tinggi alas. */
export function komporInduksi(k: Kerangka, peran: Peran = "netral", u0 = 0): Primitif[] {
  const { lebar, dalam, tinggi } = UKURAN.komporInduksi;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  return [
    ...kotak(k, a0, a1, 0, dalam, u0, u0 + tinggi, peran),
    poligon(
      "rongga",
      footprintOval(0, dalam / 2 - 3, 11, 11, 20).map(([a, n]) => titik(k, a, n, u0 + tinggi)),
      peran,
    ),
    ...kotak(k, -8, -4, dalam, dalam + 2, u0 + 1, u0 + 5, peran),
    ...kotak(k, 4, 8, dalam, dalam + 2, u0 + 1, u0 + 5, peran),
  ];
}

/** Meja tamu pendek: papan, kaki, dan rak bawah. */
export function mejaTamu(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam, tinggi } = UKURAN.mejaTamu;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  const kaki = (a: number, n: number) => kotak(k, a, a + 5, n, n + 5, 0, tinggi - 4, peran);
  return [
    ...kaki(a0 + 3, 3),
    ...kaki(a1 - 8, 3),
    ...kaki(a0 + 3, dalam - 8),
    ...kaki(a1 - 8, dalam - 8),
    ...kotak(k, a0 + 3, a1 - 3, 3, dalam - 3, 12, 14, peran),
    ...kotak(k, a0, a1, 0, dalam, tinggi - 4, tinggi, peran),
  ];
}

/** Rak televisi dengan televisi layar datar di atasnya. */
export function tvDanRak(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam, tinggi, lebarTv, tinggiTv } = UKURAN.rakTv;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  return [
    ...kotak(k, a0, a1, 0, dalam, 0, tinggi, peran),
    { jenis: "garis", dari: titik(k, 0, dalam, 3), ke: titik(k, 0, dalam, tinggi - 3), gaya: "tegas", peran },
    ...kotak(k, -14, 14, 6, 20, tinggi, tinggi + 4, peran),
    ...kotak(k, -lebarTv / 2, lebarTv / 2, 8, 14, tinggi + 4, tinggi + 4 + tinggiTv, peran),
  ];
}

/** Rak buku tinggi: dua sisi, lima papan, dan deretan buku. */
export function rakBuku(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam, tinggi } = UKURAN.rakBuku;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  const papan = [0, 1, 2, 3, 4].map((i) => 3 + i * ((tinggi - 6) / 4));
  const buku = papan
    .slice(0, 4)
    .flatMap((u) => [-30, -22, -14, 2, 10, 18].flatMap((a, j) => kotak(k, a, a + 5, 4, dalam - 4, u + 2, u + 20 - (j % 3) * 3, peran)));
  return [
    ...kotak(k, a0, a0 + 3, 0, dalam, 0, tinggi, peran),
    ...kotak(k, a1 - 3, a1, 0, dalam, 0, tinggi, peran),
    ...papan.flatMap((u) => kotak(k, a0, a1, 0, dalam, u, u + 3, peran)),
    ...buku,
  ];
}

/** Tangga tiga anak (perbedaan level di teras atau antarruang). */
export function tangga(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam, tinggiAnak, jumlah } = UKURAN.tangga;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  return Array.from({ length: jumlah }, (_, i) => kotak(k, a0, a1, i * dalam, (i + 1) * dalam, 0, (jumlah - i) * tinggiAnak, peran)).flat();
}

/** Tanaman dalam pot: pot silinder dan tajuk daun. */
export function tanamanPot(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { jariPot, tinggiPot, jariDaun, tinggiDaun } = UKURAN.tanamanPot;
  return [
    ...ekstrusi(k, footprintOval(0, jariDaun, jariPot, jariPot, 24), 0, tinggiPot, peran, true),
    ...kotak(k, -2, 2, jariDaun - 2, jariDaun + 2, tinggiPot, tinggiPot + 14, peran),
    ...ekstrusi(k, footprintOval(0, jariDaun, jariDaun, jariDaun, 24), tinggiPot + 14, tinggiPot + 14 + tinggiDaun, peran, true),
  ];
}

/** Kipas angin berdiri: alas, tiang, dan kepala kipas bersangkar. */
export function kipas(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { jariDasar, tinggiTiang, jariKepala } = UKURAN.kipas;
  return [
    ...ekstrusi(k, footprintOval(0, jariDasar + 4, jariDasar, jariDasar, 24), 0, 4, peran, true),
    ...kotak(k, -2, 2, jariDasar + 2, jariDasar + 6, 4, tinggiTiang, peran),
    ...cakram(k, 0, jariDasar + 8, tinggiTiang + jariKepala - 4, jariKepala, peran),
  ];
}

/** Cermin berdiri bersandar pada dinding: bingkai tipis di atas dua kaki. */
export function cerminBerdiri(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, tinggi } = UKURAN.cerminBerdiri;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  return [
    ...kotak(k, a0, a1, 6, 9, 10, 10 + tinggi, peran),
    poligon(
      "rongga",
      [titik(k, a0 + 4, 9, 14), titik(k, a1 - 4, 9, 14), titik(k, a1 - 4, 9, 6 + tinggi), titik(k, a0 + 4, 9, 6 + tinggi)],
      peran,
    ),
    ...kotak(k, a0 + 4, a0 + 10, 0, 18, 0, 10, peran),
    ...kotak(k, a1 - 10, a1 - 4, 0, 18, 0, 10, peran),
  ];
}

/** Meja belajar atau meja rias: papan, dua kaki, dan laci di sisi kanan. */
export function mejaBelajar(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam, tinggi } = UKURAN.mejaBelajar;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  return [
    ...kotak(k, a0, a0 + 5, 2, dalam - 2, 0, tinggi - 3, peran),
    ...kotak(k, a1 - 38, a1, 0, dalam, 0, tinggi - 3, peran),
    { jenis: "garis", dari: titik(k, a1 - 38, dalam, 40), ke: titik(k, a1, dalam, 40), gaya: "tegas", peran },
    ...kotak(k, a1 - 24, a1 - 14, dalam, dalam + 2, 56, 59, peran),
    ...kotak(k, a1 - 24, a1 - 14, dalam, dalam + 2, 20, 23, peran),
    ...kotak(k, a0, a1, 0, dalam, tinggi - 3, tinggi, peran),
  ];
}

/** Ranjang perawatan yang tingginya bisa diatur: rangka dengan roda, kasur dua bagian, dan pagar samping. */
export function ranjangMedis(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, panjang, tinggiKasur } = UKURAN.ranjangMedis;
  const [a0, a1] = [-lebar / 2, lebar / 2];
  const roda = (a: number, n: number) => kotak(k, a, a + 5, n, n + 5, 0, 8, peran);
  return [
    ...roda(a0 + 2, 4),
    ...roda(a1 - 7, 4),
    ...roda(a0 + 2, panjang - 9),
    ...roda(a1 - 7, panjang - 9),
    ...kotak(k, a0 + 8, a1 - 8, 10, panjang - 10, 8, tinggiKasur - 14, peran),
    ...kotak(k, a0, a1, 0, panjang, tinggiKasur - 14, tinggiKasur, peran),
    ...kotak(k, a0, a1, 0, 5, tinggiKasur, tinggiKasur + 45, peran),
    ...kotak(k, a0, a1, panjang - 5, panjang, tinggiKasur, tinggiKasur + 25, peran),
    ...kotak(k, a1 - 2, a1, 20, 110, tinggiKasur, tinggiKasur + 24, peran),
    ...kotak(k, a1 + 2, a1 + 10, panjang - 30, panjang - 18, tinggiKasur - 24, tinggiKasur - 14, peran),
  ];
}

/** Pemanas air (water heater) di dinding: tangki silinder dengan dua pipa ke bawah. */
export function waterHeater(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { jari, tinggi, dasar } = UKURAN.waterHeater;
  // Pipa digambar lebih dulu: ujung atasnya masuk ke dasar tangki, jadi tangki yang menutupinya.
  return [
    ...kotak(k, -8, -5, jari - 2, jari + 1, dasar - 30, dasar, peran),
    ...kotak(k, 5, 8, jari - 2, jari + 1, dasar - 30, dasar, peran),
    ...ekstrusi(k, footprintOval(0, jari + 2, jari, jari, 28), dasar, dasar + tinggi, peran, true),
  ];
}

/** Keranjang cucian bulat bertutup. */
export function keranjangCucian(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { jari, tinggi } = UKURAN.keranjangCucian;
  return [
    ...ekstrusi(k, footprintOval(0, jari + 2, jari, jari, 24), 0, tinggi - 4, peran, true),
    ...ekstrusi(k, footprintOval(0, jari + 2, jari + 2, jari + 2, 24), tinggi - 4, tinggi, peran, true),
  ];
}

/** Tempat sampah bulat dengan tutup. */
export function tempatSampah(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { jari, tinggi } = UKURAN.tempatSampah;
  return [
    ...ekstrusi(k, footprintOval(0, jari + 2, jari, jari, 24), 0, tinggi - 3, peran, true),
    ...ekstrusi(k, footprintOval(0, jari + 2, jari + 1.5, jari + 1.5, 24), tinggi - 3, tinggi, peran, true),
  ];
}

// ===== Perabot dan perlengkapan yang tertuang di teks Hack dan Modifikasi sheet (prioritas), per ruang =====

/** Pelat keran di dinding dengan corong; dasar bersama tiga jenis keran. `u0` = tinggi pelat dari lantai. */
function dasarKeran(k: Kerangka, peran: Peran, u0: number): Primitif[] {
  return [
    ...kotak(k, -14, 14, 0, 6, u0, u0 + 8, peran),
    ...kotak(k, -2, 2, 4, 24, u0 + 8, u0 + 11, peran),
    ...kotak(k, -2, 2, 22, 24, u0 + 2, u0 + 8, peran),
  ];
}

/** Keran putar: dua kenop silang di kiri dan kanan corong (sulit dipegang dengan satu tangan lemah, M-07). */
export function keranPutar(k: Kerangka, peran: Peran = "netral", u0 = 95): Primitif[] {
  const kenop = [-11, 11].flatMap((a) => [
    ...kotak(k, a - 1, a + 1, 3, 5, u0 + 8, u0 + 15, peran),
    ...kotak(k, a - 5, a + 5, 3, 5, u0 + 15, u0 + 17, peran),
    ...kotak(k, a - 1, a + 1, 3, 5, u0 + 17, u0 + 21, peran),
  ]);
  return [...dasarKeran(k, peran, u0), ...kenop];
}

/** Keran tuas: satu tuas panjang di atas badan keran (M-06, M-07, K-03). */
export function keranTuas(k: Kerangka, peran: Peran = "netral", u0 = 95): Primitif[] {
  return [
    ...dasarKeran(k, peran, u0),
    ...kotak(k, -4, 4, 2, 9, u0 + 8, u0 + 22, peran),
    ...kotak(k, -1.5, 1.5, 4, 24, u0 + 22, u0 + 25, peran),
  ];
}

/** Keran semprot tarik: leher tinggi, kepala semprot yang bisa ditarik, dan selang (K-03). */
export function keranSemprot(k: Kerangka, peran: Peran = "netral", u0 = 95): Primitif[] {
  const selang: Primitif = {
    jenis: "jalur",
    titik: [titik(k, 0, 10, u0 + 32), titik(k, 6, 12, u0 + 14), titik(k, 0, 8, u0 + 6)],
    gaya: "selang",
    peran,
  };
  return [
    ...kotak(k, -8, 8, 0, 6, u0, u0 + 8, peran),
    ...kotak(k, -2, 2, 3, 7, u0 + 8, u0 + 44, peran),
    ...kotak(k, -3, 3, 5, 24, u0 + 44, u0 + 50, peran),
    ...kotak(k, -3, 3, 20, 24, u0 + 30, u0 + 44, peran),
    selang,
  ];
}

/** Potongan daun pintu (untuk gagang), berpusat di a = 0, tinggi 50 sampai 170. */
const daunPotong = (k: Kerangka, peran: Peran): Primitif[] => kotak(k, -40, 40, 0, 3, 50, 170, peran);

/** Gagang bulat (knob): sulit diputar dengan satu tangan (G-09). */
export function gagangBulat(k: Kerangka, peran: Peran = "netral", daun = true): Primitif[] {
  return [...(daun ? daunPotong(k, peran) : []), ...kotak(k, 27, 29, 3, 7, 99, 101, peran), ...cakram(k, 28, 8, 100, 6, peran, false)];
}

/** Gagang tuas: bisa dioperasikan dengan satu kepalan tangan (B-01, G-09). */
export function gagangTuas(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  return [...daunPotong(k, peran), ...tuas(k, 28, 100, peran === "aksen" ? "aksen" : "netral")];
}

/** Adaptor tuas (lever converter) yang dijepit di atas gagang bulat tanpa mengganti gagang (hack G-09). */
export function adaptorTuas(k: Kerangka, peran: Peran = "netral", daun = true): Primitif[] {
  return [...gagangBulat(k, "netral", daun), ...kotak(k, 23, 33, 5, 10, 94, 106, peran), ...kotak(k, 28, 46, 8, 11, 98, 102, peran)];
}

/** Pegangan tarik di sisi dalam daun pintu, dengan tali, untuk menutup pintu dari kursi roda (hack G-09). */
export function peganganTarik(k: Kerangka, peran: Peran = "netral", daun = true): Primitif[] {
  const tali: Primitif = {
    jenis: "jalur",
    titik: [titik(k, 27, 11, 85), titik(k, 22, 12, 60), titik(k, 27, 12, 40)],
    gaya: "selang",
    peran,
  };
  return [
    ...(daun ? daunPotong(k, "netral") : []),
    ...kotak(k, 25, 28, 3, 9, 84, 87, peran),
    ...kotak(k, 25, 28, 3, 9, 113, 116, peran),
    ...kotak(k, 25, 28, 8, 11, 84, 116, peran),
    tali,
  ];
}

/** Pintu geser masuk dinding (pocket door): daun separuh terbuka, separuhnya tersembunyi di dalam dinding (garis tipis). */
export function pintuPocket(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  return [
    ...bukaanDinding(k),
    ...gambarBenda("pintu_tanpa_daun", k, "netral"),
    ...kotak(k, 0, 45, -5, -2, 2, 208, peran),
    ...kotak(k, 45, 135, -5, -2, 2, 208, "hantu"),
  ];
}

/** Pengganjal pintu (baji) di lantai, menahan daun pintu terbuka penuh (hack G-03). */
export function pengganjalPintu(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const [a0, a1, n1, h] = [-5, 5, 18, 5];
  return [
    poligon("kiri", [titik(k, a0, 0, h), titik(k, a0, n1, 0), titik(k, a0, 0, 0)], peran),
    poligon("atas", [titik(k, a0, 0, h), titik(k, a1, 0, h), titik(k, a1, n1, 0), titik(k, a0, n1, 0)], peran),
  ];
}

/** Gantungan di balik pintu: batang di atas daun pintu dengan pengait (hack B-06). */
export function gantunganBalikPintu(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const pengait = [-24, -8, 8, 24].flatMap((a) => kotak(k, a - 1.5, a + 1.5, 4, 10, 140, 168, peran));
  return [...daunPotong(k, "netral"), ...kotak(k, -30, 30, -1, 6, 168, 174, peran), ...pengait];
}

/** Kursi shower-commode beroda: dudukan berlubang, sandaran, sandaran lengan, dan empat roda kecil (M-10). */
export function kursiCommode(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const roda = [-18, 18].flatMap((a) => [4, 44].flatMap((n) => cakram(k, a, n, 6, 6, peran, false)));
  const kaki = [-20, 18].flatMap((a) => [6, 40].flatMap((n) => kotak(k, a, a + 3, n, n + 3, 10, 50, peran)));
  return [
    ...kaki,
    ...roda,
    ...kotak(k, -22, 22, 4, 46, 50, 54, peran),
    poligon(
      "rongga",
      footprintOval(0, 26, 10, 10, 20).map(([a, n]) => titik(k, a, n, 54)),
      peran,
    ),
    ...kotak(k, -22, 22, 4, 8, 54, 92, peran),
    ...kotak(k, -24, -20, 8, 46, 70, 73, peran),
    ...kotak(k, 20, 24, 8, 46, 70, 73, peran),
  ];
}

/** Bangku rendah (stool) setinggi jangkauan, dipakai menaruh ember atau barang (hack M-08). */
export function bangku(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const kaki = [-18, 15].flatMap((a) => [6, 32].flatMap((n) => kotak(k, a, a + 3, n, n + 3, 0, 42, peran)));
  return [...kaki, ...kotak(k, -20, 20, 4, 38, 42, 46, peran)];
}

/** Baskom plastik: silinder dangkal berongga, dipakai mencuci bila wastafel tidak bisa diakses (hack M-06, K-03). */
export function baskom(k: Kerangka, peran: Peran = "netral", u0 = 0): Primitif[] {
  return [
    ...ekstrusi(k, footprintOval(0, 24, 22, 22, 28), u0, u0 + 14, peran, true),
    poligon(
      "rongga",
      footprintOval(0, 24, 18, 18, 28).map(([a, n]) => titik(k, a, n, u0 + 14)),
      peran,
    ),
  ];
}

/**
 * Rak tarik turun (K-05), mengikuti produk rak dapur tarik turun: kabinet dinding dengan pintu terangkat ke atas. Rak dua
 * tingkat berpelat samping yang semula di dalam kabinet (garis putus) ditarik turun ke depan lewat dua pasang lengan sejajar
 * (jajaran genjang) sampai setinggi jangkauan duduk. Barang di atas rak hanya balok polos.
 */
export function rakTarikTurun(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const lengan = [-35.5, 35.5].flatMap((a) => [bagLengan(k, a, [8, 168], [26, 108], peran), bagLengan(k, a, [8, 148], [26, 88], peran)]);
  const tingkat = [72, 94].flatMap((u) => [
    bagKotak(k, -33, 33, 16, 46, u, u + 2, peran),
    ...[-18, 0, 18].map((a) => bagKotak(k, a - 4, a + 4, 24, 36, u + 2, u + 10, peran)),
  ]);
  return [
    // Lengan diurutkan bersama rangka: panel sisi yang dekat kamera menutupi lengan yang ada di dalam kabinet.
    ...urutkanKedalaman(k, [
      ...lengan,
      bagKotak(k, -40, 40, 0, 2, 140, 200, "netral"),
      bagKotak(k, -40, -37, 0, 32, 140, 200, "netral"),
      bagKotak(k, 37, 40, 0, 32, 140, 200, "netral"),
      bagKotak(k, -40, 40, 0, 32, 197, 200, "netral"),
    ]),
    // Pintu kabinet terangkat ke atas (engsel di tepi atas depan).
    poligon("atas", [titik(k, -40, 32, 200), titik(k, 40, 32, 200), titik(k, 40, 52, 236), titik(k, -40, 52, 236)], "netral"),
    // Posisi semula rak di dalam kabinet, putus-putus.
    ...kotak(k, -30, 30, 4, 28, 152, 194, "hantu"),
    // Bagian yang ditarik turun, digambar sesudah rangka.
    ...urutkanKedalaman(k, [bagKotak(k, -36, -33, 16, 46, 70, 108, peran), bagKotak(k, 33, 36, 16, 46, 70, 108, peran), ...tingkat]),
  ];
}

/**
 * Keranjang tarik (K-05), mengikuti foto acuan pemilik: kabinet bawah yang isinya bisa ditarik keluar penuh. Satu bagian
 * kabinet terbuka; unit isi (muka bergagang, keranjang, dan barang) ditarik keluar bersama mukanya. Bagian lain kabinet
 * tertutup. Barang hanya balok polos.
 */
export function keranjangTarik(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const maju = 38;
  const f = 56 + maju;
  return [
    ...urutkanKedalaman(k, [
      bagKotak(k, -35, -3, 0, 55, 0, 80, "netral"),
      bagKotak(k, -3, 35, 0, 2, 0, 80, "netral"),
      bagKotak(k, 32, 35, 0, 55, 0, 80, "netral"),
      bagKotak(k, -3, 32, 0, 55, 0, 3, "netral"),
      bagKotak(k, -35, 35, 0, 58, 80, 84, "netral"),
    ]),
    // Garis sambungan dan gagang pada muka kabinet yang tertutup.
    ...kotak(k, -25, -13, 55, 58, 62, 65, "netral"),
    // Unit isi yang ditarik keluar: keranjang terbuka di belakang muka bergagang.
    ...urutkanKedalaman(k, [
      bagKotak(k, 0, 30, f - 52, f - 2, 8, 10, peran),
      bagKotak(k, 0, 2, f - 52, f - 2, 10, 46, peran),
      bagKotak(k, 28, 30, f - 52, f - 2, 10, 46, peran),
      bagKotak(k, 0, 30, f - 52, f - 50, 10, 46, peran),
      bagKotak(k, 4, 14, f - 40, f - 28, 10, 26, peran),
      bagKotak(k, 16, 26, f - 24, f - 12, 10, 22, peran),
      bagKotak(k, -1, 31, f - 2, f, 6, 70, peran),
      bagKotak(k, 9, 21, f, f + 3, 58, 61, peran),
    ]),
  ];
}

/** Rak putar (lazy susan): dua piringan bertingkat pada satu tiang, dengan beberapa stoples (K-05). */
export function rakPutar(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const stoples = [-12, 10].flatMap((a) => ekstrusi(k, footprintOval(a, 27, 6, 6, 14), 12, 26, peran, true));
  // Tiang dipecah: bagian bawah di balik piringan atas, bagian atas digambar sesudah piringan supaya tampak berdiri di atasnya.
  return [
    ...kotak(k, -2, 2, 25, 29, 0, 44, peran),
    ...ekstrusi(k, footprintOval(0, 27, 24, 24, 28), 10, 13, peran, true),
    ...stoples,
    ...ekstrusi(k, footprintOval(0, 27, 24, 24, 28), 44, 47, peran, true),
    ...kotak(k, -2, 2, 25, 29, 47, 72, peran),
  ];
}

/**
 * Gantungan tarik turun (alternatif B-06): batang gantungan di dalam lemari (garis putus, setinggi gantungan standar) ditarik
 * turun ke depan lewat dua pasang lengan sejajar sampai setinggi jangkauan duduk, dengan pakaian tergantung di bawahnya.
 */
export function gantunganTarikTurun(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const lengan = [-35.5, 35.5].flatMap((a) => [bagLengan(k, a, [8, 168], [40, 108], peran), bagLengan(k, a, [8, 148], [40, 88], peran)]);
  return [
    // Lengan diurutkan bersama rangka: panel sisi yang dekat kamera menutupi lengan yang ada di dalam kabinet.
    ...urutkanKedalaman(k, [
      ...lengan,
      bagKotak(k, -40, 40, 0, 2, 140, 200, "netral"),
      bagKotak(k, -40, -37, 0, 55, 140, 200, "netral"),
      bagKotak(k, 37, 40, 0, 55, 140, 200, "netral"),
      bagKotak(k, -40, 40, 0, 55, 197, 200, "netral"),
    ]),
    // Posisi semula batang di dalam lemari, putus-putus.
    ...kotak(k, -33, 33, 26, 29, 150, 153, "hantu"),
    ...urutkanKedalaman(k, [
      bagKotak(k, -36, -33, 34, 46, 80, 110, peran),
      bagKotak(k, 33, 36, 34, 46, 80, 110, peran),
      bagKotak(k, -33, 33, 38, 41, 103, 106, peran),
      ...[-21, -7, 7, 21].map((a) => bagKotak(k, a - 2, a + 2, 32, 48, 48, 106, peran)),
    ]),
  ];
}

/** Papan tarik di bawah meja: papan kerja yang ditarik keluar dari bawah papan meja (alternatif K-02). */
export function papanTarik(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  return [
    ...urutkanKedalaman(k, [
      bagKotak(k, -45, 45, 0, 2, 40, 86, "netral"),
      bagKotak(k, -45, -42, 0, 60, 0, 86, "netral"),
      bagKotak(k, 42, 45, 0, 60, 0, 86, "netral"),
      bagKotak(k, -45, 45, 0, 60, 86, 90, "netral"),
    ]),
    // Posisi semula papan di bawah papan meja, putus-putus.
    ...kotak(k, -38, 38, 4, 58, 72, 75, "hantu"),
    // Bagian yang ditarik keluar digambar sesudah rangka: berada di depan dan di dalam rangka.
    ...urutkanKedalaman(k, [
      bagKotak(k, -42, -40, 0, 90, 70, 72, peran),
      bagKotak(k, 40, 42, 0, 90, 70, 72, peran),
      bagKotak(k, -38, 38, 40, 94, 72, 75, peran),
    ]),
  ];
}

/** Lampu malam dengan sensor gerak: lampu kecil di dinding dekat lantai dengan kubah sensor dan sorot ke jalur (B-10). */
export function lampuSensor(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const sorot = [-10, 0, 10].map((a): Primitif => ({
    jenis: "garis",
    dari: titik(k, a * 0.4, 5, 30),
    ke: titik(k, a * 2.5, 60, 0),
    gaya: "putus",
    peran,
  }));
  return [
    ...kotak(k, -7, 7, 0, 5, 24, 40, peran),
    poligon(
      "rongga",
      footprintOval(0, 5, 4, 3, 14).map(([a, n]) => titik(k, a, n, 30)),
      peran,
    ),
    ...sorot,
  ];
}

/** Ramp portable dari karet atau aluminium untuk ambang dan undakan rendah: baji bergaris tekstur (hack K-01, B-01, G-04). */
export function rampPortable(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const [a0, a1, n1, h] = [-40, 40, 40, 6];
  const alur = [10, 20, 30].map((n): Primitif => ({
    jenis: "garis",
    dari: titik(k, a0 + 3, n, h * (1 - n / n1)),
    ke: titik(k, a1 - 3, n, h * (1 - n / n1)),
    gaya: "tegas",
    peran,
  }));
  return [
    poligon("kiri", [titik(k, a0, 0, h), titik(k, a0, n1, 0), titik(k, a0, 0, 0)], peran),
    poligon("atas", [titik(k, a0, 0, h), titik(k, a1, 0, h), titik(k, a1, n1, 0), titik(k, a0, n1, 0)], peran),
    ...alur,
  ];
}

// ===== Alat bantu kecil dan perlengkapan yang disebut di Hack dan Modifikasi sheet =====

/** Meja kecil sebagai alas untuk benda kecil: papan 70 x 50 dengan empat kaki, setinggi 80 cm. */
export function mejaKecil(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const kaki = (a: number, n: number) => kotak(k, a, a + 4, n, n + 4, 0, 76, peran);
  return [...kaki(-33, 3), ...kaki(29, 3), ...kaki(-33, 43), ...kaki(29, 43), ...kotak(k, -35, 35, 0, 50, 76, 80, peran)];
}
const ATAS_MEJA = 80;

/** Penjepit (reacher): batang panjang dengan pegangan dan dua rahang di ujung, bersandar tegak (hack G-08, K-05, B-06). */
export function penjepit(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  return [
    ...kotak(k, -1, 1, 10, 12, 4, 86, peran),
    ...kotak(k, -3, 3, 8, 14, 86, 98, peran),
    ...kotak(k, -4, -1, 10, 12, 0, 10, peran),
    ...kotak(k, 1, 4, 10, 12, 0, 10, peran),
    ...kotak(k, -5, -3, 14, 18, 88, 92, peran),
  ];
}

/** Lap tray di pangkuan kursi roda: papan berpinggir tinggi di atas dudukan (hack K-02, K-08). */
export function lapTray(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const bawah = UKURAN.kursiRoda.tinggiDudukan + 22;
  return [
    ...kursiRoda(k, "netral"),
    ...kotak(k, -8, 26, 8, 44, bawah, bawah + 2, peran),
    ...kotak(k, -8, 26, 8, 10, bawah + 2, bawah + 6, peran),
    ...kotak(k, -8, 26, 42, 44, bawah + 2, bawah + 6, peran),
    ...kotak(k, 24, 26, 10, 42, bawah + 2, bawah + 6, peran),
  ];
}

/** Tempat gelas yang dijepit di sandaran lengan kursi roda (hack K-08). */
export function tempatGelas(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const n1 = 6 + UKURAN.kursiRoda.dalam;
  return [
    ...kursiRoda(k, "netral"),
    ...kotak(k, 4, 8, n1 - 2, n1 + 10, 62, 66, peran),
    ...ekstrusi(k, footprintOval(8, n1 + 8, 6, 6, 18), 66, 70, peran, true),
    ...ekstrusi(k, footprintOval(8, n1 + 8, 3.5, 3.5, 14), 70, 88, peran, true),
  ];
}

/** Talenan di atas meja kecil, dengan pegangan dan alas anti-slip (hack K-02). */
export function talenan(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  return [
    ...mejaKecil(k, "netral"),
    ...kotak(k, -18, 18, 12, 36, ATAS_MEJA, ATAS_MEJA + 2, peran),
    ...kotak(k, 18, 28, 20, 28, ATAS_MEJA, ATAS_MEJA + 2, peran),
  ];
}

/** Pisau di atas meja kecil: bilah tipis dan gagang (simpan di zona jangkauan yang aman, hack K-08). */
export function pisau(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  return [
    ...mejaKecil(k, "netral"),
    ...kotak(k, -14, 8, 22, 25, ATAS_MEJA, ATAS_MEJA + 1, peran),
    ...kotak(k, 8, 20, 21.5, 25.5, ATAS_MEJA, ATAS_MEJA + 3, peran),
  ];
}

/** Panci bertutup kaca di atas meja kecil (hack K-04). */
export function panci(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  return [
    ...mejaKecil(k, "netral"),
    ...ekstrusi(k, footprintOval(0, 24, 16, 16, 24), ATAS_MEJA, ATAS_MEJA + 14, peran, true),
    ...ekstrusi(k, footprintOval(0, 24, 17, 17, 24), ATAS_MEJA + 14, ATAS_MEJA + 16, peran, true),
    ...kotak(k, -3, 3, 22, 26, ATAS_MEJA + 16, ATAS_MEJA + 19, peran),
    ...kotak(k, -24, -16, 22, 26, ATAS_MEJA + 8, ATAS_MEJA + 10, peran),
    ...kotak(k, 16, 24, 22, 26, ATAS_MEJA + 8, ATAS_MEJA + 10, peran),
  ];
}

/** Gelas di atas meja kecil (K-08). */
export function gelas(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  return [...mejaKecil(k, "netral"), ...ekstrusi(k, footprintOval(0, 24, 4, 4, 14), ATAS_MEJA, ATAS_MEJA + 11, peran, true)];
}

/** Ponsel di atas meja kecil (diletakkan di nakas, B-07, B-10). */
export function ponsel(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  return [
    ...mejaKecil(k, "netral"),
    ...kotak(k, -4, 4, 18, 32, ATAS_MEJA, ATAS_MEJA + 1, peran),
    poligon(
      "rongga",
      [titik(k, -3, 20, ATAS_MEJA + 1), titik(k, 3, 20, ATAS_MEJA + 1), titik(k, 3, 29, ATAS_MEJA + 1), titik(k, -3, 29, ATAS_MEJA + 1)],
      peran,
    ),
  ];
}

/** Senter di atas meja kecil (disimpan di nakas, B-10). */
export function senter(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  return [
    ...mejaKecil(k, "netral"),
    ...kotak(k, -12, 8, 23, 27, ATAS_MEJA, ATAS_MEJA + 4, peran),
    ...kotak(k, 8, 14, 22, 28, ATAS_MEJA, ATAS_MEJA + 6, peran),
  ];
}

/** Remote untuk lampu atau stopkontak, di atas meja kecil (hack B-08, G-08). */
export function remote(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const tombol = [0, 1, 2].map((i) =>
    poligon(
      "rongga",
      [
        titik(k, -2, 20 + i * 4, ATAS_MEJA + 1.5),
        titik(k, 2, 20 + i * 4, ATAS_MEJA + 1.5),
        titik(k, 2, 22 + i * 4, ATAS_MEJA + 1.5),
        titik(k, -2, 22 + i * 4, ATAS_MEJA + 1.5),
      ],
      peran,
    ),
  );
  return [...mejaKecil(k, "netral"), ...kotak(k, -3, 3, 18, 34, ATAS_MEJA, ATAS_MEJA + 1.5, peran), ...tombol];
}

/** Smart plug: colokan pintar di stopkontak dinding dengan lampu indikator (hack B-08, G-08). */
export function smartPlug(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  return [
    ...kotak(k, -6, 6, 0, 2, 40, 52, "netral"),
    ...kotak(k, -5, 5, 2, 9, 41, 51, peran),
    ...kotak(k, -1.5, 1.5, 9, 10, 44, 47, peran),
  ];
}

/** Klip kabel di dinding: kabel yang dirapikan sepanjang dinding dengan tiga klip (hack B-08, K-08). */
export function klipKabel(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const kabel: Primitif = {
    jenis: "garisPoli",
    titik: [titik(k, -36, 3, 30), titik(k, -12, 3, 34), titik(k, 12, 3, 28), titik(k, 36, 3, 32)],
    peran,
  };
  return [kabel, ...[-24, 0, 24].flatMap((a) => kotak(k, a - 2.5, a + 2.5, 0, 4, 26, 36, peran))];
}

/** Pengatur kabel (cable organizer): kotak berlekuk untuk kabel pengisi daya (hack B-07). */
export function pengaturKabel(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  return [
    ...mejaKecil(k, "netral"),
    ...kotak(k, -14, 14, 18, 32, ATAS_MEJA, ATAS_MEJA + 5, peran),
    ...[-8, 0, 8].map((a) =>
      poligon(
        "rongga",
        [
          titik(k, a - 2, 22, ATAS_MEJA + 5),
          titik(k, a + 2, 22, ATAS_MEJA + 5),
          titik(k, a + 2, 32, ATAS_MEJA + 5),
          titik(k, a - 2, 32, ATAS_MEJA + 5),
        ],
        peran,
      ),
    ),
  ];
}

/** Stiker atau keset anti-slip di lantai area basah: lima strip bertekstur sejajar (hack G-05, M-09). */
export function stikerAntiSlip(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  return [0, 1, 2, 3, 4].flatMap((i) => kotak(k, -28, 28, 4 + i * 9, 9 + i * 9, 0, 0.8, peran));
}

/** Selotip karpet: karpet kecil dengan pita perekat di tepi dan gulungan selotip di sampingnya (hack G-05). */
export function selotipKarpet(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  return [
    ...kotak(k, -35, 35, 0, 50, 0, 1.5, "netral"),
    ...kotak(k, -35, 35, 0, 4, 1.5, 2, peran),
    ...kotak(k, -35, 35, 46, 50, 1.5, 2, peran),
    ...kotak(k, -35, -31, 4, 46, 1.5, 2, peran),
    ...ekstrusi(k, footprintOval(48, 25, 8, 8, 18), 0, 5, peran, true),
  ];
}

/** Penggeser furnitur (furniture slider): kursi dengan empat bantalan bundar di bawah kakinya (hack G-02, G-07). */
export function penggeserFurnitur(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const { lebar, dalam } = UKURAN.kursi;
  const bantalan = [-lebar / 2 + 3, lebar / 2 - 3].flatMap((a) =>
    [4, dalam - 4].flatMap((n) => ekstrusi(k, footprintOval(a, n, 5, 5, 14), 0, 1.5, peran, true)),
  );
  return [...kursi(k, "netral").map((p) => p), ...bantalan];
}

/** Termostat air panas: kenop bulat bertanda skala pada pelat dinding (modifikasi M-07). */
export function termostat(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  const skala = Array.from({ length: 7 }, (_, i): Primitif => {
    const t = Math.PI * (0.15 + (i / 6) * 0.7);
    return {
      jenis: "garis",
      dari: titik(k, 12 * Math.cos(t), 3.5, 100 + 12 * Math.sin(t)),
      ke: titik(k, 15 * Math.cos(t), 3.5, 100 + 15 * Math.sin(t)),
      gaya: "tegas",
      peran,
    };
  });
  return [...kotak(k, -16, 16, 0, 3, 84, 116, "netral"), ...cakram(k, 0, 4, 100, 9, peran, false), ...skala];
}

/** Sepeda motor parkir dilihat dari samping (menghadap +a): dua roda, rangka, jok, setang, dan lampu depan (penyempit jalur, G-01). */
export function motor(k: Kerangka, peran: Peran = "netral"): Primitif[] {
  return [
    ...cakram(k, -40, 20, 26, 26, peran),
    ...cakram(k, 50, 20, 26, 26, peran),
    ...kotak(k, -40, 50, 17, 23, 30, 36, peran),
    ...kotak(k, -30, 10, 12, 28, 40, 48, peran),
    ...kotak(k, -48, -34, 14, 26, 36, 56, peran),
    ...kotak(k, 40, 44, 14, 26, 36, 80, peran),
    ...kotak(k, 38, 48, 8, 32, 78, 82, peran),
    ...kotak(k, 48, 54, 15, 25, 70, 78, peran),
    ...kotak(k, 4, 24, 14, 26, 14, 38, peran),
  ];
}

export interface ObjekKatalog {
  id: string;
  nama: string;
  /** `sheet` = disebut di teks sheet (indikator, hack, modifikasi); `umum` = perabot lazim di ruang itu tetapi tidak disebut di sheet. */
  sumber: "sheet" | "umum";
  /** Ruang tempat objek ini lazim muncul. */
  ruang: readonly ("kamar-mandi" | "dapur" | "kamar-tidur" | "mobilitas")[];
  /** Kata di teks sheet yang menyebut objek ini (hanya untuk `sheet`); dipakai tes dan lembar tinjauan untuk mencari pertanyaan terkait. */
  kata?: RegExp;
  gambar: (k: Kerangka, peran?: Peran) => Primitif[];
}

/** Objek perabot per ruang. Belum dipakai di gambar pertanyaan; dipakai untuk ditinjau, ruang terisi lengkap, dan bahan pembacaan foto nanti. */
export const KATALOG_OBJEK: readonly ObjekKatalog[] = [
  {
    id: "kursi-roda",
    nama: "Kursi roda (acuan skala)",
    sumber: "sheet",
    ruang: ["kamar-mandi", "dapur", "kamar-tidur", "mobilitas"],
    kata: /kursi roda/i,
    gambar: kursiRoda,
  },
  {
    id: "kursi",
    nama: "Kursi",
    sumber: "sheet",
    ruang: ["dapur", "kamar-tidur", "mobilitas"],
    kata: /\bkursi\b(?! (roda|mandi|toilet|shower))/i,
    gambar: kursi,
  },
  {
    id: "meja-makan",
    nama: "Meja makan atau meja kerja besar",
    sumber: "sheet",
    ruang: ["dapur", "mobilitas"],
    kata: /\bmeja\b/i,
    gambar: mejaMakan,
  },
  { id: "sofa", nama: "Sofa", sumber: "sheet", ruang: ["mobilitas"], kata: /furnitur|perabot/i, gambar: sofa },
  { id: "rak-sepatu", nama: "Rak sepatu", sumber: "sheet", ruang: ["mobilitas", "kamar-tidur"], kata: /rak sepatu/i, gambar: rakSepatu },
  {
    id: "dispenser",
    nama: "Galon dan dispenser",
    sumber: "sheet",
    ruang: ["mobilitas", "dapur"],
    kata: /galon|dispenser/i,
    gambar: dispenser,
  },
  { id: "kardus", nama: "Kardus", sumber: "sheet", ruang: ["mobilitas"], kata: /kardus/i, gambar: kardus },
  { id: "keset", nama: "Keset", sumber: "sheet", ruang: ["mobilitas", "kamar-tidur", "kamar-mandi"], kata: /keset/i, gambar: keset },
  { id: "meja-dorong", nama: "Meja dorong", sumber: "sheet", ruang: ["dapur"], kata: /meja dorong/i, gambar: mejaDorong },
  { id: "pegboard", nama: "Pegboard", sumber: "sheet", ruang: ["dapur"], kata: /pegboard/i, gambar: pegboard },
  { id: "tabung-gas", nama: "Tabung gas", sumber: "sheet", ruang: ["dapur"], kata: /tabung gas/i, gambar: tabungGas },
  { id: "apar", nama: "APAR kecil", sumber: "sheet", ruang: ["dapur"], kata: /\bapar\b/i, gambar: apar },
  { id: "lampu-meja", nama: "Lampu meja", sumber: "sheet", ruang: ["kamar-tidur"], kata: /\blampu\b|nakas/i, gambar: lampuMeja },
  { id: "bak-mandi", nama: "Bak mandi tembok", sumber: "sheet", ruang: ["kamar-mandi"], kata: /bak mandi/i, gambar: bakMandi },
  { id: "kompor-induksi", nama: "Kompor induksi portable", sumber: "sheet", ruang: ["dapur"], kata: /induksi/i, gambar: komporInduksi },
  {
    id: "water-heater",
    nama: "Pemanas air (water heater)",
    sumber: "sheet",
    ruang: ["kamar-mandi"],
    kata: /water heater/i,
    gambar: waterHeater,
  },
  {
    id: "ranjang-medis",
    nama: "Ranjang perawatan yang tingginya bisa diatur",
    sumber: "sheet",
    ruang: ["kamar-tidur"],
    kata: /ranjang yang tingginya bisa diatur/i,
    gambar: ranjangMedis,
  },
  { id: "keran-putar", nama: "Keran putar", sumber: "sheet", ruang: ["kamar-mandi", "dapur"], kata: /keran putar/i, gambar: keranPutar },
  { id: "keran-tuas", nama: "Keran tuas", sumber: "sheet", ruang: ["kamar-mandi", "dapur"], kata: /keran tuas/i, gambar: keranTuas },
  { id: "keran-semprot", nama: "Keran semprot tarik", sumber: "sheet", ruang: ["dapur"], kata: /semprot tarik/i, gambar: keranSemprot },
  {
    id: "gagang-bulat",
    nama: "Gagang pintu bulat (knob)",
    sumber: "sheet",
    ruang: ["kamar-mandi", "dapur", "kamar-tidur", "mobilitas"],
    kata: /gagang bulat/i,
    gambar: gagangBulat,
  },
  {
    id: "gagang-tuas",
    nama: "Gagang pintu tuas",
    sumber: "sheet",
    ruang: ["kamar-mandi", "dapur", "kamar-tidur", "mobilitas"],
    kata: /tipe tuas|tuas atau dorong/i,
    gambar: gagangTuas,
  },
  {
    id: "adaptor-tuas",
    nama: "Adaptor tuas untuk gagang bulat",
    sumber: "sheet",
    ruang: ["mobilitas"],
    kata: /adaptor tuas/i,
    gambar: adaptorTuas,
  },
  {
    id: "pegangan-tarik",
    nama: "Pegangan tarik dan tali di daun pintu",
    sumber: "sheet",
    ruang: ["mobilitas"],
    kata: /pegangan tarik/i,
    gambar: peganganTarik,
  },
  {
    id: "pintu-pocket",
    nama: "Pintu geser masuk dinding (pocket door)",
    sumber: "sheet",
    ruang: ["kamar-mandi"],
    kata: /pocket door/i,
    gambar: pintuPocket,
  },
  { id: "pengganjal-pintu", nama: "Pengganjal pintu", sumber: "sheet", ruang: ["mobilitas"], kata: /pengganjal/i, gambar: pengganjalPintu },
  {
    id: "gantungan-balik-pintu",
    nama: "Gantungan di balik pintu",
    sumber: "sheet",
    ruang: ["kamar-tidur"],
    kata: /gantungan di balik pintu/i,
    gambar: gantunganBalikPintu,
  },
  {
    id: "kursi-commode",
    nama: "Kursi shower-commode beroda",
    sumber: "sheet",
    ruang: ["kamar-mandi"],
    kata: /shower-commode/i,
    gambar: kursiCommode,
  },
  { id: "bangku", nama: "Bangku rendah", sumber: "sheet", ruang: ["kamar-mandi"], kata: /\bbangku\b/i, gambar: bangku },
  { id: "baskom", nama: "Baskom", sumber: "sheet", ruang: ["kamar-mandi", "dapur"], kata: /baskom/i, gambar: baskom },
  { id: "rak-tarik-turun", nama: "Rak tarik turun", sumber: "sheet", ruang: ["dapur"], kata: /rak tarik turun/i, gambar: rakTarikTurun },
  { id: "keranjang-tarik", nama: "Keranjang tarik", sumber: "sheet", ruang: ["dapur"], kata: /keranjang tarik/i, gambar: keranjangTarik },
  { id: "rak-putar", nama: "Rak putar", sumber: "sheet", ruang: ["dapur"], kata: /rak putar/i, gambar: rakPutar },
  {
    id: "gantungan-tarik-turun",
    nama: "Gantungan tarik turun",
    sumber: "sheet",
    ruang: ["kamar-tidur"],
    kata: /gantungan tarik turun/i,
    gambar: gantunganTarikTurun,
  },
  { id: "papan-tarik", nama: "Papan tarik di bawah meja", sumber: "sheet", ruang: ["dapur"], kata: /papan tarik/i, gambar: papanTarik },
  {
    id: "lampu-sensor",
    nama: "Lampu malam sensor gerak",
    sumber: "sheet",
    ruang: ["kamar-tidur"],
    kata: /sensor gerak/i,
    gambar: lampuSensor,
  },
  {
    id: "ramp-portable",
    nama: "Ramp portable (karet atau aluminium)",
    sumber: "sheet",
    ruang: ["dapur", "kamar-tidur", "mobilitas"],
    kata: /ramp[^.]*portable|portable[^.]*ramp/i,
    gambar: rampPortable,
  },
  {
    id: "penjepit",
    nama: "Penjepit (reacher)",
    sumber: "sheet",
    ruang: ["dapur", "kamar-tidur", "mobilitas"],
    kata: /reacher|penjepit/i,
    gambar: penjepit,
  },
  { id: "lap-tray", nama: "Lap tray di pangkuan kursi roda", sumber: "sheet", ruang: ["dapur"], kata: /lap tray/i, gambar: lapTray },
  { id: "tempat-gelas", nama: "Tempat gelas di kursi roda", sumber: "sheet", ruang: ["dapur"], kata: /tempat gelas/i, gambar: tempatGelas },
  { id: "talenan", nama: "Talenan", sumber: "sheet", ruang: ["dapur"], kata: /talenan/i, gambar: talenan },
  { id: "pisau", nama: "Pisau", sumber: "sheet", ruang: ["dapur"], kata: /pisau/i, gambar: pisau },
  { id: "panci", nama: "Panci bertutup kaca", sumber: "sheet", ruang: ["dapur"], kata: /panci/i, gambar: panci },
  { id: "gelas", nama: "Gelas", sumber: "sheet", ruang: ["dapur"], kata: /gelas/i, gambar: gelas },
  { id: "ponsel", nama: "Ponsel", sumber: "sheet", ruang: ["kamar-tidur"], kata: /ponsel/i, gambar: ponsel },
  { id: "senter", nama: "Senter", sumber: "sheet", ruang: ["kamar-tidur"], kata: /senter/i, gambar: senter },
  {
    id: "remote",
    nama: "Remote lampu atau stopkontak",
    sumber: "sheet",
    ruang: ["kamar-tidur", "mobilitas"],
    kata: /remote/i,
    gambar: remote,
  },
  { id: "smart-plug", nama: "Smart plug", sumber: "sheet", ruang: ["kamar-tidur", "mobilitas"], kata: /smart plug/i, gambar: smartPlug },
  { id: "klip-kabel", nama: "Klip kabel di dinding", sumber: "sheet", ruang: ["dapur", "kamar-tidur"], kata: /klip/i, gambar: klipKabel },
  { id: "pengatur-kabel", nama: "Pengatur kabel", sumber: "sheet", ruang: ["kamar-tidur"], kata: /pengatur kabel/i, gambar: pengaturKabel },
  {
    id: "stiker-anti-slip",
    nama: "Stiker atau keset anti-slip",
    sumber: "sheet",
    ruang: ["kamar-mandi", "mobilitas"],
    kata: /stiker/i,
    gambar: stikerAntiSlip,
  },
  {
    id: "selotip-karpet",
    nama: "Karpet dengan selotip karpet",
    sumber: "sheet",
    ruang: ["mobilitas", "kamar-tidur"],
    kata: /selotip karpet/i,
    gambar: selotipKarpet,
  },
  {
    id: "penggeser-furnitur",
    nama: "Penggeser furnitur (furniture slider)",
    sumber: "sheet",
    ruang: ["mobilitas"],
    kata: /furniture slider|penggeser furnitur/i,
    gambar: penggeserFurnitur,
  },
  { id: "termostat", nama: "Kontrol suhu termostatik", sumber: "sheet", ruang: ["kamar-mandi"], kata: /termostatik/i, gambar: termostat },
  { id: "motor", nama: "Sepeda motor parkir", sumber: "sheet", ruang: ["mobilitas"], kata: /\bmotor\b/i, gambar: motor },
  { id: "kabinet-atas", nama: "Kabinet dinding", sumber: "umum", ruang: ["dapur"], gambar: kabinetAtas },
  { id: "rak-piring", nama: "Rak piring dinding", sumber: "umum", ruang: ["dapur"], gambar: rakPiring },
  { id: "microwave", nama: "Microwave", sumber: "umum", ruang: ["dapur"], gambar: microwave },
  { id: "rice-cooker", nama: "Penanak nasi", sumber: "umum", ruang: ["dapur"], gambar: riceCooker },
  { id: "meja-belajar", nama: "Meja belajar atau meja rias", sumber: "umum", ruang: ["kamar-tidur"], gambar: mejaBelajar },
  { id: "cermin-berdiri", nama: "Cermin berdiri", sumber: "umum", ruang: ["kamar-tidur"], gambar: cerminBerdiri },
  { id: "kipas", nama: "Kipas angin berdiri", sumber: "umum", ruang: ["kamar-tidur", "mobilitas"], gambar: kipas },
  { id: "meja-tamu", nama: "Meja tamu", sumber: "umum", ruang: ["mobilitas"], gambar: mejaTamu },
  { id: "tv-rak", nama: "Televisi dan rak TV", sumber: "umum", ruang: ["mobilitas", "kamar-tidur"], gambar: tvDanRak },
  { id: "rak-buku", nama: "Rak buku", sumber: "umum", ruang: ["mobilitas", "kamar-tidur"], gambar: rakBuku },
  { id: "tangga", nama: "Tangga tiga anak", sumber: "umum", ruang: ["mobilitas"], gambar: tangga },
  { id: "tanaman-pot", nama: "Tanaman dalam pot", sumber: "umum", ruang: ["mobilitas", "kamar-tidur"], gambar: tanamanPot },
  { id: "keranjang-cucian", nama: "Keranjang cucian", sumber: "umum", ruang: ["kamar-mandi", "kamar-tidur"], gambar: keranjangCucian },
  { id: "tempat-sampah", nama: "Tempat sampah", sumber: "umum", ruang: ["kamar-mandi", "dapur", "kamar-tidur"], gambar: tempatSampah },
];
