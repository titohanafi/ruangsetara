// Pembacaan benda dapur dari foto untuk gambar ruang dapur: hanya benda yang jelas terlihat yang digambar.
// Tidak ada tata letak contoh sebagai cadangan: bila tidak ada benda yang terbaca, gambar ruang tidak dibuat.
// Posisi benda di sepanjang dinding belakang adalah urutan tetap (bukan hasil baca foto); yang dibaca dari foto hanya ADA atau TIDAK.

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

export interface HasilDenahDapur {
  /** Foto menampilkan dapur; bila false, gambar ruang tidak dibuat. */
  dapur: boolean;
  /** true hanya bila bendanya jelas terlihat; ragu = false. */
  terbaca: Record<ObjekDapur, boolean>;
}

const adalahObjek = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/**
 * Memeriksa respons fungsi server denah dapur (ditulis tangan agar zod tidak ikut bundel). Nilai selain `true` dianggap
 * tidak terbaca. Null bila bentuknya salah.
 */
export function bacaHasilDenahDapur(x: unknown): HasilDenahDapur | null {
  if (!adalahObjek(x) || typeof x.dapur !== "boolean") return null;
  const mentah = adalahObjek(x.objek) ? x.objek : {};
  const terbaca = Object.fromEntries(OBJEK_DAPUR.map((id) => [id, mentah[id] === true])) as Record<ObjekDapur, boolean>;
  return { dapur: x.dapur, terbaca };
}

/** Himpunan nama lapisan benda yang terbaca, untuk penyusun gambar dapur. */
export const lapisanTerbaca = (h: HasilDenahDapur): ReadonlySet<string> =>
  new Set(OBJEK_DAPUR.filter((id) => h.terbaca[id]).map((id) => LAPISAN_DAPUR[id]));

/** Gambar dapur dibuat hanya bila fotonya dapur dan sedikitnya satu benda terbaca. */
export const bisaDigambarDapur = (h: HasilDenahDapur | null): h is HasilDenahDapur =>
  !!h && h.dapur && OBJEK_DAPUR.some((id) => h.terbaca[id]);

/** Hasil tiruan untuk mode pengembangan (`VITE_PINDAI_MOCK=true`): kompor, wastafel, meja kerja, dan pintu terbaca; kulkas tidak. */
export const DENAH_DAPUR_TIRUAN: HasilDenahDapur = {
  dapur: true,
  terbaca: { meja_kerja: true, kompor: true, wastafel: true, kulkas: false, pintu: true },
};
