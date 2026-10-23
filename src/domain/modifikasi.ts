// Gambar "setelah modifikasi" di kartu Ruang Anda: pertanyaan mana yang digambar, mana yang belum, dan mana yang tidak bisa
// digambar karena bendanya tidak terbaca di foto. Fungsi murni.
import { statusButir, type PetaJawaban } from "./asesmen";
import type { HasilDenah, ObjekDenah } from "./denahPindai";
import { BERGAMBAR } from "./bergambar";
import type { Pertanyaan } from "./konten";

export type ModeRuang = "kondisi" | "modifikasi";

/** Pertanyaan perlengkapan mandi: gambarnya hand shower di jangkauan (sudah ada), hanya untuk hand shower yang digantung. */
export const PERTANYAAN_SHOWER = "M-07";

export interface RingkasModifikasi {
  /** Pertanyaan yang dijawab Tidak dan digambar. */
  digambar: Pertanyaan[];
  /** Dijawab Tidak, tetapi belum punya gambar. */
  belumDigambar: Pertanyaan[];
  /** Dijawab Tidak dan punya gambar, tetapi benda yang dipasangi tidak terbaca di foto. */
  bendaTakTerlihat: Pertanyaan[];
}

/** Benda yang dipasangi gambar pertanyaan itu; undefined bila belum ada gambarnya. */
function bendaPerlu(id: string): readonly ObjekDenah[] | undefined {
  if (id === PERTANYAAN_SHOWER) return ["area_mandi"];
  return BERGAMBAR[id];
}

export function ringkasModifikasi(daftar: Pertanyaan[], jawaban: PetaJawaban, denah: HasilDenah): RingkasModifikasi {
  const hasil: RingkasModifikasi = { digambar: [], belumDigambar: [], bendaTakTerlihat: [] };
  for (const p of daftar) {
    if (statusButir(jawaban[p.id]) !== "penyesuaian") continue;
    const benda = bendaPerlu(p.id);
    const bisaGambar = benda !== undefined && (p.id !== PERTANYAAN_SHOWER || denah.varianShower === "hand_shower_gantung");
    if (!bisaGambar) hasil.belumDigambar.push(p);
    else if (benda.length > 0 && benda.every((o) => denah.objek[o].dinding === "tidak_terlihat")) hasil.bendaTakTerlihat.push(p);
    else hasil.digambar.push(p);
  }
  return hasil;
}
