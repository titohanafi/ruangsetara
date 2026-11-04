// Perabot yang dipakai lebih dari satu ruang, digambar sekali di sini (ruang hanya menentukan ukuran dan posisinya).
import { kotak, titik, type Kerangka, type Primitif } from "./gambarShower";
import type { PeranBenda } from "./gambarRuang";

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
  const hasil: Primitif[] = [
    ...kotak(k, a0, a1, 0, 2, 0, tinggi, peran),
    ...kotak(k, a0, a0 + 3, 0, dalam, 0, tinggi, peran),
    ...kotak(k, a1 - 3, a1, 0, dalam, 0, tinggi, peran),
    ...kotak(k, a0, a1, 0, dalam, tinggi - 3, tinggi, peran),
    ...kotak(k, a0, a1, 0, dalam, 0, 3, peran),
    ...kotak(k, a0 + 3, a1 - 3, dalam / 2 - 1.5, dalam / 2 + 1.5, gantungan, gantungan + 3, peran),
  ];
  const jarak = (a1 - a0 - 16) / 5;
  for (let i = 0; i < 6; i++) {
    const a = a0 + 8 + i * jarak;
    hasil.push(...kotak(k, a - 2, a + 2, dalam / 2 - 9, dalam / 2 + 9, gantungan - 62, gantungan, peran));
  }
  return hasil;
}
