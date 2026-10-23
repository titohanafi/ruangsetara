// Geometri murni dipakai BERSAMA oleh denah tampak-atas dan isometrik (`src/components/DenahKamarMandi.tsx`) —
// dipindah ke sini (tanpa mengubah logikanya) supaya bisa diuji lewat vitest tanpa merender React/SVG, dan supaya
// kedua tampilan punya satu sumber kebenaran untuk posisi (bukan dua implementasi paralel yang bisa diam-diam beda).
import { posisiPersenDenah, type DindingDenah, type LetakDenah } from "./denahPindai";

// Ukuran denah (viewBox): ruangan memanjang (bukan persegi), meniru proporsi kamar mandi pada umumnya.
export const W = 200;
export const H = 300;
export const PAD = 10;
// Seberapa jauh benda digambar dari garis dinding (supaya terlihat "menempel" tanpa menimpa garisnya).
export const JARAK_DINDING = 35;

// Proyeksi isometrik: koordinat benda yang sama persis dengan tampak atas (dari `titikDinding`, tidak dihitung
// ulang) cuma diproyeksikan lewat `iso()` supaya posisi, status, dan koreksi user tetap satu sumber data — yang
// beda cuma cara menggambarnya.
export const ISO_SUDUT = (30 * Math.PI) / 180;
export const ISO_COS = Math.cos(ISO_SUDUT);
export const ISO_SIN = Math.sin(ISO_SUDUT);
// viewBox dan pergeseran dipilih manual supaya ruangan (W×H di atas, diproyeksikan lewat sudut 30°, TANPA
// kompresi sumbu — lihat `iso()`) memenuhi kanvas dengan jarak tipis ke tepi.
export const ISO_OX = 283;
export const ISO_OY = 215;

/** Fungsi murni: titik (x,y) tampak-atas + ketinggian opsional -> titik 2D isometrik. Proyeksi isometrik PENUH
 *  (bukan dipadatkan di salah satu sumbu) — ruangan 200×300 (lihat W/H) yang memang tidak persegi otomatis
 *  tergambar asimetris apa adanya, tanpa perlu angka kompresi buatan untuk memaksanya terlihat persegi. */
export function iso(x: number, y: number, z = 0): { x: number; y: number } {
  return { x: (x - y) * ISO_COS + ISO_OX, y: (x + y) * ISO_SIN - z + ISO_OY };
}

/** Jajaran genjang isometrik dari persegi panjang tampak-atas berpusat (x,y), setengah-lebar rx dan setengah-tinggi ry. */
export function isoPersegi(x: number, y: number, rx: number, ry: number, z = 0): string {
  return [iso(x - rx, y - ry, z), iso(x + rx, y - ry, z), iso(x + rx, y + ry, z), iso(x - rx, y + ry, z)]
    .map((p) => `${p.x},${p.y}`)
    .join(" ");
}

/** Elips isometrik dari lingkaran tampak-atas berpusat (x,y) berjari-jari r — dipakai untuk lingkaran "ruang gerak". */
export function isoLingkaran(x: number, y: number, r: number, z = 0): string {
  return Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2;
    const p = iso(x + r * Math.cos(a), y + r * Math.sin(a), z);
    return `${p.x},${p.y}`;
  }).join(" ");
}

export type TitikDatar = { x: number; y: number };

/** Jejak persegi panjang tampak-atas berpusat (x,y) — dipakai untuk tiap benda isometrik (dinding, kloset,
 *  wastafel, dst). */
export function footprintPersegi(x: number, y: number, rx: number, ry: number): TitikDatar[] {
  return [
    { x: x - rx, y: y - ry },
    { x: x + rx, y: y - ry },
    { x: x + rx, y: y + ry },
    { x: x - rx, y: y + ry },
  ];
}

/** Garis lengkung (bukan lingkaran penuh) dari sudut `dari` ke `ke` (radian) — dipakai untuk lintasan ayun pintu. */
export function isoBusurDatar(x: number, y: number, r: number, dari: number, ke: number, n = 10): string {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = dari + ((ke - dari) * i) / n;
    const p = iso(x + r * Math.cos(a), y + r * Math.sin(a), 0);
    return `${p.x},${p.y}`;
  }).join(" ");
}

/**
 * Titik tempel benda ke dinding: koordinat sepanjang dinding dari posisi AI, koordinat tegak lurus dipaksa dekat
 * dinding. Dindingnya sendiri sudah pasti dari AI (bukan ditebak dari grid), jadi tidak ada ambiguitas pojok lagi.
 */
export function titikDinding({ dinding, posisi }: LetakDenah): {
  x: number;
  y: number;
  dinding: DindingDenah;
} {
  const { kiri, atas } = posisiPersenDenah({ dinding, posisi });
  const x = PAD + (kiri / 100) * (W - 2 * PAD);
  const y = PAD + (atas / 100) * (H - 2 * PAD);
  if (dinding === "kiri") return { x: PAD + JARAK_DINDING, y, dinding };
  if (dinding === "kanan") return { x: W - PAD - JARAK_DINDING, y, dinding };
  if (dinding === "depan") return { x, y: H - PAD - JARAK_DINDING, dinding };
  return { x, y: PAD + JARAK_DINDING, dinding };
}

/** Fungsi murni: geser titik (x,y) ke arah ruangan (menjauhi dinding yang ditempel) sejauh `jarak`. */
export function dorongKeDalam(x: number, y: number, dinding: DindingDenah, jarak: number): { x: number; y: number } {
  if (dinding === "kiri") return { x: x + jarak, y };
  if (dinding === "kanan") return { x: x - jarak, y };
  if (dinding === "depan") return { x, y: y - jarak };
  return { x, y: y + jarak };
}

/** Fungsi murni: paksa koordinat tegak lurus ke garis dinding persis (bukan digeser JARAK_DINDING seperti titikDinding) —
 *  dipakai di tampilan isometrik untuk daun pintu, yang digambar menempel rata dinding, bukan menjorok ke ruangan. */
export function keDinding(x: number, y: number, dinding: DindingDenah): { x: number; y: number } {
  if (dinding === "kiri") return { x: PAD, y };
  if (dinding === "kanan") return { x: W - PAD, y };
  if (dinding === "depan") return { x, y: H - PAD };
  return { x, y: PAD };
}
