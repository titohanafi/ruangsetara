import { describe, expect, it } from "vitest";
import { aturanFoto, PERTANYAAN } from "../src/domain/konten";
import { bacaHasilFoto, isiDariFoto, pertanyaanUntukAI, type HasilFoto } from "../src/domain/pindai";

const daftar = PERTANYAAN["kamar-mandi"].pertanyaan;
const aturan = aturanFoto("kamar-mandi");

const hasil = (jawaban: HasilFoto["jawaban"], kamar_mandi = true): HasilFoto => ({ kamar_mandi, jawaban });

describe("bacaHasilFoto", () => {
  it("menerima bentuk yang benar dan menolak yang salah", () => {
    expect(bacaHasilFoto({ kamar_mandi: true, jawaban: [{ id: "M-06", nilai: "ya", alasan: "a" }] })).not.toBeNull();
    expect(bacaHasilFoto({ kamar_mandi: true, jawaban: [{ id: "M-06", nilai: "mungkin" }] })).toBeNull();
    expect(bacaHasilFoto(null)).toBeNull();
  });
});

describe("isiDariFoto", () => {
  it("mengisi Ya dan Tidak untuk pertanyaan 'bisa' dan menandai sumbernya foto", () => {
    const r = isiDariFoto(
      daftar,
      aturan,
      hasil([
        { id: "M-07", nilai: "ya", alasan: "ada ruang kaki" },
        { id: "M-09", nilai: "tidak" },
      ]),
      {},
    );
    expect(r.terisi).toBe(2);
    expect(r.jawaban["M-07"]).toEqual({ nilai: "ya", sumber: "foto", alasan: "ada ruang kaki" });
    expect(r.jawaban["M-09"]?.nilai).toBe("tidak");
  });

  it("pertanyaan 'sebagian': hanya Tidak yang terisi, Ya tidak pernah", () => {
    const r = isiDariFoto(
      daftar,
      aturan,
      hasil([
        { id: "M-01", nilai: "ya" },
        { id: "M-05", nilai: "tidak" },
      ]),
      {},
    );
    expect(r.jawaban["M-01"]).toBeUndefined();
    expect(r.jawaban["M-05"]?.nilai).toBe("tidak");
    expect(r.terisi).toBe(1);
  });

  it("pertanyaan berstatus 'tidak' (M-12) tidak pernah terisi dari foto", () => {
    expect(isiDariFoto(daftar, aturan, hasil([{ id: "M-12", nilai: "tidak" }]), {}).jawaban["M-12"]).toBeUndefined();
  });

  it("tidak_jelas dan id tak dikenal tidak mengisi apa pun", () => {
    const r = isiDariFoto(
      daftar,
      aturan,
      hasil([
        { id: "M-07", nilai: "tidak_jelas" },
        { id: "Z-99", nilai: "ya" },
      ]),
      {},
    );
    expect(r.terisi).toBe(0);
    expect(r.jawaban).toEqual({});
  });

  it("bukan kamar mandi: tidak mengisi apa pun", () => {
    expect(isiDariFoto(daftar, aturan, hasil([{ id: "M-07", nilai: "ya" }], false), {}).terisi).toBe(0);
  });

  it("tidak menimpa jawaban pengguna, tetapi boleh memperbarui jawaban foto sebelumnya", () => {
    const sudah = {
      "M-07": { nilai: "tidak" as const, sumber: "pengguna" as const },
      "M-09": { nilai: "ya" as const, sumber: "foto" as const },
    };
    const r = isiDariFoto(
      daftar,
      aturan,
      hasil([
        { id: "M-07", nilai: "ya" },
        { id: "M-09", nilai: "tidak" },
      ]),
      sudah,
    );
    expect(r.jawaban["M-07"]?.nilai).toBe("tidak");
    expect(r.jawaban["M-09"]?.nilai).toBe("tidak");
  });

  it("alasan dipotong dan dirapikan", () => {
    const r = isiDariFoto(daftar, aturan, hasil([{ id: "M-07", nilai: "ya", alasan: `  ${"a".repeat(300)}  ` }]), {});
    expect(r.jawaban["M-07"]?.alasan?.length).toBe(140);
  });
});

describe("pertanyaanUntukAI", () => {
  it("memuat 11 pertanyaan kamar mandi (tanpa M-12)", () => {
    const ids = pertanyaanUntukAI(daftar, aturan).map((p) => p.id);
    expect(ids).toHaveLength(11);
    expect(ids).not.toContain("M-12");
  });
});
