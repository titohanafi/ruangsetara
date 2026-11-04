// Perabot yang dipakai lebih dari satu ruang, digambar sekali di sini (ruang hanya menentukan ukuran dan posisinya).
import { kotak, titik, type Kerangka, type Primitif } from "./gambarShower";
import type { PeranBenda } from "./gambarRuang";
import { bagKotak, urutkanKedalaman, type Bagian } from "./perabotUmum";

export interface UkuranLemari {
  dalam: number;
  tinggi: number;
}

/**
 * Lemari di dinding `k`: `tertutup` dengan dua pintu, atau `terbuka` tanpa pintu dengan batang gantungan setinggi `gantungan` dan
 * beberapa pakaian. Dipakai sebagai lemari pakaian (kamar tidur) dan lemari tanam (mobilitas).
 */
export function lemari(
  k: Kerangka,
  a0: number,
  a1: number,
  peran: PeranBenda,
  mode: "tertutup" | "terbuka",
  { dalam, tinggi }: UkuranLemari,
  gantungan = 150,
): Primitif[] {
  const tengah = (a0 + a1) / 2;
  if (mode === "tertutup") {
    return [
      ...kotak(k, a0, a1, 0, dalam, 0, tinggi, peran),
      { jenis: "garis", dari: titik(k, tengah, dalam, 4), ke: titik(k, tengah, dalam, tinggi - 4), gaya: "tegas", peran },
      ...kotak(k, tengah - 9, tengah - 6, dalam, dalam + 2, 95, 115, peran),
      ...kotak(k, tengah + 6, tengah + 9, dalam, dalam + 2, 95, 115, peran),
    ];
  }
  const bagian: Bagian[] = [
    bagKotak(k, a0, a1, 0, 2, 0, tinggi, peran),
    bagKotak(k, a0, a0 + 3, 0, dalam, 0, tinggi, peran),
    bagKotak(k, a1 - 3, a1, 0, dalam, 0, tinggi, peran),
    bagKotak(k, a0, a1, 0, dalam, tinggi - 3, tinggi, peran),
    bagKotak(k, a0, a1, 0, dalam, 0, 3, peran),
    bagKotak(k, a0 + 3, a1 - 3, dalam / 2 - 1.5, dalam / 2 + 1.5, gantungan, gantungan + 3, peran),
  ];
  const jarak = (a1 - a0 - 16) / 5;
  for (let i = 0; i < 6; i++) {
    const a = a0 + 8 + i * jarak;
    bagian.push(bagKotak(k, a - 2, a + 2, dalam / 2 - 9, dalam / 2 + 9, gantungan - 62, gantungan, peran));
  }
  // Panel sisi yang dekat kamera digambar sesudah isinya, supaya pakaian tidak tampak menembus panel.
  return urutkanKedalaman(k, bagian);
}

/** Meja lipat yang menempel di dinding kanan (ramping, tidak memakan lantai) dengan dua siku penopang, dan rak gantung di atasnya. */
export function mejaLipatDinding(k: Kerangka, a0: number, a1: number, peran: PeranBenda, t = 75): Primitif[] {
  return [
    ...kotak(k, a0, a1, 0, 40, t - 3, t, peran),
    ...kotak(k, a0 + 4, a0 + 7, 0, 36, t - 28, t - 3, peran),
    ...kotak(k, a1 - 7, a1 - 4, 0, 36, t - 28, t - 3, peran),
    ...kotak(k, a0 + 10, a1 - 10, 0, 18, 150, 153, peran),
    ...kotak(k, a0 + 14, a0 + 17, 0, 16, 141, 150, peran),
    ...kotak(k, a1 - 17, a1 - 14, 0, 16, 141, 150, peran),
  ];
}
