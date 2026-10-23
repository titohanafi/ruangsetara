import { describe, expect, it } from "vitest";
import { ringkas } from "../src/domain/asesmen";
import { aturanFoto, PERTANYAAN } from "../src/domain/konten";
import { AWAL, reducer } from "../src/state/reducer";
import { bacaHasilFoto, isiDariFoto, pertanyaanUntukAI, type HasilFoto } from "../src/domain/pindai";

const daftar = PERTANYAAN["kamar-mandi"].pertanyaan;
// M-08 satu-satunya pertanyaan kamar mandi yang 'bisa' (pengecualian tertulis di pindai.json).
const aturan = aturanFoto("kamar-mandi");

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
        { id: "M-08", nilai: "ya", alasan: "ada ruang kaki" },
        { id: "M-05", nilai: "tidak" },
      ]),
      {},
    );
    expect(r.terisi).toBe(2);
    expect(r.jawaban["M-08"]).toEqual({ nilai: "ya", sumber: "foto", alasan: "ada ruang kaki" });
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
    // "Ya" tidak boleh dari foto: diperlakukan seperti belum pasti ("Belum tahu" menunggu pengguna), bukan terisi Ya.
    expect(r.jawaban["M-01"]).toMatchObject({ nilai: "belum", sumber: "foto", perluTinjau: true });
    expect(r.jawaban["M-05"]?.nilai).toBe("tidak");
    expect(r.terisi).toBe(1);
  });

  it("pertanyaan berstatus 'tidak' (M-12) tidak pernah terisi dari foto", () => {
    expect(isiDariFoto(daftar, aturan, hasil([{ id: "M-12", nilai: "tidak" }]), {}).jawaban["M-12"]).toBeUndefined();
  });

  it("tidak_jelas mengisi 'Belum tahu' yang menunggu pengguna (bukan Ya atau Tidak); id tak dikenal diabaikan", () => {
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
    expect(r.jawaban).toEqual({ "M-07": { nilai: "belum", sumber: "foto", alasan: undefined, perluTinjau: true } });
  });

  it("foto bukan ruangan yang dipilih: tidak mengisi apa pun", () => {
    expect(isiDariFoto(daftar, aturan, hasil([{ id: "M-07", nilai: "ya" }], false), {}).terisi).toBe(0);
  });

  it("tidak menimpa jawaban pengguna, tetapi boleh memperbarui jawaban foto sebelumnya", () => {
    const sudah = {
      "M-08": { nilai: "tidak" as const, sumber: "pengguna" as const },
      "M-11": { nilai: "ya" as const, sumber: "foto" as const },
    };
    const r = isiDariFoto(
      daftar,
      aturan,
      hasil([
        { id: "M-08", nilai: "ya" },
        { id: "M-11", nilai: "tidak" },
      ]),
      sudah,
    );
    expect(r.jawaban["M-08"]?.nilai).toBe("tidak");
    expect(r.jawaban["M-11"]?.nilai).toBe("tidak");
  });

  it("alasan dipotong dan dirapikan", () => {
    const r = isiDariFoto(daftar, aturan, hasil([{ id: "M-08", nilai: "ya", alasan: `  ${"a".repeat(300)}  ` }]), {});
    expect(r.jawaban["M-08"]?.alasan?.length).toBe(160);
  });
});

describe("'Belum tahu' dari AI dan catatannya", () => {
  it("'tidak jelas' menyimpan catatan (dipotong) dan mengisi Belum tahu yang menunggu pengguna", () => {
    const r = isiDariFoto(daftar, aturan, hasil([{ id: "M-05", nilai: "tidak_jelas", alasan: `  ${"a".repeat(300)}  ` }]), {});
    expect(r.jawaban["M-05"]).toMatchObject({ nilai: "belum", sumber: "foto", perluTinjau: true });
    expect(r.terisi).toBe(0);
    expect(r.catatan["M-05"]).toHaveLength(160);
  });

  it("jawaban Ya atau Tidak yang terisi dari foto tidak punya catatan terpisah (alasannya ada di jawaban)", () => {
    const r = isiDariFoto(daftar, aturan, hasil([{ id: "M-05", nilai: "tidak", alasan: "Pegangan tidak terlihat" }]), {});
    expect(r.jawaban["M-05"]?.alasan).toBe("Pegangan tidak terlihat");
    expect(r.jawaban["M-05"]?.perluTinjau).toBeUndefined();
    expect(r.catatan).toEqual({});
  });

  it("'Ya' yang tidak boleh dari foto: Belum tahu menunggu pengguna, catatannya kosong (kalimat AI terbaca seperti jawaban)", () => {
    const r = isiDariFoto(daftar, aturan, hasil([{ id: "M-05", nilai: "ya", alasan: "Pegangan tampak kokoh" }]), {});
    expect(r.jawaban["M-05"]).toMatchObject({ nilai: "belum", perluTinjau: true });
    expect(r.jawaban["M-05"]?.alasan).toBeUndefined();
    expect(r.catatan["M-05"]).toBe("");
  });

  it("alasan kosong tetap menandai Belum tahu; foto bukan ruangan dan pertanyaan 'tidak' tidak membuat apa pun", () => {
    const kosong = isiDariFoto(daftar, aturan, hasil([{ id: "M-05", nilai: "tidak_jelas", alasan: "  " }]), {});
    expect(kosong.catatan).toEqual({ "M-05": "" });
    expect(kosong.jawaban["M-05"]).toMatchObject({ nilai: "belum", perluTinjau: true });
    expect(isiDariFoto(daftar, aturan, hasil([{ id: "M-05", nilai: "tidak_jelas", alasan: "x" }], false), {})).toMatchObject({
      jawaban: {},
      catatan: {},
    });
    expect(isiDariFoto(daftar, aturan, hasil([{ id: "M-12", nilai: "tidak_jelas", alasan: "x" }]), {})).toMatchObject({
      jawaban: {},
      catatan: {},
    });
  });

  it("jawaban pengguna tidak ditimpa, catatan tetap disimpan untuk dibaca", () => {
    const r = isiDariFoto(daftar, aturan, hasil([{ id: "M-05", nilai: "tidak_jelas", alasan: "Tidak jelas" }]), {
      "M-05": { nilai: "ya", sumber: "pengguna" },
    });
    expect(r.jawaban["M-05"]).toEqual({ nilai: "ya", sumber: "pengguna" });
    expect(r.catatan["M-05"]).toBe("Tidak jelas");
  });

  it("Belum tahu dari AI belum dihitung terjawab sampai pengguna memilih sendiri", () => {
    const r = isiDariFoto(daftar, aturan, hasil([{ id: "M-05", nilai: "tidak_jelas", alasan: "x" }]), {});
    expect(ringkas(daftar, r.jawaban).terjawab).toBe(0);
    const sesudah = reducer({ ...AWAL, jawaban: r.jawaban }, { jenis: "jawab", id: "M-05", nilai: "belum" });
    expect(sesudah.jawaban["M-05"]).toEqual({ nilai: "belum", sumber: "pengguna" });
    expect(ringkas(daftar, sesudah.jawaban).terjawab).toBe(1);
  });
});

describe("pertanyaanUntukAI", () => {
  it("memuat 11 pertanyaan kamar mandi (tanpa M-12)", () => {
    const ids = pertanyaanUntukAI(daftar, aturan).map((p) => p.id);
    expect(ids).toHaveLength(11);
    expect(ids).not.toContain("M-12");
  });
});
