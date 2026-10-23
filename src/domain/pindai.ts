// Pembacaan foto: bentuk jawaban Gemini dan aturan mengisi jawaban dari foto (fungsi murni).
import { z } from "zod";
import type { AturanFoto, Pertanyaan } from "./konten";
import type { PetaJawaban } from "./asesmen";

export const NILAI_FOTO = ["ya", "tidak", "tidak_jelas"] as const;
export const MAKS_FOTO = 6;
export const MAKS_ALASAN = 140;

export const SkemaHasilFoto = z.object({
  kamar_mandi: z.boolean(),
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
  terisi: number;
}

/**
 * Mengisi jawaban dari hasil pembacaan foto. Aturannya sengaja berhati-hati:
 * - bukan kamar mandi → tidak mengisi apa pun;
 * - "tidak_jelas" tidak pernah mengisi;
 * - pertanyaan berstatus "tidak" tidak diisi dari foto, dan "sebagian" hanya boleh terisi "Tidak" (hambatan yang jelas terlihat);
 * - jawaban yang sudah dipilih pengguna tidak ditimpa.
 */
export function isiDariFoto(daftar: Pertanyaan[], aturan: Record<string, AturanFoto>, hasil: HasilFoto, sudah: PetaJawaban): IsiFoto {
  const jawaban: PetaJawaban = { ...sudah };
  let terisi = 0;
  if (!hasil.kamar_mandi) return { jawaban, terisi };
  const dari = new Map(hasil.jawaban.map((j) => [j.id, j]));
  for (const p of daftar) {
    const a = aturan[p.id];
    const h = dari.get(p.id);
    if (!a || a === "tidak" || !h || h.nilai === "tidak_jelas") continue;
    if (a === "sebagian" && h.nilai === "ya") continue;
    if (jawaban[p.id]?.sumber === "pengguna") continue;
    jawaban[p.id] = { nilai: h.nilai, sumber: "foto", alasan: h.alasan?.trim().slice(0, MAKS_ALASAN) || undefined };
    terisi += 1;
  }
  return { jawaban, terisi };
}

/** Pertanyaan yang boleh ditanyakan ke AI untuk satu area (aturan bukan "tidak"). */
export function pertanyaanUntukAI(daftar: Pertanyaan[], aturan: Record<string, AturanFoto>): Pertanyaan[] {
  return daftar.filter((p) => aturan[p.id] === "bisa" || aturan[p.id] === "sebagian");
}
