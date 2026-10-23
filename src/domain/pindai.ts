// Pembacaan foto: bentuk jawaban Gemini dan aturan mengisi jawaban dari foto (fungsi murni).
import { z } from "zod";
import type { AturanFoto, Pertanyaan } from "./konten";
import type { PetaJawaban } from "./asesmen";

export const NILAI_FOTO = ["ya", "tidak", "tidak_jelas"] as const;
export const MAKS_FOTO = 6;
export const MAKS_ALASAN = 160;

export const SkemaHasilFoto = z.object({
  ruang_sesuai: z.boolean(),
  jawaban: z.array(z.object({ id: z.string(), nilai: z.enum(NILAI_FOTO), alasan: z.string().optional() })),
});
export type HasilFoto = z.infer<typeof SkemaHasilFoto>;

/** Memvalidasi jawaban mentah; null bila bentuknya salah. */
export function bacaHasilFoto(mentah: unknown): HasilFoto | null {
  const r = SkemaHasilFoto.safeParse(mentah);
  return r.success ? r.data : null;
}

export interface IsiFoto {
  jawaban: PetaJawaban;
  /** Jumlah jawaban Ya atau Tidak yang terisi dari foto. */
  terisi: number;
  /**
   * Catatan AI untuk pertanyaan yang belum bisa dipastikan dari foto (apa yang terlihat dan kenapa belum cukup); bisa kosong
   * bila AI tidak menulis apa pun. Pertanyaan ini diisi "Belum tahu" (`perluTinjau`) dan menunggu pengguna.
   */
  catatan: Record<string, string>;
}

/**
 * Mengisi jawaban dari hasil pembacaan foto. Aturannya sengaja berhati-hati:
 * - foto bukan ruangan yang dipilih → tidak mengisi apa pun;
 * - "tidak_jelas" tidak mengisi Ya atau Tidak: diisi "Belum tahu" yang menunggu pengguna (`perluTinjau`), dengan catatan AI;
 * - pertanyaan berstatus "tidak" tidak diisi dari foto, dan "sebagian" hanya boleh terisi "Tidak" (hambatan yang jelas terlihat);
 *   "Ya" yang tidak boleh diperlakukan seperti "tidak jelas" dan catatannya dibuang karena terbaca seperti kesimpulan;
 * - jawaban yang sudah dipilih pengguna tidak ditimpa.
 */
export function isiDariFoto(daftar: Pertanyaan[], aturan: Record<string, AturanFoto>, hasil: HasilFoto, sudah: PetaJawaban): IsiFoto {
  const jawaban: PetaJawaban = { ...sudah };
  const catatan: Record<string, string> = {};
  let terisi = 0;
  if (!hasil.ruang_sesuai) return { jawaban, terisi, catatan };
  const dari = new Map(hasil.jawaban.map((j) => [j.id, j]));
  for (const p of daftar) {
    const a = aturan[p.id];
    const h = dari.get(p.id);
    if (!a || a === "tidak" || !h) continue;
    const alasan = h.alasan?.trim().slice(0, MAKS_ALASAN) || undefined;
    const belumPasti = h.nilai === "tidak_jelas" || (a === "sebagian" && h.nilai === "ya");
    if (belumPasti) {
      // Catatan "Ya" yang tidak boleh dibuang: kalimatnya ditulis AI sebagai kesimpulan, jadi bisa terbaca seperti jawaban.
      catatan[p.id] = h.nilai === "tidak_jelas" ? (alasan ?? "") : "";
      if (jawaban[p.id]?.sumber !== "pengguna")
        jawaban[p.id] = { nilai: "belum", sumber: "foto", alasan: catatan[p.id] || undefined, perluTinjau: true };
      continue;
    }
    if (jawaban[p.id]?.sumber === "pengguna") continue;
    if (h.nilai === "tidak_jelas") continue; // sudah ditangani di atas; penyempit tipe
    jawaban[p.id] = { nilai: h.nilai, sumber: "foto", alasan };
    terisi += 1;
  }
  return { jawaban, terisi, catatan };
}

/** Pertanyaan yang boleh ditanyakan ke AI untuk satu area (aturan bukan "tidak"). */
export function pertanyaanUntukAI(daftar: Pertanyaan[], aturan: Record<string, AturanFoto>): Pertanyaan[] {
  return daftar.filter((p) => aturan[p.id] === "bisa" || aturan[p.id] === "sebagian");
}
