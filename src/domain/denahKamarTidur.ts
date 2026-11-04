// Pembacaan benda kamar tidur dari foto untuk gambar ruang kamar tidur (lihat denahBenda.ts): hanya benda yang jelas terlihat digambar.
import { bacaBenda, bisaDigambar, lapisanBenda, type HasilBenda, type KonfigBenda } from "./denahBenda";

/** Benda kamar tidur yang dicari di foto. */
export const OBJEK_KAMAR_TIDUR = ["tempat_tidur", "nakas", "lemari", "pintu", "saklar_stopkontak"] as const;
export type ObjekKamarTidur = (typeof OBJEK_KAMAR_TIDUR)[number];

/** Nama lapisan di gambar kamar tidur (gambarKamarTidur.ts) untuk tiap benda yang dibaca. */
export const LAPISAN_KAMAR_TIDUR: Readonly<Record<ObjekKamarTidur, string>> = {
  tempat_tidur: "tempatTidur",
  nakas: "nakas",
  lemari: "lemari",
  pintu: "pintu",
  saklar_stopkontak: "saklar",
};

const KONFIG: KonfigBenda<ObjekKamarTidur> = { objek: OBJEK_KAMAR_TIDUR, lapisan: LAPISAN_KAMAR_TIDUR };

export interface HasilDenahKamarTidur {
  /** Foto menampilkan kamar tidur; bila false, gambar ruang tidak dibuat. */
  kamarTidur: boolean;
  /** true hanya bila bendanya jelas terlihat; ragu = false. */
  terbaca: Record<ObjekKamarTidur, boolean>;
}

const dariUmum = (h: HasilBenda<ObjekKamarTidur> | null): HasilDenahKamarTidur | null =>
  h ? { kamarTidur: h.ruang, terbaca: h.terbaca } : null;
const keUmum = (h: HasilDenahKamarTidur): HasilBenda<ObjekKamarTidur> => ({ ruang: h.kamarTidur, terbaca: h.terbaca });

export const bacaHasilDenahKamarTidur = (x: unknown): HasilDenahKamarTidur | null => dariUmum(bacaBenda(KONFIG, "kamar_tidur", x));
export const lapisanTerbacaKamarTidur = (h: HasilDenahKamarTidur): ReadonlySet<string> => lapisanBenda(KONFIG, keUmum(h));
export const bisaDigambarKamarTidur = (h: HasilDenahKamarTidur | null): h is HasilDenahKamarTidur =>
  bisaDigambar(KONFIG, h ? keUmum(h) : null);

/** Hasil tiruan untuk mode pengembangan (`VITE_PINDAI_MOCK=true`): tempat tidur, nakas, lemari, dan pintu terbaca; saklar tidak. */
export const DENAH_KAMAR_TIDUR_TIRUAN: HasilDenahKamarTidur = {
  kamarTidur: true,
  terbaca: { tempat_tidur: true, nakas: true, lemari: true, pintu: true, saklar_stopkontak: false },
};
