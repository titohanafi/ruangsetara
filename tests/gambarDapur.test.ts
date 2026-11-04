import { describe, expect, it } from "vitest";
import { BERGAMBAR_DAPUR } from "../src/domain/bergambarDapur";
import { DAPUR, susunDapur, teksGambar, type KonteksRuang } from "../src/domain/gambarDapur";
import { PERTANYAAN } from "../src/domain/konten";
import type { Dinding, Kerangka } from "../src/domain/gambarShower";

const proyeksi = (x: number, y: number, z: number): [number, number] => [x - y, (x + y) / 2 - z];
const bidang = (d: Dinding): number =>
  d === "belakang"
    ? -DAPUR.ruang.dalam / 2
    : d === "depan"
      ? DAPUR.ruang.dalam / 2
      : d === "kiri"
        ? -DAPUR.ruang.lebar / 2
        : DAPUR.ruang.lebar / 2;
const konteks = (tampilkanUkuran: boolean): KonteksRuang => ({
  kerangka: (dinding): Kerangka => ({ dinding, sepanjang: 0, bidang: bidang(dinding), proyeksi, skala: 1, lihat: { x: -1, y: 1 } }),
  proyeksi,
  tampilkanUkuran,
});

// Angka yang boleh tertulis di gambar: hanya yang ada di teks Modifikasi sheet (K-01..K-08).
const ANGKA_BOLEH = new Set(["80", "92", "152,5", "71", "86,5", "76", "68,5", "43", "16,5", "122", "137", "38"]);

describe("gambar dapur", () => {
  it("daftar bergambar hanya berisi pertanyaan dapur yang ada", () => {
    const ada = new Set(PERTANYAAN.dapur.pertanyaan.map((p) => p.id));
    for (const id of BERGAMBAR_DAPUR) expect(ada.has(id)).toBe(true);
  });

  it("tiap pertanyaan bergambar menghasilkan bagian hijau, dan kondisi dasar tidak", () => {
    expect(susunDapur(null, konteks(true)).lapisan.some((l) => l.aksen)).toBe(false);
    for (const id of BERGAMBAR_DAPUR) {
      const hasil = susunDapur(id, konteks(true));
      expect(
        hasil.lapisan.some((l) => l.aksen),
        id,
      ).toBe(true);
      expect(
        hasil.lapisan.every((l) => l.daftar.length > 0),
        id,
      ).toBe(true);
    }
  });

  it("benda yang diganti tidak digambar dua kali", () => {
    const ids = (id: string | null) => susunDapur(id, konteks(false)).lapisan.map((l) => l.id);
    expect(ids("K-06")).not.toContain("kulkas");
    expect(ids("K-02")).not.toContain("meja");
    expect(ids("K-04")).not.toContain("kompor");
    expect(ids("K-03")).not.toContain("wastafel");
    expect(ids("K-01")).not.toContain("pintu");
    expect(ids(null)).toEqual(expect.arrayContaining(["kulkas", "meja", "kompor", "wastafel", "pintu"]));
  });

  it("tanpa tampilkanUkuran tidak ada teks; dengan ukuran hanya angka dari sheet", () => {
    for (const id of BERGAMBAR_DAPUR) {
      expect(teksGambar(susunDapur(id, konteks(false))), id).toEqual([]);
      for (const teks of teksGambar(susunDapur(id, konteks(true)))) {
        for (const n of teks.match(/\d+(?:,\d+)?/g) ?? []) expect(ANGKA_BOLEH.has(n), `${id}: "${teks}" memuat ${n}`).toBe(true);
      }
    }
  });

  it("angka yang tampak keliru di sheet (12,2 pada K-04) tidak ditulis", () => {
    expect(teksGambar(susunDapur("K-04", konteks(true))).join(" ")).not.toMatch(/12,2/);
  });

  it("semua titik berhingga", () => {
    for (const id of BERGAMBAR_DAPUR) {
      const json = JSON.stringify(susunDapur(id, konteks(true)));
      expect(json).not.toMatch(/null|NaN|Infinity/);
    }
  });
});
