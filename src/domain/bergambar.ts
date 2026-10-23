// Daftar ringan pertanyaan yang punya gambar modifikasi dan benda yang dipasangi. Dipisah dari `gambarModifikasi.ts` supaya halaman
// hasil bisa memutuskan kartu mana yang bergambar tanpa memuat kode gambar dan tabel ukuran (itu dimuat malas bersama gambarnya).
import type { ObjekDenah } from "./denahPindai";

/**
 * Pertanyaan yang sudah punya gambar modifikasi, dan benda di ruangan yang dipasangi. Gambar dibuat bila **salah satu** benda
 * itu terlihat di foto; daftar kosong berarti gambarnya tidak bergantung pada benda tertentu (lantai atau ruang bebas).
 * M-01, M-04, dan sebagian M-06 dan M-12 menggambar lewat penggantian benda di `PratinjauRuangIso3D` (warna hijau).
 */
export const BERGAMBAR: Record<string, readonly ObjekDenah[]> = {
  "M-01": ["pintu"],
  "M-02": [],
  "M-03": ["kloset"],
  "M-04": ["kloset"],
  "M-05": ["kloset"],
  "M-06": ["wastafel"],
  "M-08": ["area_mandi"],
  "M-09": [],
  "M-10": ["area_mandi"],
  "M-11": ["area_mandi", "wastafel"],
  "M-12": ["kloset", "area_mandi", "pintu"],
};
