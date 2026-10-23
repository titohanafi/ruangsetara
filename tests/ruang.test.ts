import { describe, expect, it } from "vitest";
import { modeTersedia, perluPenyesuaianShower } from "../src/domain/ruang";

describe("gambar Ruang Anda", () => {
  it("penyesuaian shower hanya bila M-07 dijawab Tidak", () => {
    expect(perluPenyesuaianShower({ "M-07": { nilai: "tidak", sumber: "pengguna" } })).toBe(true);
    expect(perluPenyesuaianShower({ "M-07": { nilai: "ya", sumber: "pengguna" } })).toBe(false);
    expect(perluPenyesuaianShower({ "M-07": { nilai: "belum", sumber: "pengguna" } })).toBe(false);
    expect(perluPenyesuaianShower({})).toBe(false);
  });

  it("keadaan setelah penyesuaian tidak tersedia bila tidak ada hambatan", () => {
    expect(modeTersedia({})).toEqual(["kondisi"]);
    expect(modeTersedia({ "M-07": { nilai: "tidak", sumber: "foto" } })).toEqual(["kondisi", "hack", "permanen"]);
  });
});
