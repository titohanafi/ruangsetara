// Daftar ringan pertanyaan yang punya gambar modifikasi pada ruang bertata letak tetap (dapur, kamar tidur, mobilitas). Dipisah dari
// kode gambarnya supaya halaman hasil bisa memutuskan kartu mana yang bergambar tanpa memuatnya (dimuat malas bersama gambar).
// Kamar mandi tidak di sini: tata letaknya dibaca dari foto (lihat `bergambar.ts`).
export const BERGAMBAR_TETAP: Readonly<Record<string, ReadonlySet<string>>> = {
  dapur: new Set(["K-01", "K-02", "K-03", "K-04", "K-05", "K-06", "K-08"]),
  "kamar-tidur": new Set(["B-01", "B-02", "B-03", "B-04", "B-06", "B-07", "B-08", "B-10"]),
  mobilitas: new Set(["G-01", "G-02", "G-03", "G-04", "G-05", "G-06", "G-07", "G-08", "G-09"]),
};

/** Alternatif dari teks Modifikasi sheet yang digambar sebagai gambar tambahan di kartu (kunci = id pertanyaan, nilai = id gambar "ID~alternatif"). */
export const VARIAN_TETAP: Readonly<Record<string, readonly string[]>> = {
  "B-01": ["B-01~tirai"],
  "G-03": ["G-03~geser"],
};
