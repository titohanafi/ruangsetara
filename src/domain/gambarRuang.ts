// Alat bersama untuk gambar ruang bertata letak tetap (dapur, kamar tidur, mobilitas): tipe konteks, garis ukur, zona lantai,
// dan benda yang dipakai lebih dari satu ruang (pintu, tuas, pelat saklar). Satu objek, satu gambar: ruang hanya menyusunnya.
import { bukaanDinding, gambarBenda, type JenisBenda } from "./gambarBenda";
import { footprintOval, kotak, poligon, titik, type Dinding, type Kerangka, type Primitif, type Titik } from "./gambarShower";

export type PeranBenda = "netral" | "aksen";

export interface KonteksRuang {
  kerangka: (dinding: Dinding) => Kerangka;
  /** Proyeksi koordinat ruangan (cm: x lebar, y dalam, z tinggi) ke kanvas. */
  proyeksi: (x: number, y: number, z: number) => Titik;
  /** Tulis ukuran dan nama di gambar. */
  tampilkanUkuran: boolean;
  /**
   * Benda dasar yang boleh digambar (nama lapisan, mis. "kompor"), dari hasil baca foto. Kosong (undefined) = tata letak contoh
   * bawaan (hanya untuk pratinjau pengembang dan lembar tinjauan); bila ada, benda dasar yang tidak ada di sini tidak digambar.
   */
  ada?: ReadonlySet<string>;
}

export interface Lapisan {
  id: string;
  daftar: Primitif[];
  /** Urutan gambar (makin besar makin depan); lantai memakai nilai sangat kecil. */
  kedalaman: number;
  /** Bagian modifikasi (hijau), dipakai untuk memperbesar gambar ke bagian itu. */
  aksen: boolean;
}

export interface HasilRuang {
  lapisan: Lapisan[];
  /** Garis ukur dan teks: digambar di lapisan paling atas supaya tidak tertutup benda. */
  anotasi: Primitif[];
}

/** Angka Indonesia: koma desimal. */
export const angka = (n: number): string => String(n).replace(".", ",");
export const rentang = (a: number, b: number): string => `${angka(a)}–${angka(b)} cm`;

export const garis = (dari: Titik, ke: Titik, peran: PeranBenda, gaya: "tegas" | "putus" = "tegas"): Primitif => ({
  jenis: "garis",
  dari,
  ke,
  gaya,
  peran,
});
export const ukur = (dari: Titik, ke: Titik, teks: string, teksDi?: "atas"): Primitif => ({ jenis: "ukur", dari, ke, teks, teksDi });
export const label = (p: Titik, teks: string, dx = 0, dy = 0): Primitif => ({ jenis: "label", x: p[0] + dx, y: p[1] + dy, teks });

/** Garis ukur tegak (tinggi dari lantai) pada dinding `k`, di posisi lokal (a, n). */
export const ukurTegak = (k: Kerangka, a: number, n: number, u0: number, u1: number, teks: string): Primitif =>
  ukur(titik(k, a, n, u0), titik(k, a, n, u1), teks);

/** Garis ukur sejajar dinding `k` dari `a0` ke `a1`, di kedalaman `n` dan tinggi `u`. */
export const ukurSejajar = (k: Kerangka, a0: number, a1: number, n: number, u: number, teks: string): Primitif =>
  ukur(titik(k, a0, n, u), titik(k, a1, n, u), teks, "atas");

/** Urutan gambar: titik lantai (x, y) makin ke depan layar makin besar. */
export const pivot = (c: KonteksRuang, x: number, y: number): number => c.proyeksi(x, y, 0)[1];

/** Kedalaman ruang (cm) dibaca dari bidang dinding belakang. */
export const dalamRuang = (c: KonteksRuang): number => -2 * c.kerangka("belakang").bidang;

/** Kotak bebas di lantai pada koordinat ruang (x lebar, y dalam, dari tengah ruang), tinggi `u0` sampai `u1`. */
export function kotakDunia(
  c: KonteksRuang,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  u0: number,
  u1: number,
  peran: PeranBenda,
): Primitif[] {
  const k = c.kerangka("belakang");
  const n = (y: number) => y - k.bidang;
  return kotak(k, x0, x1, n(y0), n(y1), u0, u1, peran);
}

/** Persegi di lantai (garis putus-putus hijau + isian tipis), dari sudut ruangan (x0,y0) ke (x1,y1). */
export function zonaLantai(c: KonteksRuang, id: string, x0: number, y0: number, x1: number, y1: number): Lapisan[] {
  const T = (x: number, y: number): Titik => c.proyeksi(x, y, 0);
  const sudut = [T(x0, y0), T(x1, y0), T(x1, y1), T(x0, y1)];
  return [
    { id: `${id}-isi`, daftar: [poligon("zona", sudut, "aksen")], kedalaman: -1e9, aksen: true },
    {
      id: `${id}-garis`,
      daftar: [{ jenis: "garisPoli", titik: [...sudut, sudut[0]], peran: "aksen", putus: true }],
      kedalaman: -1e9 + 1,
      aksen: true,
    },
  ];
}

/** Lingkaran di lantai (ruang putar): garis putus-putus hijau berpusat di (cx, cy) dengan jari-jari `r`. */
export function lingkaranLantai(c: KonteksRuang, id: string, cx: number, cy: number, r: number): Lapisan[] {
  const titikLingkar = footprintOval(cx, cy, r, r, 40).map(([x, y]) => c.proyeksi(x, y, 0));
  return [
    { id: `${id}-isi`, daftar: [poligon("zona", titikLingkar, "aksen")], kedalaman: -1e9, aksen: true },
    {
      id: `${id}-garis`,
      daftar: [{ jenis: "garisPoli", titik: [...titikLingkar, titikLingkar[0]], peran: "aksen", putus: true }],
      kedalaman: -1e9 + 1,
      aksen: true,
    },
  ];
}

/** Pintu bersama semua ruang: lubang di dinding + pintu dari `gambarBenda`, di dinding `dinding` pada posisi `sepanjang` (cm dari tengah dinding). */
export function pintuTetap(c: KonteksRuang, dinding: Dinding, sepanjang: number, jenis: JenisBenda, peran: PeranBenda): Primitif[] {
  const k: Kerangka = { ...c.kerangka(dinding), sepanjang };
  return [...bukaanDinding(k), ...gambarBenda(jenis, k, peran)];
}

/** Tuas pintu (hijau): batang pendek di sisi daun, pada tinggi `u` dari lantai. */
export const tuas = (k: Kerangka, a: number, u: number, peran: PeranBenda): Primitif[] =>
  kotak(k, a - 8, a + 8, 4, 8, u, u + 3, peran).concat(kotak(k, a - 8, a - 5, 2, 8, u - 4, u + 3, peran));

/** Pelat saklar atau stopkontak di dinding `k`, tinggi `u` dari lantai (digambar sedikit lebih besar dari aslinya supaya terbaca). */
export const pelat = (k: Kerangka, a: number, u: number, peran: PeranBenda): Primitif[] => kotak(k, a - 6, a + 6, 0, 2, u, u + 12, peran);

/** Semua teks label dan ukur sebuah gambar (untuk tes: hanya angka yang diizinkan). */
export function teksGambar(hasil: HasilRuang): string[] {
  return hasil.anotasi.flatMap((p) => (p.jenis === "ukur" || p.jenis === "label" ? [p.teks] : []));
}
