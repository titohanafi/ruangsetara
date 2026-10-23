// Gambar shower isometrik bergaya manual perakitan: fungsi murni yang menghasilkan daftar bentuk (primitif) dari
// varian, mode, ukuran, dan "kerangka dinding" (dinding mana, di titik mana, diproyeksikan bagaimana). Komponen
// `GambarShower.tsx` merender daftar ini sebagai panel; denah isometrik (`DenahKamarMandi.tsx`) memakai daftar yang
// sama langsung di koordinat ruangan.
//
// Satuan: 1 satuan gambar = 1 cm nyata, sama untuk semua gambar (lihat `dimensiGambar.ts`). Tinggi zona jangkauan dan
// ukuran ruangan berasal dari tabel ukuran (`content/ukuran-aksesibel.json`); ukuran kecil yang tidak ada di tabel
// (kepala shower, keran, ember) adalah perkiraan yang tercatat di `DIMENSI_PERKIRAAN`, BUKAN ukuran produk. Panel
// diperbesar seragam lewat `ZOOM_PANEL` pada kerangkanya, bukan dengan mengubah ukuran benda. Gambar tidak pernah
// menampilkan angka.
import type { VarianShower } from "./denahPindai";
import { DIM } from "./dimensiGambar";

export type Titik = readonly [number, number];
export type ModeGambar = "kondisi" | "hack" | "permanen";
export type SisiDinding = "kanan" | "kiri";
export type Dinding = "belakang" | "kiri" | "kanan" | "depan";
/** Peran warna: `netral` benda (putih dan abu netral), `aksen` perubahan yang disarankan (hijau), `hantu` posisi lama, `ruang` dinding dan lantai. */
export type Peran = "netral" | "aksen" | "hantu" | "ruang";
export type Muka = "atas" | "kanan" | "kiri";

export type Primitif =
  | {
      jenis: "poligon";
      muka: Muka | "latar" | "lantai" | "zona" | "pita" | "rongga";
      titik: Titik[];
      peran: Peran;
      tanpaGaris?: boolean;
      /** Alas gelap bergaris dua kali tebal: bila ditumpuk di bawah poligon lain, hanya garis tepi luar gabungannya yang tampak. */
      tepi?: boolean;
      /** Garis di dalam objek digambar tipis (tepi luar tetap tebal lewat `tepi`). */
      garisTipis?: boolean;
    }
  | { jenis: "garisPoli"; titik: Titik[]; peran: Peran; putus?: boolean }
  | { jenis: "elips"; cx: number; cy: number; rx: number; ry: number; tingkat: "atas" | "rongga" | "tutup"; peran: Peran }
  | { jenis: "badan"; cx: number; yAtas: number; yBawah: number; rx: number; ry: number; muka: "kanan" | "kiri"; peran: Peran }
  | {
      jenis: "cakram";
      cx: number;
      cy: number;
      r: number;
      sumbuA: Titik;
      sumbuU: Titik;
      tingkat: "belakang" | "depan" | "polos";
      peran: Peran;
    }
  | { jenis: "garis"; dari: Titik; ke: Titik; gaya: "tegas" | "putus" | "air" | "silang" | "panah" | "ubin" | "ubinLantai"; peran: Peran }
  | { jenis: "jalur"; titik: Titik[]; gaya: "selang" | "gagang" | "lengkung"; peran: Peran }
  | { jenis: "baut"; cx: number; cy: number; peran: Peran }
  | { jenis: "tanda"; x: number; y: number; teks: string }
  /** Garis ukur dengan penanda di kedua ujung dan teks ukuran (mis. "min. 90 cm"). Teks hanya angka dari sheet atau tabel. */
  | { jenis: "ukur"; dari: Titik; ke: Titik; teks: string; teksDi?: "atas" }
  /** Teks pendek di titik layar (nama benda atau ukuran tanpa garis ukur). */
  | { jenis: "label"; x: number; y: number; teks: string };

export const LEBAR_KANVAS = 380;
export const TINGGI_KANVAS = 500;
/** Pembesaran seragam panel (piksel kanvas per cm pada sumbu dinding); hanya mengatur seberapa besar panel tampil. */
export const ZOOM_PANEL = 1.2;

const K = Math.sqrt(3) / 2;
const PUSAT_X = LEBAR_KANVAS / 2;
const PUSAT_Y = 385;

/** Proyeksi isometrik titik ruangan (x, y, tinggi) ke kanvas panel. Sumbu x turun ke kanan, y turun ke kiri. */
export const proyeksiPanel = (x: number, y: number, z: number): Titik => [PUSAT_X + K * (x - y), PUSAT_Y + 0.5 * (x + y) - z];

/**
 * Tempat benda dipasang: dinding mana, titik di sepanjang dinding itu, bidang dinding, cara memproyeksikan koordinat
 * ruangan, dan pengali ukuran gambar. Koordinat lokal benda: `a` sepanjang dinding, `n` menjauhi dinding ke dalam
 * ruangan, `u` tinggi. Dinding belakang dan kiri terlihat dari dalam; kanan dan depan terlihat dari belakang benda.
 */
export interface Kerangka {
  dinding: Dinding;
  sepanjang: number;
  bidang: number;
  proyeksi: (x: number, y: number, z: number) => Titik;
  skala: number;
  /**
   * Dari sisi mana kamera melihat ruangan: +1 berarti kamera berada di sisi koordinat positif sumbu itu, jadi sisi
   * kotak yang menghadap +x (atau +y) yang terlihat. Bawaan {x: 1, y: 1}, yang dipakai panel dan denah SVG.
   */
  lihat?: { x: 1 | -1; y: 1 | -1 };
}

export function kerangkaPanel(sisi: SisiDinding): Kerangka {
  return { dinding: sisi === "kanan" ? "belakang" : "kiri", sepanjang: 0, bidang: 0, proyeksi: proyeksiPanel, skala: ZOOM_PANEL };
}

export function keRuang(k: Kerangka, a: number, n: number): readonly [number, number] {
  switch (k.dinding) {
    case "belakang":
      return [k.sepanjang + a, k.bidang + n];
    case "kiri":
      return [k.bidang + n, k.sepanjang + a];
    case "kanan":
      return [k.bidang - n, k.sepanjang + a];
    case "depan":
      return [k.sepanjang + a, k.bidang - n];
  }
}

/** Titik layar untuk koordinat lokal benda (a, n, u), sudah dikalikan skala gambar. */
export function titik(k: Kerangka, a: number, n: number, u: number): Titik {
  const [x, y] = keRuang(k, a * k.skala, n * k.skala);
  return k.proyeksi(x, y, u * k.skala);
}

/** Vektor layar untuk satu satuan dunia sepanjang sumbu `a` (kanan-bawah atau kiri-bawah). */
function sumbuA(k: Kerangka): Titik {
  const p = titik(k, 0, 0, 0);
  const q = titik(k, 1 / k.skala, 0, 0);
  return [q[0] - p[0], q[1] - p[1]];
}

/** Vektor layar untuk satu satuan dunia ke atas. */
function sumbuU(k: Kerangka): Titik {
  const p = titik(k, 0, 0, 0);
  const q = titik(k, 0, 0, 1 / k.skala);
  return [q[0] - p[0], q[1] - p[1]];
}

/**
 * Piksel layar untuk satu satuan lokal gambar: skala benda dikali panjang satu satuan dunia di layar. Pada panel dan
 * denah SVG satu satuan dunia = 1 piksel, jadi nilainya sama dengan `skala`; pada kamera 3D nilainya lebih besar.
 */
export function pikselPerSatuan(k: Kerangka): number {
  const [x, y] = sumbuA(k);
  return k.skala * Math.hypot(x, y);
}

export interface UkuranShower {
  /** Batas bawah zona jangkauan dari lantai, cm. */
  zonaBawah: number;
  /** Batas atas zona jangkauan dari lantai, cm. */
  zonaAtas: number;
}

/** Zona jangkauan dari tabel: batas atas kran/holder dan batas bawah rentang jangkauan (PerMen diutamakan), dalam cm. */
export function ukuranShower(): UkuranShower {
  return { zonaBawah: DIM.shower.zonaBawah, zonaAtas: DIM.shower.zonaAtas };
}

export const poligon = (
  muka: Muka | "latar" | "lantai" | "zona" | "pita" | "rongga",
  pts: Titik[],
  peran: Peran,
): Extract<Primitif, { jenis: "poligon" }> => ({
  jenis: "poligon",
  muka,
  titik: pts,
  peran,
});

/** Kotak pada koordinat lokal: tiga sisi yang terlihat dari kamera (atas dan dua sisi tegak yang menghadap kamera). */
export function kotak(k: Kerangka, a0: number, a1: number, n0: number, n1: number, u0: number, u1: number, peran: Peran): Primitif[] {
  const [xa, ya] = keRuang(k, a0 * k.skala, n0 * k.skala);
  const [xb, yb] = keRuang(k, a1 * k.skala, n1 * k.skala);
  const [x0, x1] = [Math.min(xa, xb), Math.max(xa, xb)];
  const [y0, y1] = [Math.min(ya, yb), Math.max(ya, yb)];
  const [z0, z1] = [u0 * k.skala, u1 * k.skala];
  const p = k.proyeksi;
  const lihat = k.lihat ?? { x: 1, y: 1 };
  const xf = lihat.x === 1 ? x1 : x0;
  const yf = lihat.y === 1 ? y1 : y0;
  // Nada sisi mengikuti letaknya di layar: sisi yang normalnya mengarah ke kanan layar terang, ke kiri layar gelap.
  const o = p(0, 0, 0);
  const layarX = (p(1, 0, 0)[0] - o[0]) * lihat.x;
  const mukaX: Muka = layarX >= 0 ? "kanan" : "kiri";
  const mukaY: Muka = mukaX === "kanan" ? "kiri" : "kanan";
  return [
    poligon("atas", [p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)], peran),
    poligon(mukaX, [p(xf, y0, z1), p(xf, y1, z1), p(xf, y1, z0), p(xf, y0, z0)], peran),
    poligon(mukaY, [p(x0, yf, z1), p(x1, yf, z1), p(x1, yf, z0), p(x0, yf, z0)], peran),
  ];
}

/** Titik keliling oval datar (setengah-lebar `ra` sepanjang dinding, setengah-dalam `rn` menjauhi dinding) berpusat di (a, n). */
export function footprintOval(a: number, n: number, ra: number, rn: number, segmen = 28): [number, number][] {
  return Array.from({ length: segmen }, (_, i) => {
    const th = (i / segmen) * Math.PI * 2;
    return [a + ra * Math.cos(th), n + rn * Math.sin(th)];
  });
}

/** Persegi panjang berputar: berpusat di (a, n), setengah-panjang `rp` searah sudut `sudut` (radian dari sumbu `a`), setengah-tebal `rt`. */
export function footprintPutar(a: number, n: number, rp: number, rt: number, sudut: number): [number, number][] {
  const [c, s] = [Math.cos(sudut), Math.sin(sudut)];
  return (
    [
      [-rp, -rt],
      [rp, -rt],
      [rp, rt],
      [-rp, rt],
    ] as const
  ).map(([x, y]) => [a + x * c - y * s, n + x * s + y * c]);
}

/**
 * Benda dari jejak lantai bebas bentuk (cembung), diekstrusi dari `u0` ke `u1`: tutup atas dan sisi tegak yang
 * menghadap kamera. `licin` = sisi melengkung tanpa garis antar-segmen (hanya siluet dan tepi atas), untuk oval;
 * bila tidak, setiap sisi bergaris seperti kotak.
 */
export function ekstrusi(
  k: Kerangka,
  jejak: readonly (readonly [number, number])[],
  u0: number,
  u1: number,
  peran: Peran,
  licin = false,
): Primitif[] {
  const lihat = k.lihat ?? { x: 1, y: 1 };
  const dunia = jejak.map(([a, n]) => keRuang(k, a * k.skala, n * k.skala));
  const pusat: [number, number] = [dunia.reduce((s, p) => s + p[0], 0) / dunia.length, dunia.reduce((s, p) => s + p[1], 0) / dunia.length];
  const atas = dunia.map(([x, y]) => k.proyeksi(x, y, u1 * k.skala));
  const bawah = dunia.map(([x, y]) => k.proyeksi(x, y, u0 * k.skala));
  const o = k.proyeksi(0, 0, 0);
  const hasil: Primitif[] = [];
  const terlihat: number[] = [];
  for (let i = 0; i < dunia.length; i++) {
    const j = (i + 1) % dunia.length;
    const [ax, ay] = dunia[i];
    const [bx, by] = dunia[j];
    let nx = by - ay;
    let ny = -(bx - ax);
    if (nx * ((ax + bx) / 2 - pusat[0]) + ny * ((ay + by) / 2 - pusat[1]) < 0) {
      nx = -nx;
      ny = -ny;
    }
    // Sisi yang nyaris sejajar arah pandang tidak ikut digambar (lebarnya di layar nol; ambang menghindari noise hitung).
    if (nx * lihat.x + ny * lihat.y <= 1e-6 * Math.hypot(nx, ny)) continue;
    terlihat.push(i);
    const [lx, ly] = k.proyeksi(nx, ny, 0);
    const normalLayar = lx - o[0];
    // Sisi yang menghadap tepat ke arah kamera (normal tegak di layar) dianggap searah sumbu `a`, supaya hasilnya
    // stabil dan dinding kiri tetap cermin dinding kanan.
    const seri = Math.abs(normalLayar) < 1e-6 * Math.hypot(normalLayar, ly - o[1]);
    const terang = seri ? sumbuA(k)[0] >= 0 : normalLayar >= 0;
    hasil.push({ ...poligon(terang ? "kanan" : "kiri", [atas[i], atas[j], bawah[j], bawah[i]], peran), tanpaGaris: licin });
  }
  if (licin && terlihat.length > 0) {
    // Sisi yang terlihat berderet berurutan mengelilingi jejak, bisa melewati titik awal (indeks 0). Urutan dimulai
    // dari sisi terlihat pertama setelah sisi yang tidak terlihat; tanpa ini siluet bawah menyambung dua ujung
    // yang berjauhan dengan garis lurus yang memotong benda.
    const ada = new Set(terlihat);
    const n = dunia.length;
    const mulai = terlihat.find((i) => !ada.has((i + n - 1) % n)) ?? terlihat[0];
    const urutan: number[] = [];
    for (let s = 0; s < n && ada.has((mulai + s) % n); s++) urutan.push((mulai + s) % n);
    const awal = urutan[0];
    const akhir = (urutan[urutan.length - 1] + 1) % n;
    hasil.push({ jenis: "garisPoli", titik: [...urutan.map((i) => bawah[i]), bawah[akhir]], peran });
    hasil.push({ jenis: "garis", dari: atas[awal], ke: bawah[awal], gaya: "tegas", peran });
    hasil.push({ jenis: "garis", dari: atas[akhir], ke: bawah[akhir], gaya: "tegas", peran });
  }
  hasil.push(poligon("atas", atas, peran));
  return hasil;
}

/** Sudut parameter (radian) tempat tepi elips cakram sejajar arah tebal `d`; dipakai untuk garis siluet silinder. */
export function sudutSinggung(sumbuA: Titik, sumbuU: Titik, d: Titik): number {
  return Math.atan2(sumbuU[0] * d[1] - sumbuU[1] * d[0], sumbuA[0] * d[1] - sumbuA[1] * d[0]);
}

const pada = (c: Titik, r: number, sumbuA: Titik, sumbuU: Titik, theta: number): Titik => [
  c[0] + r * (Math.cos(theta) * sumbuA[0] + Math.sin(theta) * sumbuU[0]),
  c[1] + r * (Math.cos(theta) * sumbuA[1] + Math.sin(theta) * sumbuU[1]),
];

/**
 * Silinder yang sumbunya menembus bidang `a`-`u` (kepala hand shower): cakram jauh, pita, siluet, cakram dekat.
 * Lubang semprot hanya tampak bila sisi yang menghadap ke ruangan juga menghadap kamera.
 */
function silinderCakram(k: Kerangka, a: number, nMulai: number, tebal: number, u: number, r: number, peran: Peran): Primitif[] {
  const c0 = titik(k, a, nMulai, u);
  const c1 = titik(k, a, nMulai + tebal, u);
  const d: Titik = [c1[0] - c0[0], c1[1] - c0[1]];
  const ea = sumbuA(k);
  const eu = sumbuU(k);
  const rr = r * k.skala;
  const menghadapKamera = d[1] >= 0;
  const [jauh, dekat] = menghadapKamera ? [c0, c1] : [c1, c0];
  const th = sudutSinggung(ea, eu, d);
  const b1 = pada(jauh, rr, ea, eu, th);
  const b2 = pada(jauh, rr, ea, eu, th + Math.PI);
  const d1 = pada(dekat, rr, ea, eu, th);
  const d2 = pada(dekat, rr, ea, eu, th + Math.PI);
  return [
    { jenis: "cakram", cx: jauh[0], cy: jauh[1], r: rr, sumbuA: ea, sumbuU: eu, tingkat: "belakang", peran },
    poligon("pita", [b1, d1, d2, b2], peran),
    { jenis: "garis", dari: b1, ke: d1, gaya: "tegas", peran },
    { jenis: "garis", dari: b2, ke: d2, gaya: "tegas", peran },
    { jenis: "cakram", cx: dekat[0], cy: dekat[1], r: rr, sumbuA: ea, sumbuU: eu, tingkat: menghadapKamera ? "depan" : "polos", peran },
  ];
}

/** Silinder berdiri di lantai atau di benda (ember, gayung, kepala shower tetap). `yAtas` = pusat elips tutup, di layar. */
function silinderTegak(
  cx: number,
  yAtas: number,
  r: number,
  tinggi: number,
  muka: "kanan" | "kiri",
  terbuka: boolean,
  peran: Peran,
): Primitif[] {
  const rx = r * Math.sqrt(1.5);
  const ry = r * Math.SQRT1_2;
  return [
    { jenis: "badan", cx, yAtas, yBawah: yAtas + tinggi, rx, ry, muka, peran },
    { jenis: "elips", cx, cy: yAtas, rx, ry, tingkat: "atas", peran },
    terbuka
      ? { jenis: "elips", cx, cy: yAtas + 1, rx: rx * 0.82, ry: ry * 0.8, tingkat: "rongga", peran }
      : { jenis: "elips", cx, cy: yAtas, rx: rx * 0.48, ry: ry * 0.48, tingkat: "tutup", peran },
  ];
}

/**
 * Selang berbentuk gagang payung (huruf J) pada bidang dinding: batang lurus turun dari gagang hand shower, lalu melengkung
 * di bawah dan naik masuk ke sambungan di bukaan bawah keran dari bawah. Digambar dalam koordinat dinding (a sepanjang
 * dinding, n menjauhi dinding, u tinggi) lalu diproyeksikan, jadi J menempel sejajar dinding dan ujungnya bertemu keran.
 */
function selang(k: Kerangka, mulai: readonly [number, number, number], akhir: readonly [number, number, number], peran: Peran): Primitif {
  const [am, nm, um] = mulai;
  const [ae, ne, ue] = akhir;
  const lebar = Math.abs(ae - am);
  const dasar = Math.min(um, ue) - lebar * 0.5;
  const uq = Math.min(um, dasar + lebar);
  const tinggi = uq - dasar;
  const batang = (um - uq) / 3;
  const titikSelang: Titik[] = [
    titik(k, am, nm, um),
    titik(k, am, nm, um - batang),
    titik(k, am, nm, um - 2 * batang),
    titik(k, am, nm, uq),
    titik(k, am, nm, uq - tinggi * 0.7),
    titik(k, ae, ne, ue - tinggi * 0.7),
    titik(k, ae, ne, ue),
  ];
  return { jenis: "jalur", titik: titikSelang, gaya: "selang", peran };
}

/**
 * Garis keramik di dinding sebagai penggaris: garis tegak tiap `DIM.ubin` cm dari `aMulai` sepanjang dinding (dalam
 * rentang `a0`..`a1`) dan garis mendatar tiap `DIM.ubin` cm dari lantai sampai `tinggi`. Ukuran kotak adalah konvensi
 * gambar, bukan ukuran produk.
 */
export function garisUbin(k: Kerangka, a0: number, a1: number, tinggi: number, aMulai = 0): Primitif[] {
  const jarak = DIM.ubin;
  const hasil: Primitif[] = [];
  const garis = (dari: Titik, ke: Titik): Primitif => ({ jenis: "garis", dari, ke, gaya: "ubin", peran: "netral" });
  for (let a = aMulai + Math.ceil((a0 - aMulai) / jarak) * jarak; a < a1 - 1e-6; a += jarak) {
    if (a > a0 + 1e-6) hasil.push(garis(titik(k, a, 0, 0), titik(k, a, 0, tinggi)));
  }
  for (let u = jarak; u < tinggi - 1e-6; u += jarak) hasil.push(garis(titik(k, a0, 0, u), titik(k, a1, 0, u)));
  return hasil;
}

/**
 * Garis keramik lantai: garis sejajar `n` tiap `DIM.ubin` cm dari `aMulai` (dalam rentang `a0`..`a1`) dan garis sejajar `a`
 * tiap `DIM.ubin` cm dari `nMulai` (dalam rentang `n0`..`n1`), digambar pada lantai (u = 0). Ukuran kotak sama dengan dinding.
 */
export function garisUbinLantai(k: Kerangka, a0: number, a1: number, n0: number, n1: number, aMulai = 0, nMulai = 0): Primitif[] {
  const jarak = DIM.ubin;
  const hasil: Primitif[] = [];
  const garis = (dari: Titik, ke: Titik): Primitif => ({ jenis: "garis", dari, ke, gaya: "ubinLantai", peran: "netral" });
  for (let a = aMulai + Math.ceil((a0 - aMulai) / jarak) * jarak; a < a1 - 1e-6; a += jarak)
    if (a > a0 + 1e-6) hasil.push(garis(titik(k, a, n0, 0), titik(k, a, n1, 0)));
  for (let n = nMulai + Math.ceil((n0 - nMulai) / jarak) * jarak; n < n1 - 1e-6; n += jarak)
    if (n > n0 + 1e-6) hasil.push(garis(titik(k, a0, n, 0), titik(k, a1, n, 0)));
  return hasil;
}

/**
 * Gaya bersih: alas gelap di bawah semua sisi supaya hanya tepi luar yang tebal, garis di dalam objek tipis, dan sisi
 * dibedakan dengan nada warna. Dipakai pada keran.
 */
export function bersihkan(daftar: Primitif[]): Primitif[] {
  const polis = daftar.filter((p): p is Extract<Primitif, { jenis: "poligon" }> => p.jenis === "poligon");
  return [...polis.map((p) => ({ ...p, tepi: true })), ...polis.map((p) => ({ ...p, garisTipis: true }))];
}

/** Dinding dan lantai polos (putih, hanya garis) untuk panel, supaya gaya mengikuti manual perakitan. Dinding berkeramik. */
export function latarPanel(k: Kerangka = kerangkaPanel("kanan")): Primitif[] {
  const tinggi = DIM.ruang.tinggi;
  return [
    poligon("lantai", [titik(k, -80, 0, 0), titik(k, 80, 0, 0), titik(k, 80, 95, 0), titik(k, -80, 95, 0)], "ruang"),
    ...garisUbinLantai(k, -80, 80, 0, 95),
    poligon("latar", [titik(k, -80, 0, 0), titik(k, 80, 0, 0), titik(k, 80, 0, tinggi), titik(k, -80, 0, tinggi)], "ruang"),
    ...garisUbin(k, -80, 80, tinggi),
  ];
}

/**
 * Mengecilkan satu rakitan (keran, kepala shower) dengan faktor `f` terhadap titik tumpu di dinding: `pa` sepanjang
 * dinding dan `pu` tinggi (jarak dari dinding diskalakan dari dinding itu sendiri), sehingga rakitan tetap menempel di
 * titik yang sama. `f` = `DIM.shower.bagianKecil`: bentuk kecil ilustrasi awal diubah ke ukuran nyata.
 */
function rakitan(f: number, pa: number, pu: number) {
  const A = (v: number) => pa + f * (v - pa);
  const N = (v: number) => f * v;
  const U = (v: number) => pu + f * (v - pu);
  return {
    f,
    A,
    N,
    U,
    kotak: (k: Kerangka, a0: number, a1: number, n0: number, n1: number, u0: number, u1: number, peran: Peran) =>
      kotak(k, A(a0), A(a1), N(n0), N(n1), U(u0), U(u1), peran),
  };
}

const rakitanKeran = (f: number) => rakitan(f, 0, 101);

/**
 * Keran dinding sederhana di tengah dinding (a = 0): pelat, cerat ke depan, dan satu tuas. Keran punya dua bukaan air:
 * cerat ke depan dan cerat pendek ke bawah tempat selang hand shower dipasang.
 */
function keran(k: Kerangka, mode: ModeGambar, f: number): Primitif[] {
  const r = rakitanKeran(f);
  return bersihkan([
    ...r.kotak(k, -8, 8, 0, 4, 92, 110, "netral"),
    ...r.kotak(k, -3, 3, 8, 14, 82, 96, "netral"),
    ...r.kotak(k, -4, 4, 0, 28, 96, 106, "netral"),
    ...r.kotak(k, -2, 2, 1, 5, 106, 118, mode === "permanen" ? "aksen" : "netral"),
  ]);
}

/** Posisi kait hand shower: tinggi atasnya dan geseran sepanjang dinding. Kondisi = di luar zona; hack/permanen = di batas atas zona. */
export function posisiKait(mode: ModeGambar, ukuran: UkuranShower = ukuranShower()): { uAtas: number; aGeser: number } {
  return mode === "kondisi" ? { uAtas: DIM.shower.kaitLuarJangkauan, aGeser: 30 } : { uAtas: ukuran.zonaAtas, aGeser: 35 };
}

function handShower(k: Kerangka, mode: ModeGambar, ukuran: UkuranShower, anotasi: boolean, f: number): Primitif[] {
  const s = pikselPerSatuan(k);
  const { uAtas, aGeser } = posisiKait(mode, ukuran);
  const lama = posisiKait("kondisi", ukuran);
  const peran: Peran = mode === "kondisi" ? "netral" : "aksen";
  const uBawahGagang = mode === "kondisi" ? uAtas - 57 : uAtas - 17;
  const hasil: Primitif[] = [];

  if (anotasi) {
    hasil.push(
      poligon(
        "zona",
        [
          titik(k, -100, 0, ukuran.zonaBawah),
          titik(k, 100, 0, ukuran.zonaBawah),
          titik(k, 100, 0, ukuran.zonaAtas),
          titik(k, -100, 0, ukuran.zonaAtas),
        ],
        "aksen",
      ),
    );
  }
  const kr = rakitanKeran(f);
  const kp = rakitan(f, aGeser, uAtas);
  hasil.push(...keran(k, mode, f));
  if (mode === "hack") hasil.push(...kotak(k, -8, 8, 0, 12, lama.uAtas - 20, lama.uAtas, "hantu"));
  hasil.push(selang(k, [kp.A(aGeser + 4), kp.N(20), kp.U(uBawahGagang)], [kr.A(0), kr.N(11), kr.U(79)], "netral"));
  // Sambungan selang pada bukaan keran yang menghadap ke bawah.
  hasil.push(...bersihkan(kr.kotak(k, -4, 4, 7, 15, 78, 84, "netral")));
  hasil.push(...kp.kotak(k, aGeser - 8, aGeser + 8, 0, 12, uAtas - 20, uAtas, peran));
  if (mode === "permanen") {
    for (const u of [uAtas - 6.5, uAtas - 18.5]) {
      const [cx, cy] = titik(k, kp.A(aGeser - 3), kp.N(12), kp.U(u));
      hasil.push({ jenis: "baut", cx, cy, peran });
    }
  }
  hasil.push(...kp.kotak(k, aGeser - 4, aGeser + 4, 12, 20, uBawahGagang, uAtas + 17, peran));
  hasil.push(...silinderCakram(k, aGeser, kp.N(14), kp.N(10), kp.U(uAtas + 25), 22 * f, peran));

  if (anotasi && mode === "kondisi") {
    const dasar = titik(k, 50, 0, ukuran.zonaAtas);
    const ujung = titik(k, 50, 0, lama.uAtas - 21);
    const [cx, cy] = titik(k, 50, 0, lama.uAtas - 2);
    const h = 11 * s;
    hasil.push({ jenis: "garis", dari: dasar, ke: ujung, gaya: "putus", peran: "netral" });
    hasil.push({ jenis: "garis", dari: [cx - h, cy - h], ke: [cx + h, cy + h], gaya: "silang", peran: "netral" });
    hasil.push({ jenis: "garis", dari: [cx + h, cy - h], ke: [cx - h, cy + h], gaya: "silang", peran: "netral" });
  }
  if (anotasi && mode === "hack") {
    hasil.push({ jenis: "garis", dari: titik(k, 65, 0, lama.uAtas - 4), ke: titik(k, 65, 0, uAtas + 33), gaya: "panah", peran: "netral" });
  }
  return hasil;
}

function showerTetap(k: Kerangka, f: number): Primitif[] {
  const s = pikselPerSatuan(k) * f;
  const uP = DIM.shower.kepalaTetap;
  const kp = rakitan(f, 0, uP);
  const [cx, cyAtas] = titik(k, 0, kp.N(50), kp.U(uP - 11));
  return [
    ...keran(k, "kondisi", f),
    ...[-19, 0, 19].map((dx, i): Primitif => {
      const turun = i === 1 ? 5 : 0;
      return {
        jenis: "garis",
        dari: [cx + dx * s, cyAtas + (36 + turun) * s],
        ke: [cx + dx * s, cyAtas + (74 + turun) * s],
        gaya: "air",
        peran: "netral",
      };
    }),
    ...silinderTegak(cx, cyAtas, 24 * s, 10 * s, "kiri", false, "netral"),
    ...kp.kotak(k, -8, 8, 0, 6, uP - 12, uP + 4, "netral"),
    ...kp.kotak(k, -2.5, 2.5, 6, 50, uP - 6, uP, "netral"),
  ];
}

function emberGayung(k: Kerangka, f: number): Primitif[] {
  const s = pikselPerSatuan(k) * f;
  const arah = sumbuA(k)[0] >= 0 ? 1 : -1;
  const [ex, eyBawah] = titik(k, 0, 40, 0);
  const tinggiEmber = 55 * s;
  const yAtasEmber = eyBawah - tinggiEmber;
  const [gx, gyBawah] = titik(k, 40, 30, 0);
  const kr = rakitanKeran(f);
  const ujungKeran = titik(k, kr.A(0), kr.N(28), kr.U(96));
  return [
    ...keran(k, "kondisi", f),
    {
      jenis: "garis",
      dari: [ujungKeran[0] - arah * 0.3 * s, ujungKeran[1] + 9 * s],
      ke: [ujungKeran[0] - arah * 7.8 * s, yAtasEmber - 10 * s],
      gaya: "air",
      peran: "netral",
    },
    {
      jenis: "jalur",
      titik: [
        [ex - arah * 25.4 * s, yAtasEmber - 4 * s],
        [ex - arah * 31.4 * s, yAtasEmber - 50 * s],
        [ex + arah * 30.6 * s, yAtasEmber - 50 * s],
        [ex + arah * 25.6 * s, yAtasEmber - 4 * s],
      ],
      gaya: "lengkung",
      peran: "netral",
    },
    ...silinderTegak(ex, yAtasEmber, 22 * s, tinggiEmber, "kanan", true, "netral"),
    {
      jenis: "jalur",
      titik: [
        [gx + arah * 9.3 * s, gyBawah - 14 * s],
        [gx + arah * 41.3 * s, gyBawah - 28 * s],
      ],
      gaya: "gagang",
      peran: "netral",
    },
    ...silinderTegak(gx, gyBawah - 14 * s, 9 * s, 14 * s, "kanan", true, "netral"),
  ];
}

function tidakJelas(k: Kerangka): Primitif[] {
  const [tx, ty] = titik(k, 0, 30, 170);
  return [...kotak(k, -20, 20, 0, 30, 140, 200, "hantu"), { jenis: "tanda", x: tx, y: ty + 11 * pikselPerSatuan(k), teks: "?" }];
}

/**
 * Gambar satu varian shower pada dinding, urutan gambar dari belakang ke depan. `mode` hanya berpengaruh pada hand
 * shower (kondisi dari foto, hack tanpa bongkar, permanen/renovasi). `anotasi` menambah zona jangkauan, silang, dan
 * panah. Tanpa `kerangka`, benda dipasang di dinding kanan panel.
 */
export function gambarShower(
  varian: VarianShower,
  mode: ModeGambar = "kondisi",
  opsi: { anotasi?: boolean; ukuran?: UkuranShower; kerangka?: Kerangka } = {},
): Primitif[] {
  const ukuran = opsi.ukuran ?? ukuranShower();
  const k = opsi.kerangka ?? kerangkaPanel("kanan");
  const f = DIM.shower.bagianKecil;
  switch (varian) {
    case "hand_shower_gantung":
      return handShower(k, mode, ukuran, opsi.anotasi ?? false, f);
    case "shower_tetap":
      return showerTetap(k, f);
    case "ember_gayung":
      return emberGayung(k, f);
    case "tidak_jelas":
      return tidakJelas(k);
  }
}

/**
 * Langkah gambar yang ditampilkan untuk satu jenis shower. Tiga langkah (kondisi, hack, permanen) hanya untuk hand
 * shower yang ditandai perlu perhatian, karena hanya itu yang punya gambar perbaikan; varian lain satu gambar
 * kondisi; "tidak_jelas" tidak menampilkan gambar (pengguna diminta memilih jenisnya).
 */
export function langkahGambarShower(varian: VarianShower, perhatian: boolean): ModeGambar[] {
  if (varian === "tidak_jelas") return [];
  return varian === "hand_shower_gantung" && perhatian ? ["kondisi", "hack", "permanen"] : ["kondisi"];
}

/** Gambar lengkap untuk panel: latar polos + varian pada dinding kanan (belakang) atau kiri. */
export function susunGambar(
  varian: VarianShower,
  mode: ModeGambar,
  sisi: SisiDinding,
  opsi: { anotasi?: boolean; latar?: boolean } = {},
): Primitif[] {
  const k = kerangkaPanel(sisi);
  return [...(opsi.latar === false ? [] : latarPanel(k)), ...gambarShower(varian, mode, { anotasi: opsi.anotasi, kerangka: k })];
}
