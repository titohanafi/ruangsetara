import { describe, expect, it } from "vitest";
import { BERGAMBAR_TETAP, VARIAN_TETAP } from "../src/domain/bergambarTetap";
import { RUANG_TETAP } from "../src/domain/gambarRuangTetap";
import { teksGambar, type KonteksRuang } from "../src/domain/gambarRuang";
import { PERTANYAAN, UI } from "../src/domain/konten";
import type { Dinding, Kerangka } from "../src/domain/gambarShower";

const proyeksi = (x: number, y: number, z: number): [number, number] => [x - y, (x + y) / 2 - z];
const konteks = (area: string, tampilkanUkuran: boolean): KonteksRuang => {
  const { lebar, dalam } = RUANG_TETAP[area].ruang;
  const bidang = (d: Dinding): number =>
    d === "belakang" ? -dalam / 2 : d === "depan" ? dalam / 2 : d === "kiri" ? -lebar / 2 : lebar / 2;
  return {
    kerangka: (dinding): Kerangka => ({ dinding, sepanjang: 0, bidang: bidang(dinding), proyeksi, skala: 1, lihat: { x: -1, y: 1 } }),
    proyeksi,
    tampilkanUkuran,
  };
};

// Angka yang boleh tertulis di gambar: hanya yang ada di teks Modifikasi sheet pertanyaan ruang itu.
const ANGKA_BOLEH: Record<string, Set<string>> = {
  dapur: new Set(["80", "92", "152,5", "71", "86,5", "76", "68,5", "43", "16,5", "122", "137", "38"]),
  // B-01 80 dan 110; B-02 150 dan 92; B-03 91; B-04 43-58; B-06 90-120.
  "kamar-tidur": new Set(["80", "110", "150", "92", "91", "43", "58", "90", "120", "152,5"]),
  // G-01 92; G-02 150; G-03 80; G-04 1:10, 95, 120, 1,25; G-09 110 dan 152,5.
  mobilitas: new Set(["92", "150", "80", "1", "10", "95", "120", "1,25", "110", "152,5"]),
};

for (const area of Object.keys(RUANG_TETAP)) {
  describe(`gambar ${area}`, () => {
    const aturan = RUANG_TETAP[area];
    const ids = [...BERGAMBAR_TETAP[area], ...[...BERGAMBAR_TETAP[area]].flatMap((i) => VARIAN_TETAP[i] ?? [])];

    it("daftar bergambar hanya berisi pertanyaan yang ada", () => {
      const ada = new Set(PERTANYAAN[area].pertanyaan.map((p) => p.id));
      for (const id of ids) expect(ada.has(id.split("~")[0]), id).toBe(true);
    });

    it("tiap pertanyaan bergambar menghasilkan bagian hijau, dan kondisi dasar tidak", () => {
      expect(aturan.susun(null, konteks(area, true)).lapisan.some((l) => l.aksen)).toBe(false);
      for (const id of ids) {
        const hasil = aturan.susun(id, konteks(area, true));
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

    it("tanpa tampilkanUkuran tidak ada teks; dengan ukuran hanya angka dari sheet", () => {
      for (const id of ids) {
        expect(teksGambar(aturan.susun(id, konteks(area, false))), id).toEqual([]);
        for (const teks of teksGambar(aturan.susun(id, konteks(area, true)))) {
          for (const n of teks.match(/\d+(?:,\d+)?/g) ?? []) expect(ANGKA_BOLEH[area].has(n), `${id}: "${teks}" memuat ${n}`).toBe(true);
        }
      }
    });

    it("semua titik berhingga", () => {
      for (const id of ids) expect(JSON.stringify(aturan.susun(id, konteks(area, true))), id).not.toMatch(/null|NaN|Infinity/);
    });
  });
}

describe("benda dasar dan angka yang tampak keliru", () => {
  it("dapur: benda yang diganti tidak digambar dua kali", () => {
    const ids = (id: string | null) => RUANG_TETAP.dapur.susun(id, konteks("dapur", false)).lapisan.map((l) => l.id);
    expect(ids("K-06")).not.toContain("kulkas");
    expect(ids("K-02")).not.toContain("meja");
    expect(ids("K-04")).not.toContain("kompor");
    expect(ids("K-03")).not.toContain("wastafel");
    expect(ids("K-01")).not.toContain("pintu");
    expect(ids(null)).toEqual(expect.arrayContaining(["kulkas", "meja", "kompor", "wastafel", "pintu"]));
  });

  it("dapur K-04 tidak menulis 12,2 (tampak salah ketik di sheet)", () => {
    expect(teksGambar(RUANG_TETAP.dapur.susun("K-04", konteks("dapur", true))).join(" ")).not.toMatch(/12,2/);
  });

  it("kamar tidur dan mobilitas: benda diganti hanya pada pertanyaannya", () => {
    const ids = (area: string, id: string | null) => RUANG_TETAP[area].susun(id, konteks(area, false)).lapisan.map((l) => l.id);
    expect(ids("kamar-tidur", "B-01")).not.toContain("pintu");
    expect(ids("kamar-tidur", "B-04")).not.toContain("tempatTidur");
    expect(ids("kamar-tidur", "B-06")).not.toContain("lemari");
    expect(ids("mobilitas", "G-04")).not.toContain("undakan");
    expect(ids("mobilitas", "G-03")).not.toContain("pintu");
    expect(ids("mobilitas", null)).toEqual(expect.arrayContaining(["pintu", "undakan", "lemariTanam", "meja", "saklar"]));
  });
});

describe("alternatif dari sheet", () => {
  it("tiap alternatif punya teks antarmuka dan benda yang diganti", () => {
    const nama: Record<string, string> = UI.ruang.varian;
    for (const [id, daftar] of Object.entries(VARIAN_TETAP)) {
      expect(BERGAMBAR_TETAP.dapur.has(id) || BERGAMBAR_TETAP["kamar-tidur"].has(id) || BERGAMBAR_TETAP.mobilitas.has(id), id).toBe(true);
      for (const kunci of daftar) expect(nama[kunci], kunci).toBeTruthy();
    }
  });

  it("B-01 tirai tidak menggambar tuas, G-03 geser tidak menggambar engsel", () => {
    const ids = (area: string, id: string) => RUANG_TETAP[area].susun(id, konteks(area, false)).lapisan.map((l) => l.id);
    expect(ids("kamar-tidur", "B-01~tirai")).toContain("tirai-mod");
    expect(ids("kamar-tidur", "B-01~tirai")).not.toContain("tuas-mod");
    expect(ids("mobilitas", "G-03~geser")).not.toContain("engsel-mod");
  });

  it("G-05 menggantikan karpet dan retakan sekaligus", () => {
    const ids = RUANG_TETAP.mobilitas.susun("G-05", konteks("mobilitas", false)).lapisan.map((l) => l.id);
    expect(ids).not.toContain("karpet");
    expect(ids).not.toContain("retak");
    expect(RUANG_TETAP.mobilitas.susun(null, konteks("mobilitas", false)).lapisan.map((l) => l.id)).toEqual(
      expect.arrayContaining(["karpet", "retak"]),
    );
  });
});

describe("ruang terisi lengkap", () => {
  for (const area of Object.keys(RUANG_TETAP)) {
    it(`${area}: lengkap tanpa bagian hijau, lebih banyak benda dari kondisi dasar, ada kursi roda`, () => {
      const dasar = RUANG_TETAP[area].susun(null, konteks(area, false));
      const lengkap = RUANG_TETAP[area].susun("LENGKAP", konteks(area, false));
      expect(lengkap.lapisan.some((l) => l.aksen)).toBe(false);
      expect(lengkap.lapisan.length).toBeGreaterThan(dasar.lapisan.length);
      expect(lengkap.lapisan.map((l) => l.id)).toContain("kursiRoda");
      expect(JSON.stringify(lengkap)).not.toMatch(/null|NaN|Infinity/);
    });
  }

  it("hack G-09 memakai pintu tertutup dan hack G-03 mempertahankan pintu terbuka", () => {
    const ids = (id: string) => RUANG_TETAP.mobilitas.susun(id, konteks("mobilitas", false)).lapisan.map((l) => l.id);
    expect(ids("G-09~adaptor")).toContain("pintu-tertutup");
    expect(ids("G-09~adaptor")).not.toContain("pintu");
    expect(ids("G-03~ganjal")).toContain("pintu");
    expect(ids("G-03~ganjal")).toContain("ganjal-hack");
  });
});
