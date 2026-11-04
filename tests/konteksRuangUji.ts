import { RUANG_TETAP } from "../src/domain/gambarRuangTetap";
import type { KonteksRuang } from "../src/domain/gambarRuang";
import type { Dinding, Kerangka } from "../src/domain/gambarShower";

const proyeksi = (x: number, y: number, z: number): [number, number] => [x - y, (x + y) / 2 - z];

/** Konteks gambar ruang tetap untuk tes (proyeksi isometrik sederhana, tanpa ukuran tertulis). */
export function konteksUji(area: string): KonteksRuang {
  const { lebar, dalam } = RUANG_TETAP[area].ruang;
  const bidang = (d: Dinding): number =>
    d === "belakang" ? -dalam / 2 : d === "depan" ? dalam / 2 : d === "kiri" ? -lebar / 2 : lebar / 2;
  return {
    kerangka: (dinding): Kerangka => ({ dinding, sepanjang: 0, bidang: bidang(dinding), proyeksi, skala: 1, lihat: { x: -1, y: 1 } }),
    proyeksi,
    tampilkanUkuran: false,
  };
}
