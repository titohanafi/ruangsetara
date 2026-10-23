// Gambar "Ruang Anda" di halaman hasil kamar mandi: logika murni, terpisah dari komponen.
import { OBJEK_DENAH, type LetakDenah, type ObjekDenah } from "./denahPindai";
import { BERGAMBAR } from "./bergambar";

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

/**
 * Sudut pandang untuk gambar satu pertanyaan: sisi yang memperlihatkan benda yang dipasangi (salah satu cukup). Bila benda itu
 * hanya ada di dinding yang tidak pernah tergambar (mis. pintu di dinding depan), `semua` = true supaya benda tetap ditampilkan.
 * Pertanyaan yang tidak bergantung pada benda (lantai, ruang bebas) memakai sudut awal.
 */
export function sudutUntuk(
  id: string,
  letak: (id: ObjekDenah) => LetakDenah,
  tidakTerlihat: readonly ObjekDenah[] = [],
): { sudut: SudutPandang; semua: boolean } {
  const perlu = id === "M-07" ? (["area_mandi"] as const) : (BERGAMBAR[id] ?? []);
  if (perlu.length === 0) return { sudut: sudutAwal(letak, tidakTerlihat), semua: false };
  const terlihat = (sisi: SudutPandang) =>
    perlu.filter((o) => !tidakTerlihat.includes(o) && (letak(o).dinding === "belakang" || letak(o).dinding === sisi)).length;
  const [kanan, kiri] = [terlihat("kanan"), terlihat("kiri")];
  if (kanan === 0 && kiri === 0) return { sudut: "kanan", semua: true };
  return { sudut: kiri > kanan ? "kiri" : "kanan", semua: false };
}
