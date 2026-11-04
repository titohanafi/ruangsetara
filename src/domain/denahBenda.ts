// Pembacaan benda ruang dari foto untuk gambar ruang bertata letak tetap (dapur, kamar tidur, mobilitas): hanya benda yang jelas
// terlihat yang digambar, tanpa tata letak contoh. Yang dibaca dari foto hanya ADA atau TIDAK; posisi di sepanjang dinding adalah
// urutan tetap, bukan hasil baca foto.

/** Hasil pembacaan: apakah fotonya ruang yang dimaksud, dan benda mana yang jelas terlihat (ragu = false). */
export interface HasilBenda<T extends string> {
  ruang: boolean;
  terbaca: Record<T, boolean>;
}

/** Konfigurasi satu ruang: daftar benda yang dicari dan nama lapisan gambarnya. */
export interface KonfigBenda<T extends string> {
  objek: readonly T[];
  lapisan: Readonly<Record<T, string>>;
}

const adalahObjek = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/**
 * Memeriksa respons fungsi server (ditulis tangan agar zod tidak ikut bundel). `kunciRuang` = nama field boolean ruang di respons
 * (mis. "dapur"). Nilai selain `true` dianggap tidak terbaca. Null bila bentuknya salah.
 */
export function bacaBenda<T extends string>(konfig: KonfigBenda<T>, kunciRuang: string, x: unknown): HasilBenda<T> | null {
  if (!adalahObjek(x) || typeof x[kunciRuang] !== "boolean") return null;
  const mentah = adalahObjek(x.objek) ? x.objek : {};
  const terbaca = Object.fromEntries(konfig.objek.map((id) => [id, mentah[id] === true])) as Record<T, boolean>;
  return { ruang: x[kunciRuang] as boolean, terbaca };
}

/** Himpunan nama lapisan benda yang terbaca, untuk penyusun gambar ruang. */
export const lapisanBenda = <T extends string>(konfig: KonfigBenda<T>, h: HasilBenda<T>): ReadonlySet<string> =>
  new Set(konfig.objek.filter((id) => h.terbaca[id]).map((id) => konfig.lapisan[id]));

/** Gambar dibuat hanya bila fotonya ruang yang dimaksud dan sedikitnya satu benda terbaca. */
export const bisaDigambar = <T extends string>(konfig: KonfigBenda<T>, h: HasilBenda<T> | null): h is HasilBenda<T> =>
  !!h && h.ruang && konfig.objek.some((id) => h.terbaca[id]);
