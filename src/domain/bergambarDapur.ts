// Daftar ringan pertanyaan dapur yang punya gambar modifikasi. Dipisah dari `gambarDapur.ts` supaya halaman hasil bisa memutuskan
// kartu mana yang bergambar tanpa memuat kode gambarnya (dimuat malas bersama gambar).
// K-05 menggambar laci dan pegangan, K-08 stopkontak dan detektor. K-08 (pertanyaan keselamatan) hanya menggambar bagian yang
// disebut teks Modifikasi; lantai tidak licin tidak digambar.
export const BERGAMBAR_DAPUR: ReadonlySet<string> = new Set(["K-01", "K-02", "K-03", "K-04", "K-05", "K-06", "K-08"]);
