// Pembacaan benda dapur dari foto untuk gambar ruang dapur (lihat denahBenda.ts): hanya benda yang jelas terlihat yang digambar.
import { bacaBenda, bisaDigambar, lapisanBenda, type HasilBenda, type KonfigBenda } from "./denahBenda";

/** Benda dapur yang dicari di foto. Urutan = urutan tampil kiri ke kanan di gambar. */
export const OBJEK_DAPUR = ["meja_kerja", "kompor", "wastafel", "kulkas", "pintu"] as const;
export type ObjekDapur = (typeof OBJEK_DAPUR)[number];

/** Nama lapisan di gambar dapur (gambarDapur.ts) untuk tiap benda yang dibaca. */
export const LAPISAN_DAPUR: Readonly<Record<ObjekDapur, string>> = {
  meja_kerja: "meja",
  kompor: "kompor",
  wastafel: "wastafel",
  kulkas: "kulkas",
  pintu: "pintu",
};

const KONFIG: KonfigBenda<ObjekDapur> = { objek: OBJEK_DAPUR, lapisan: LAPISAN_DAPUR };

export interface HasilDenahDapur {
  /** Foto menampilkan dapur; bila false, gambar ruang tidak dibuat. */
  dapur: boolean;
  /** true hanya bila bendanya jelas terlihat; ragu = false. */
  terbaca: Record<ObjekDapur, boolean>;
}

const dariUmum = (h: HasilBenda<ObjekDapur> | null): HasilDenahDapur | null => (h ? { dapur: h.ruang, terbaca: h.terbaca } : null);
const keUmum = (h: HasilDenahDapur): HasilBenda<ObjekDapur> => ({ ruang: h.dapur, terbaca: h.terbaca });

export const bacaHasilDenahDapur = (x: unknown): HasilDenahDapur | null => dariUmum(bacaBenda(KONFIG, "dapur", x));
export const lapisanTerbaca = (h: HasilDenahDapur): ReadonlySet<string> => lapisanBenda(KONFIG, keUmum(h));
export const bisaDigambarDapur = (h: HasilDenahDapur | null): h is HasilDenahDapur => bisaDigambar(KONFIG, h ? keUmum(h) : null);

/** Hasil tiruan untuk mode pengembangan (`VITE_PINDAI_MOCK=true`): kompor, wastafel, meja kerja, dan pintu terbaca; kulkas tidak. */
export const DENAH_DAPUR_TIRUAN: HasilDenahDapur = {
  dapur: true,
  terbaca: { meja_kerja: true, kompor: true, wastafel: true, kulkas: false, pintu: true },
};
