// Gambar "Ruang Anda" di halaman hasil kamar mandi: logika murni, terpisah dari komponen.
import { titikDinding } from "./denahGeometri";
import { OBJEK_DENAH, type LetakDenah, type ObjekDenah } from "./denahPindai";
import { DIM } from "./dimensiGambar";
import type { UkuranRuang } from "./tataLetak";
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

/**
 * Ukuran ruang untuk gambar ringkasan "setelah modifikasi" (keputusan pemilik: ruang boleh diperluas karena modifikasi menuju
 * kondisi ideal). Hanya diperluas bila area shower tanpa undakan (M-08) ikut digambar, dan seperlunya: sumbu tegak lurus dinding
 * shower dibuat selebar ruang putar + lebar area shower (152,5 + 76 cm dari tabel) supaya ruang putar tidak tumpang tindih dengan
 * area shower. Sumbu lain dan ruang selebihnya tetap. Tanpa M-08 ukurannya tetap `DIM.ruang`.
 */
export function ruangIdeal(letak: (id: ObjekDenah) => LetakDenah, aktif: readonly string[]): UkuranRuang {
  const dasar = { lebar: DIM.ruang.lebar, dalam: DIM.ruang.dalam };
  if (!aktif.includes("M-08")) return dasar;
  const kebutuhan = DIM.ruangPutar + DIM.rollIn.lebar;
  const dinding = titikDinding(letak("area_mandi")).dinding;
  return dinding === "kiri" || dinding === "kanan"
    ? { lebar: Math.max(dasar.lebar, kebutuhan), dalam: dasar.dalam }
    : { lebar: dasar.lebar, dalam: Math.max(dasar.dalam, kebutuhan) };
}
