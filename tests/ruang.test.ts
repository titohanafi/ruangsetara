import { describe, expect, it } from "vitest";
import { POSISI_BAWAAN, type LetakDenah, type ObjekDenah } from "../src/domain/denahPindai";
import { modeTersedia, perluPenyesuaianShower, sudutAwal } from "../src/domain/ruang";

describe("gambar Ruang Anda", () => {
  it("penyesuaian shower hanya bila M-07 dijawab Tidak", () => {
    expect(perluPenyesuaianShower({ "M-07": { nilai: "tidak", sumber: "pengguna" } })).toBe(true);
    expect(perluPenyesuaianShower({ "M-07": { nilai: "ya", sumber: "pengguna" } })).toBe(false);
    expect(perluPenyesuaianShower({ "M-07": { nilai: "belum", sumber: "pengguna" } })).toBe(false);
    expect(perluPenyesuaianShower({})).toBe(false);
  });

  it("keadaan setelah penyesuaian tidak tersedia bila tidak ada hambatan", () => {
    expect(modeTersedia({}, "hand_shower_gantung")).toEqual(["kondisi"]);
    expect(modeTersedia({ "M-07": { nilai: "tidak", sumber: "foto" } }, "hand_shower_gantung")).toEqual(["kondisi", "hack", "permanen"]);
    // Jenis shower lain belum punya gambar penyesuaian.
    for (const v of ["shower_tetap", "ember_gayung", "tidak_jelas"] as const)
      expect(modeTersedia({ "M-07": { nilai: "tidak", sumber: "foto" } }, v)).toEqual(["kondisi"]);
  });

  it("sudut awal: pilih sisi yang menampilkan paling banyak benda, seri jatuh ke kanan", () => {
    const letak = (o: Partial<Record<ObjekDenah, LetakDenah>>) => (id: ObjekDenah) => o[id] ?? POSISI_BAWAAN[id];
    expect(sudutAwal((id) => POSISI_BAWAAN[id])).toBe("kanan");
    const kiri = letak({ kloset: { dinding: "kiri", posisi: "tengah" }, area_mandi: { dinding: "kiri", posisi: "tengah" } });
    expect(sudutAwal(kiri)).toBe("kiri");
    // Benda yang tidak terlihat tidak ikut dihitung.
    expect(sudutAwal(kiri, ["kloset", "area_mandi"])).toBe("kanan");
  });
});
