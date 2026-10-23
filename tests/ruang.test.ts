import { describe, expect, it } from "vitest";
import { POSISI_BAWAAN, type LetakDenah, type ObjekDenah } from "../src/domain/denahPindai";
import { DIM } from "../src/domain/dimensiGambar";
import { ruangIdeal, sudutAwal, sudutUntuk } from "../src/domain/ruang";

describe("gambar Ruang Anda", () => {
  it("sudut awal: pilih sisi yang menampilkan paling banyak benda, seri jatuh ke kanan", () => {
    const letak = (o: Partial<Record<ObjekDenah, LetakDenah>>) => (id: ObjekDenah) => o[id] ?? POSISI_BAWAAN[id];
    expect(sudutAwal((id) => POSISI_BAWAAN[id])).toBe("kanan");
    const kiri = letak({ kloset: { dinding: "kiri", posisi: "tengah" }, area_mandi: { dinding: "kiri", posisi: "tengah" } });
    expect(sudutAwal(kiri)).toBe("kiri");
    // Benda yang tidak terlihat tidak ikut dihitung.
    expect(sudutAwal(kiri, ["kloset", "area_mandi"])).toBe("kanan");
  });
});

describe("sudut untuk gambar satu pertanyaan", () => {
  const letakBawaan = (id: ObjekDenah) => POSISI_BAWAAN[id];

  it("memilih sisi yang memperlihatkan benda yang dipasangi", () => {
    // Bawaan: kloset di dinding belakang, area mandi di dinding kanan, pintu di dinding depan.
    expect(sudutUntuk("M-08", letakBawaan)).toEqual({ sudut: "kanan", semua: false });
    expect(sudutUntuk("M-05", letakBawaan)).toEqual({ sudut: "kanan", semua: false });
    const dikiri = (id: ObjekDenah): LetakDenah => (id === "area_mandi" ? { dinding: "kiri", posisi: "tengah" } : POSISI_BAWAAN[id]);
    expect(sudutUntuk("M-08", dikiri)).toEqual({ sudut: "kiri", semua: false });
  });

  it("benda yang hanya ada di dinding yang tidak tergambar (pintu di depan) ditampilkan lewat semua = true", () => {
    expect(sudutUntuk("M-01", letakBawaan)).toEqual({ sudut: "kanan", semua: true });
  });

  it("pertanyaan tanpa benda tertentu (lantai, ruang putar) memakai sudut awal", () => {
    expect(sudutUntuk("M-02", letakBawaan)).toEqual({ sudut: "kanan", semua: false });
    expect(sudutUntuk("M-09", letakBawaan).semua).toBe(false);
  });
});

describe("ruang ideal untuk gambar ringkasan", () => {
  const letakBawaan = (id: ObjekDenah) => POSISI_BAWAAN[id];
  const dengan =
    (dinding: LetakDenah["dinding"]) =>
    (id: ObjekDenah): LetakDenah =>
      id === "area_mandi" ? { dinding, posisi: "tengah" } : POSISI_BAWAAN[id];

  it("tanpa area shower tanpa undakan (M-08) ukurannya tetap ruang PerMen", () => {
    expect(ruangIdeal(letakBawaan, ["M-02", "M-05"])).toEqual({ lebar: DIM.ruang.lebar, dalam: DIM.ruang.dalam });
  });

  it("dengan M-08 diperluas seperlunya: ruang putar + lebar area shower, hanya pada sumbu tegak lurus dinding shower", () => {
    const kebutuhan = DIM.ruangPutar + DIM.rollIn.lebar;
    expect(kebutuhan).toBe(228.5);
    // Shower di dinding samping: lebar bertambah, dalam tetap.
    expect(ruangIdeal(dengan("kanan"), ["M-08"])).toEqual({ lebar: kebutuhan, dalam: DIM.ruang.dalam });
    expect(ruangIdeal(dengan("kiri"), ["M-08", "M-02"])).toEqual({ lebar: kebutuhan, dalam: DIM.ruang.dalam });
    // Shower di dinding belakang atau depan: dalam bertambah (hanya sedikit, karena sudah 227,5), lebar tetap.
    expect(ruangIdeal(dengan("belakang"), ["M-08"])).toEqual({ lebar: DIM.ruang.lebar, dalam: kebutuhan });
  });

  it("tidak pernah lebih kecil dari ruang dasar", () => {
    for (const d of ["kiri", "kanan", "belakang", "depan"] as const) {
      const r = ruangIdeal(dengan(d), ["M-08"]);
      expect(r.lebar).toBeGreaterThanOrEqual(DIM.ruang.lebar);
      expect(r.dalam).toBeGreaterThanOrEqual(DIM.ruang.dalam);
    }
  });
});
