// Pembacaan benda area mobilitas (ruang tamu, lorong, atau pintu masuk) dari foto untuk gambar ruang (lihat denahBenda.ts): hanya benda
// yang jelas terlihat yang digambar.
import { bacaBenda, bisaDigambar, lapisanBenda, type HasilBenda, type KonfigBenda } from "./denahBenda";

/** Benda area mobilitas yang dicari di foto. */
export const OBJEK_MOBILITAS = ["pintu", "undakan", "lemari_tanam", "furnitur_besar", "saklar_stopkontak", "karpet"] as const;
export type ObjekMobilitas = (typeof OBJEK_MOBILITAS)[number];

/** Nama lapisan di gambar mobilitas (gambarMobilitas.ts) untuk tiap benda yang dibaca. */
export const LAPISAN_MOBILITAS: Readonly<Record<ObjekMobilitas, string>> = {
  pintu: "pintu",
  undakan: "undakan",
  lemari_tanam: "lemariTanam",
  furnitur_besar: "meja",
  saklar_stopkontak: "saklar",
  karpet: "karpet",
};

const KONFIG: KonfigBenda<ObjekMobilitas> = { objek: OBJEK_MOBILITAS, lapisan: LAPISAN_MOBILITAS };

export interface HasilDenahMobilitas {
  /** Foto menampilkan bagian dalam rumah (ruang tamu, lorong, atau pintu masuk); bila false, gambar ruang tidak dibuat. */
  areaRumah: boolean;
  /** true hanya bila bendanya jelas terlihat; ragu = false. */
  terbaca: Record<ObjekMobilitas, boolean>;
}

const dariUmum = (h: HasilBenda<ObjekMobilitas> | null): HasilDenahMobilitas | null =>
  h ? { areaRumah: h.ruang, terbaca: h.terbaca } : null;
const keUmum = (h: HasilDenahMobilitas): HasilBenda<ObjekMobilitas> => ({ ruang: h.areaRumah, terbaca: h.terbaca });

export const bacaHasilDenahMobilitas = (x: unknown): HasilDenahMobilitas | null => dariUmum(bacaBenda(KONFIG, "area_rumah", x));
export const lapisanTerbacaMobilitas = (h: HasilDenahMobilitas): ReadonlySet<string> => lapisanBenda(KONFIG, keUmum(h));
export const bisaDigambarMobilitas = (h: HasilDenahMobilitas | null): h is HasilDenahMobilitas =>
  bisaDigambar(KONFIG, h ? keUmum(h) : null);

/** Hasil tiruan untuk mode pengembangan (`VITE_PINDAI_MOCK=true`): pintu, lemari tanam, dan furnitur besar terbaca; lainnya tidak. */
export const DENAH_MOBILITAS_TIRUAN: HasilDenahMobilitas = {
  areaRumah: true,
  terbaca: { pintu: true, undakan: false, lemari_tanam: true, furnitur_besar: true, saklar_stopkontak: false, karpet: false },
};
