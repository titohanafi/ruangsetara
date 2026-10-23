// Gambar "Ruang Anda" di halaman hasil kamar mandi: logika murni, terpisah dari komponen.
import { OBJEK_DENAH, type LetakDenah, type ObjekDenah } from "./denahPindai";

export type SudutPandang = "kiri" | "kanan";

/**
 * Sudut pandang isometrik awal: dinding belakang selalu digambar, ditambah satu dinding samping. Dipilih sisi yang membuat
 * paling banyak benda terlihat; bila seri, "kanan" (urutan tetap supaya bawaan tidak berubah-ubah).
 */
export function sudutAwal(letak: (id: ObjekDenah) => LetakDenah, tidakTerlihat: readonly ObjekDenah[] = []): SudutPandang {
  const skor = (sisi: SudutPandang) =>
    OBJEK_DENAH.filter((id) => !tidakTerlihat.includes(id) && (letak(id).dinding === "belakang" || letak(id).dinding === sisi)).length;
  return skor("kiri") > skor("kanan") ? "kiri" : "kanan";
}
