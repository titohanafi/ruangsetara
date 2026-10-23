// Gambar "Ruang Anda" di halaman hasil kamar mandi: logika murni, terpisah dari komponen.
import { statusButir, type PetaJawaban } from "./asesmen";
import { OBJEK_DENAH, type LetakDenah, type ObjekDenah, type VarianShower } from "./denahPindai";
import type { ModeGambar } from "./gambarShower";

/** Pertanyaan yang penyesuaiannya sudah punya gambar: perlengkapan mandi (hand shower dan jangkauan). */
export const PERTANYAAN_SHOWER = "M-07";

/** Gambar "setelah" hanya digambar bila jawabannya memang menunjukkan hambatan; "belum tahu" tidak ditebak. */
export function perluPenyesuaianShower(jawaban: PetaJawaban): boolean {
  return statusButir(jawaban[PERTANYAAN_SHOWER]) === "penyesuaian";
}

/**
 * Keadaan yang boleh dipilih: "kondisi" selalu; "hack" dan "permanen" hanya bila ada penyesuaian untuk digambar.
 * Gambar penyesuaian baru ada untuk hand shower yang digantung; jenis shower lain tidak punya gambar "setelah".
 */
export function modeTersedia(jawaban: PetaJawaban, varian: VarianShower): ModeGambar[] {
  return perluPenyesuaianShower(jawaban) && varian === "hand_shower_gantung" ? ["kondisi", "hack", "permanen"] : ["kondisi"];
}

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
