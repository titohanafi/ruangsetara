// State asesmen. Sengaja hanya di memori (tidak ke localStorage): situs peneliti berjanji jawaban dan foto hilang saat halaman dimuat ulang.
import type { Nilai, PetaJawaban } from "../domain/asesmen";
import type { HasilDenah } from "../domain/denahPindai";

export interface Foto {
  id: string;
  /** Data URL JPEG yang sudah dikecilkan di perangkat. */
  url: string;
}

export type StatusBaca = "belum" | "membaca" | "selesai" | "sering" | "gagal";

export interface HasilBaca {
  status: StatusBaca;
  terisi: number;
  total: number;
  bukanRuangan: boolean;
}

export interface State {
  areaId: string | null;
  fotos: Foto[];
  baca: HasilBaca;
  /** Tata letak kamar mandi hasil baca foto pertama; null bila belum dibaca, gagal, atau bukan kamar mandi. */
  denah: HasilDenah | null;
  profil: Record<string, string>;
  aktivitas: string | null;
  jawaban: PetaJawaban;
  indeks: number;
}

export const BACA_AWAL: HasilBaca = { status: "belum", terisi: 0, total: 0, bukanRuangan: false };

export const AWAL: State = { areaId: null, fotos: [], baca: BACA_AWAL, denah: null, profil: {}, aktivitas: null, jawaban: {}, indeks: 0 };

export type Aksi =
  | { jenis: "pilih_area"; areaId: string }
  | { jenis: "tambah_foto"; foto: Foto }
  | { jenis: "hapus_foto"; id: string }
  | { jenis: "mulai_baca" }
  | { jenis: "selesai_baca"; jawaban: PetaJawaban; terisi: number; total: number; bukanRuangan: boolean }
  | { jenis: "gagal_baca"; sering: boolean }
  | { jenis: "selesai_denah"; denah: HasilDenah | null }
  | { jenis: "isi_profil"; id: string; nilai: string }
  | { jenis: "pilih_aktivitas"; aktivitas: string }
  | { jenis: "jawab"; id: string; nilai: Nilai }
  | { jenis: "ke_pertanyaan"; indeks: number }
  | { jenis: "area_lain" }
  | { jenis: "ulang" };

/** Buang jawaban yang berasal dari foto (dipakai saat foto berubah, karena hasil bacanya jadi tidak berlaku). */
function tanpaJawabanFoto(jawaban: PetaJawaban): PetaJawaban {
  return Object.fromEntries(Object.entries(jawaban).filter(([, j]) => j.sumber !== "foto"));
}

export function reducer(s: State, a: Aksi): State {
  switch (a.jenis) {
    case "pilih_area":
      if (s.areaId === a.areaId) return s;
      // Ganti area: pertanyaan, prioritas, dan hasil baca foto milik area lama tidak berlaku lagi. Foto dan profil tetap.
      return { ...s, areaId: a.areaId, baca: BACA_AWAL, denah: null, aktivitas: null, jawaban: {}, indeks: 0 };
    case "tambah_foto":
      return { ...s, fotos: [...s.fotos, a.foto], baca: BACA_AWAL, denah: null, jawaban: tanpaJawabanFoto(s.jawaban) };
    case "hapus_foto":
      return { ...s, fotos: s.fotos.filter((f) => f.id !== a.id), baca: BACA_AWAL, denah: null, jawaban: tanpaJawabanFoto(s.jawaban) };
    case "mulai_baca":
      return { ...s, baca: { ...BACA_AWAL, status: "membaca" } };
    case "selesai_baca":
      return {
        ...s,
        jawaban: a.jawaban,
        baca: { status: "selesai", terisi: a.terisi, total: a.total, bukanRuangan: a.bukanRuangan },
      };
    case "gagal_baca":
      return { ...s, baca: { ...BACA_AWAL, status: a.sering ? "sering" : "gagal" } };
    case "selesai_denah":
      return { ...s, denah: a.denah };
    case "isi_profil":
      return { ...s, profil: { ...s.profil, [a.id]: a.nilai } };
    case "pilih_aktivitas":
      return { ...s, aktivitas: a.aktivitas };
    case "jawab":
      return { ...s, jawaban: { ...s.jawaban, [a.id]: { nilai: a.nilai, sumber: "pengguna" } } };
    case "ke_pertanyaan":
      return { ...s, indeks: Math.max(0, a.indeks) };
    case "area_lain":
      return { ...AWAL, profil: s.profil };
    case "ulang":
      return AWAL;
  }
}
