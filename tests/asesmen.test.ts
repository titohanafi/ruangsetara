import { describe, expect, it } from "vitest";
import { butirHasil, ringkas, statusButir, type PetaJawaban } from "../src/domain/asesmen";
import { PERTANYAAN } from "../src/domain/konten";

const daftar = PERTANYAAN["kamar-mandi"].pertanyaan;

describe("statusButir", () => {
  it("memetakan jawaban ke status", () => {
    expect(statusButir({ nilai: "ya", sumber: "pengguna" })).toBe("sesuai");
    expect(statusButir({ nilai: "tidak", sumber: "pengguna" })).toBe("penyesuaian");
    expect(statusButir({ nilai: "belum", sumber: "pengguna" })).toBe("belum");
    expect(statusButir(undefined)).toBeNull();
  });
});

describe("ringkas dan butirHasil", () => {
  const jawaban: PetaJawaban = {
    "M-01": { nilai: "ya", sumber: "pengguna" },
    "M-02": { nilai: "tidak", sumber: "foto", alasan: "x" },
    "M-03": { nilai: "belum", sumber: "pengguna" },
    "M-04": { nilai: "tidak", sumber: "pengguna" },
  };

  it("menghitung tiap status dan jawaban dari foto", () => {
    expect(ringkas(daftar, jawaban)).toEqual({ total: 12, terjawab: 4, sesuai: 1, penyesuaian: 2, belum: 1, dariFoto: 1 });
  });

  it("mengurutkan hambatan dulu, lalu belum pasti, lalu sesuai, dengan urutan sheet di dalam kelompok", () => {
    expect(butirHasil(daftar, jawaban).map((b) => b.pertanyaan.id)).toEqual(["M-02", "M-04", "M-03", "M-01"]);
  });

  it("tanpa jawaban: tidak ada butir", () => {
    expect(butirHasil(daftar, {})).toEqual([]);
    expect(ringkas(daftar, {}).terjawab).toBe(0);
  });
});
