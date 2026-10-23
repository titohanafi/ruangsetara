// Gambar "Ruang Anda" di halaman hasil kamar mandi: logika murni, terpisah dari komponen.
import { statusButir, type PetaJawaban } from "./asesmen";
import type { ModeGambar } from "./gambarShower";

/** Pertanyaan yang penyesuaiannya sudah punya gambar: perlengkapan mandi (hand shower dan jangkauan). */
export const PERTANYAAN_SHOWER = "M-07";

/** Gambar "setelah" hanya digambar bila jawabannya memang menunjukkan hambatan; "belum tahu" tidak ditebak. */
export function perluPenyesuaianShower(jawaban: PetaJawaban): boolean {
  return statusButir(jawaban[PERTANYAAN_SHOWER]) === "penyesuaian";
}

/** Keadaan yang boleh dipilih: "kondisi" selalu; "hack" dan "permanen" hanya bila ada penyesuaian untuk digambar. */
export function modeTersedia(jawaban: PetaJawaban): ModeGambar[] {
  return perluPenyesuaianShower(jawaban) ? ["kondisi", "hack", "permanen"] : ["kondisi"];
}
