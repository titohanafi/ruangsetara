// Logika murni: jawaban pengguna → status tiap butir dan ringkasan hasil.
import type { Pertanyaan } from "./konten";

export type Nilai = "ya" | "tidak" | "belum";
export type Sumber = "pengguna" | "foto";
export interface Jawaban {
  nilai: Nilai;
  sumber: Sumber;
  /** Alasan singkat dari pembacaan foto; hanya ada bila sumber = "foto". */
  alasan?: string;
  /**
   * AI mengisi "Belum tahu" (belum bisa memastikan dari foto) dan menunggu pengguna memeriksa sendiri lalu memilih jawaban.
   * Selama true, jawaban ini belum dihitung sebagai terjawab dan tombol lanjut tetap nonaktif.
   */
  perluTinjau?: boolean;
}
export type PetaJawaban = Record<string, Jawaban>;

/** sesuai = memenuhi indikator; penyesuaian = ada hambatan; belum = belum dapat dipastikan (kategori D di sheet peneliti). */
export type StatusButir = "sesuai" | "penyesuaian" | "belum";

export function statusButir(j: Jawaban | undefined): StatusButir | null {
  if (!j) return null;
  return j.nilai === "ya" ? "sesuai" : j.nilai === "tidak" ? "penyesuaian" : "belum";
}

export interface Butir {
  pertanyaan: Pertanyaan;
  jawaban: Jawaban;
  status: StatusButir;
}

const URUTAN: Record<StatusButir, number> = { penyesuaian: 0, belum: 1, sesuai: 2 };

/** Butir yang sudah dijawab, hambatan lebih dulu; urutan asli sheet dipertahankan di dalam tiap kelompok. */
export function butirHasil(daftar: Pertanyaan[], jawaban: PetaJawaban): Butir[] {
  const hasil: Butir[] = [];
  for (const pertanyaan of daftar) {
    const j = jawaban[pertanyaan.id];
    const status = statusButir(j);
    if (j && status) hasil.push({ pertanyaan, jawaban: j, status });
  }
  return hasil
    .map((b, i) => ({ b, i }))
    .sort((x, y) => URUTAN[x.b.status] - URUTAN[y.b.status] || x.i - y.i)
    .map(({ b }) => b);
}

export interface Ringkasan {
  total: number;
  terjawab: number;
  sesuai: number;
  penyesuaian: number;
  belum: number;
  dariFoto: number;
}

export function ringkas(daftar: Pertanyaan[], jawaban: PetaJawaban): Ringkasan {
  const r: Ringkasan = { total: daftar.length, terjawab: 0, sesuai: 0, penyesuaian: 0, belum: 0, dariFoto: 0 };
  for (const p of daftar) {
    const j = jawaban[p.id];
    const s = statusButir(j);
    if (!j || !s || j.perluTinjau) continue;
    r.terjawab += 1;
    r[s] += 1;
    if (j.sumber === "foto") r.dariFoto += 1;
  }
  return r;
}
