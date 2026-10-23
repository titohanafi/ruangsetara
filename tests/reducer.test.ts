import { describe, expect, it } from "vitest";
import { AWAL, reducer, type State } from "../src/state/reducer";

const foto = (id: string) => ({ id, url: `data:image/jpeg;base64,${id}` });

describe("reducer", () => {
  it("ganti area membuang jawaban, prioritas, dan hasil baca, tetapi memelihara foto dan profil", () => {
    let s: State = reducer(AWAL, { jenis: "pilih_area", areaId: "kamar-mandi" });
    s = reducer(s, { jenis: "tambah_foto", foto: foto("a") });
    s = reducer(s, { jenis: "isi_profil", id: "kursi_roda", nilai: "Manual" });
    s = reducer(s, { jenis: "pilih_aktivitas", aktivitas: "Mandi" });
    s = reducer(s, { jenis: "jawab", id: "M-01", nilai: "ya" });
    s = reducer(s, { jenis: "pilih_area", areaId: "dapur" });
    expect(s.jawaban).toEqual({});
    expect(s.aktivitas).toBeNull();
    expect(s.fotos).toHaveLength(1);
    expect(s.profil.kursi_roda).toBe("Manual");
  });

  it("memilih area yang sama tidak mengubah apa pun", () => {
    const s = reducer(AWAL, { jenis: "pilih_area", areaId: "dapur" });
    expect(reducer(s, { jenis: "pilih_area", areaId: "dapur" })).toBe(s);
  });

  it("foto berubah: jawaban dari foto dibuang, jawaban pengguna dipertahankan, hasil baca direset", () => {
    let s: State = reducer(AWAL, { jenis: "pilih_area", areaId: "kamar-mandi" });
    s = reducer(s, { jenis: "tambah_foto", foto: foto("a") });
    s = reducer(s, { jenis: "jawab", id: "M-01", nilai: "ya" });
    s = reducer(s, {
      jenis: "selesai_baca",
      jawaban: { ...s.jawaban, "M-06": { nilai: "tidak", sumber: "foto" } },
      terisi: 1,
      total: 12,
      bukanRuangan: false,
    });
    expect(s.baca.status).toBe("selesai");
    s = reducer(s, { jenis: "tambah_foto", foto: foto("b") });
    expect(Object.keys(s.jawaban)).toEqual(["M-01"]);
    expect(s.baca.status).toBe("belum");
    s = reducer(s, { jenis: "hapus_foto", id: "a" });
    expect(s.fotos.map((f) => f.id)).toEqual(["b"]);
  });

  it("jawaban pengguna menimpa jawaban dari foto dan ditandai sumber pengguna", () => {
    let s: State = reducer(AWAL, {
      jenis: "selesai_baca",
      jawaban: { "M-06": { nilai: "tidak", sumber: "foto", alasan: "x" } },
      terisi: 1,
      total: 12,
      bukanRuangan: false,
    });
    s = reducer(s, { jenis: "jawab", id: "M-06", nilai: "ya" });
    expect(s.jawaban["M-06"]).toEqual({ nilai: "ya", sumber: "pengguna" });
  });

  it("area_lain mengosongkan semuanya kecuali profil; ulang mengosongkan semuanya", () => {
    let s: State = reducer(AWAL, { jenis: "isi_profil", id: "gerak", nilai: "Sendiri" });
    s = reducer(s, { jenis: "pilih_area", areaId: "dapur" });
    expect(reducer(s, { jenis: "area_lain" })).toEqual({ ...AWAL, profil: { gerak: "Sendiri" } });
    expect(reducer(s, { jenis: "ulang" })).toEqual(AWAL);
  });

  it("gagal_baca membedakan terlalu sering dan gagal biasa", () => {
    expect(reducer(AWAL, { jenis: "gagal_baca", sering: true }).baca.status).toBe("sering");
    expect(reducer(AWAL, { jenis: "gagal_baca", sering: false }).baca.status).toBe("gagal");
  });

  it("catatan AI disimpan saat baca selesai, dan dibuang saat foto atau area berubah", () => {
    let s: State = reducer(AWAL, { jenis: "pilih_area", areaId: "kamar-mandi" });
    s = reducer(s, {
      jenis: "selesai_baca",
      jawaban: {},
      terisi: 0,
      total: 12,
      bukanRuangan: false,
      catatan: { "M-09": "Lantai tampak halus" },
    });
    expect(s.catatanFoto).toEqual({ "M-09": "Lantai tampak halus" });
    expect(reducer(s, { jenis: "tambah_foto", foto: { id: "a", url: "data:" } }).catatanFoto).toEqual({});
    expect(reducer(s, { jenis: "hapus_foto", id: "a" }).catatanFoto).toEqual({});
    expect(reducer(s, { jenis: "pilih_area", areaId: "dapur" }).catatanFoto).toEqual({});
  });

  it("teks hasil pemeriksaan pengguna disimpan per pertanyaan, dan dibuang saat area berganti", () => {
    let s: State = reducer(AWAL, { jenis: "pilih_area", areaId: "kamar-mandi" });
    s = reducer(s, { jenis: "isi_temuan", id: "M-01", teks: "lebar bukaan pintu 85 cm" });
    expect(s.temuan).toEqual({ "M-01": "lebar bukaan pintu 85 cm" });
    // Teks pengguna bertahan saat foto berubah (itu hasil pemeriksaan mereka sendiri, bukan hasil baca foto).
    expect(reducer(s, { jenis: "tambah_foto", foto: { id: "a", url: "data:" } }).temuan).toEqual(s.temuan);
    expect(reducer(s, { jenis: "pilih_area", areaId: "dapur" }).temuan).toEqual({});
    expect(reducer(s, { jenis: "ulang" }).temuan).toEqual({});
  });
});
