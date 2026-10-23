import { describe, expect, it } from "vitest";
import { aturanFoto, PERTANYAAN } from "../src/domain/konten";
import { bacaHasilFoto, isiDariFoto, pertanyaanUntukAI, type HasilFoto } from "../src/domain/pindai";

const daftar = PERTANYAAN["kamar-mandi"].pertanyaan;
// Jalur 'bisa' diuji dengan M-09 sebagai 'bisa' buatan: aturan dari sheet kini tidak memuat pertanyaan 'bisa' di kamar mandi.
const aturan = { ...aturanFoto("kamar-mandi"), "M-09": "bisa" as const };

const hasil = (jawaban: HasilFoto["jawaban"], ruang_sesuai = true): HasilFoto => ({ ruang_sesuai, jawaban });

describe("bacaHasilFoto", () => {
  it("menerima bentuk yang benar dan menolak yang salah", () => {
    expect(bacaHasilFoto({ ruang_sesuai: true, jawaban: [{ id: "M-06", nilai: "ya", alasan: "a" }] })).not.toBeNull();
    expect(bacaHasilFoto({ ruang_sesuai: true, jawaban: [{ id: "M-06", nilai: "mungkin" }] })).toBeNull();
    expect(bacaHasilFoto(null)).toBeNull();
  });
});

describe("isiDariFoto", () => {
  it("mengisi Ya dan Tidak untuk pertanyaan 'bisa' dan menandai sumbernya foto", () => {
    const r = isiDariFoto(
      daftar,
      aturan,
      hasil([
        { id: "M-09", nilai: "ya", alasan: "ada ruang kaki" },
        { id: "M-05", nilai: "tidak" },
      ]),
      {},
    );
    expect(r.terisi).toBe(2);
    expect(r.jawaban["M-09"]).toEqual({ nilai: "ya", sumber: "foto", alasan: "ada ruang kaki" });
    expect(r.jawaban["M-05"]?.nilai).toBe("tidak");
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

  it("foto bukan ruangan yang dipilih: tidak mengisi apa pun", () => {
    expect(isiDariFoto(daftar, aturan, hasil([{ id: "M-07", nilai: "ya" }], false), {}).terisi).toBe(0);
  });

  it("tidak menimpa jawaban pengguna, tetapi boleh memperbarui jawaban foto sebelumnya", () => {
    const sudah = {
      "M-09": { nilai: "tidak" as const, sumber: "pengguna" as const },
      "M-11": { nilai: "ya" as const, sumber: "foto" as const },
    };
    const r = isiDariFoto(
      daftar,
      aturan,
      hasil([
        { id: "M-09", nilai: "ya" },
        { id: "M-11", nilai: "tidak" },
      ]),
      sudah,
    );
    expect(r.jawaban["M-09"]?.nilai).toBe("tidak");
    expect(r.jawaban["M-11"]?.nilai).toBe("tidak");
  });

  it("alasan dipotong dan dirapikan", () => {
    const r = isiDariFoto(daftar, aturan, hasil([{ id: "M-09", nilai: "ya", alasan: `  ${"a".repeat(300)}  ` }]), {});
    expect(r.jawaban["M-09"]?.alasan?.length).toBe(160);
  });
});

describe("catatan AI untuk pertanyaan yang tidak terisi", () => {
  it("'tidak jelas' menyimpan catatan (dipotong), tidak mengisi jawaban", () => {
    const r = isiDariFoto(daftar, aturan, hasil([{ id: "M-05", nilai: "tidak_jelas", alasan: `  ${"a".repeat(300)}  ` }]), {});
    expect(r.jawaban["M-05"]).toBeUndefined();
    expect(r.terisi).toBe(0);
    expect(r.catatan["M-05"]).toHaveLength(160);
  });

  it("jawaban yang terisi dari foto tidak punya catatan terpisah (alasannya ada di jawaban)", () => {
    const r = isiDariFoto(daftar, aturan, hasil([{ id: "M-05", nilai: "tidak", alasan: "Pegangan tidak terlihat" }]), {});
    expect(r.jawaban["M-05"]?.alasan).toBe("Pegangan tidak terlihat");
    expect(r.catatan).toEqual({});
  });

  it("'Ya' yang tidak boleh dari foto dibuang tanpa catatan, karena kalimatnya terbaca seperti jawaban", () => {
    const r = isiDariFoto(daftar, aturan, hasil([{ id: "M-05", nilai: "ya", alasan: "Pegangan tampak kokoh" }]), {});
    expect(r.jawaban["M-05"]).toBeUndefined();
    expect(r.catatan).toEqual({});
  });

  it("alasan kosong tidak membuat catatan; foto bukan ruangan tidak membuat apa pun; pertanyaan 'tidak' tidak dicatat", () => {
    expect(isiDariFoto(daftar, aturan, hasil([{ id: "M-05", nilai: "tidak_jelas", alasan: "  " }]), {}).catatan).toEqual({});
    expect(isiDariFoto(daftar, aturan, hasil([{ id: "M-05", nilai: "tidak_jelas", alasan: "x" }], false), {}).catatan).toEqual({});
    expect(isiDariFoto(daftar, aturan, hasil([{ id: "M-12", nilai: "tidak_jelas", alasan: "x" }]), {}).catatan).toEqual({});
  });

  it("jawaban pengguna tetap tidak ditimpa, catatan tetap disimpan untuk dibaca", () => {
    const r = isiDariFoto(daftar, aturan, hasil([{ id: "M-05", nilai: "tidak_jelas", alasan: "Tidak jelas" }]), {
      "M-05": { nilai: "ya", sumber: "pengguna" },
    });
    expect(r.jawaban["M-05"]?.nilai).toBe("ya");
    expect(r.catatan["M-05"]).toBe("Tidak jelas");
  });
});

describe("pertanyaanUntukAI", () => {
  it("memuat 11 pertanyaan kamar mandi (tanpa M-12)", () => {
    const ids = pertanyaanUntukAI(daftar, aturan).map((p) => p.id);
    expect(ids).toHaveLength(11);
    expect(ids).not.toContain("M-12");
  });
});
