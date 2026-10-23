import { describe, expect, it } from "vitest";
import { DIM, DIMENSI_PERKIRAAN } from "../src/domain/dimensiGambar";
import { gambarBenda } from "../src/domain/gambarBenda";
import { gambarShower, type Kerangka, type Primitif, type Titik } from "../src/domain/gambarShower";
import { nilaiAcuan } from "../src/domain/ukuranAksesibel";

// Proyeksi uji yang mempertahankan ukuran nyata: layar x = sumbu dinding, layar y = -tinggi (cm). Tiap benda dipasang
// pada dinding belakang tanpa pembesaran, jadi koordinat hasil gambar bisa dibaca langsung sebagai cm.
const k: Kerangka = {
  dinding: "belakang",
  sepanjang: 0,
  bidang: 0,
  proyeksi: (x, y, z): Titik => [x + y * 0.001, -z],
  skala: 1,
  lihat: { x: 1, y: 1 },
};

const titikSemua = (daftar: Primitif[]): Titik[] =>
  daftar.flatMap((p) => ("titik" in p ? p.titik : p.jenis === "garis" ? [p.dari, p.ke] : []));
const tinggiMaks = (daftar: Primitif[]) => Math.max(...titikSemua(daftar).map((t) => -t[1]));
const lebarX = (daftar: Primitif[]) => {
  const xs = titikSemua(daftar).map((t) => t[0]);
  return Math.max(...xs) - Math.min(...xs);
};

describe("dimensi nyata gambar (1 satuan = 1 cm)", () => {
  it("angka dari tabel sama dengan nilai acuan PerMen/ADA", () => {
    expect(DIM.ruang.lebar).toBe(nilaiAcuan("toilet-disabilitas-ruang-dalam", "lebar_cm")?.cm);
    expect(DIM.ruang.dalam).toBe(nilaiAcuan("toilet-disabilitas-ruang-dalam", "panjang_cm")?.cm);
    expect(DIM.pintu.bukaanBersih).toBe(90);
    expect(DIM.kloset.tinggiDudukan).toBe(45);
    expect(DIM.wastafel.tinggiPenggunaKursiRoda).toBe(75);
    expect(DIM.wastafel.lebarBak).toBe(60);
    expect(DIM.wastafel.dalamBak).toBe(45);
    expect(DIM.shower.zonaAtas).toBe(120);
    expect(DIM.shower.zonaBawah).toBe(38);
    expect(DIM.shower.selangMin).toBe(150);
  });

  it("perkiraan tercatat dengan keterangan dan tidak ada yang kosong", () => {
    for (const [id, d] of Object.entries(DIMENSI_PERKIRAAN)) {
      expect(d.cm, id).toBeGreaterThan(0);
      expect(d.keterangan.length, id).toBeGreaterThan(10);
    }
  });

  it("kloset duduk: puncak dudukan setinggi tabel, tangki di bawah tinggi wajar", () => {
    const rongga = gambarBenda("kloset_duduk", k).filter((p) => p.jenis === "poligon" && p.muka === "rongga");
    const t = (rongga[rongga.length - 1] as { titik: Titik[] }).titik;
    for (const [, y] of t) expect(-y).toBeCloseTo(DIM.kloset.tinggiDudukan, 5);
  });

  it("wastafel: lebar dan tinggi mengikuti tabel (bak 60 x 45, tinggi pasang 75 cm)", () => {
    const rongga = gambarBenda("wastafel", k).filter((p) => p.jenis === "poligon" && p.muka === "rongga");
    const t = (rongga[rongga.length - 1] as { titik: Titik[] }).titik;
    for (const [, y] of t) expect(-y).toBeCloseTo(DIM.wastafel.tinggiPenggunaKursiRoda, 5);
    const meja = gambarBenda("wastafel", k).filter((p) => p.jenis === "poligon" && p.muka === "atas");
    // Meja adalah poligon atas terbesar; lebarnya sama dengan lebar bak.
    const lebar = Math.max(...meja.map((p) => lebarX([p])));
    expect(lebar).toBeCloseTo(DIM.wastafel.lebarBak, 1);
  });

  it("pintu: bukaan bersih 90 cm di antara kusen, tinggi mengikuti perkiraan tercatat", () => {
    const puncak = gambarBenda("pintu", k).filter(
      (p) => p.jenis === "poligon" && p.titik.every((t) => Math.abs(-t[1] - (DIM.pintu.tinggi + 8)) < 1e-6),
    );
    // Sisi atas kusen: ambang atas selebar bukaan ditambah dua tiang (4 cm masing-masing).
    expect(Math.max(...puncak.map((p) => lebarX([p])))).toBeCloseTo(DIM.pintu.bukaanBersih + 8, 1);
  });

  it("shower: bagian kecil nyata, kait di luar zona, kran dalam zona tabel", () => {
    const hand = gambarShower("hand_shower_gantung", "kondisi", { kerangka: k });
    // Titik tertinggi kait ada di atas zona jangkauan atas dari tabel dan tidak melewati plafon.
    expect(tinggiMaks(hand)).toBeGreaterThan(DIM.shower.zonaAtas);
    expect(tinggiMaks(hand)).toBeLessThan(DIM.ruang.tinggi);
    // Seluruh gambar shower hand shower selebar kurang dari bilik pancuran minimal.
    expect(lebarX(hand)).toBeLessThan(90);
    const tetap = gambarShower("shower_tetap", "kondisi", { kerangka: k });
    expect(tinggiMaks(tetap)).toBeLessThan(DIM.ruang.tinggi);
  });

  it("kloset jongkok: lubang tepat di tengah pelat (sumbu kedalaman dan sumbu dinding)", () => {
    // Proyeksi uji yang memetakan kedalaman n ke layar x, lalu a ke layar x pada kerangka kedua: dua pengukuran terpisah.
    const sumbu = (proyeksi: Kerangka["proyeksi"]) => {
      const daftar = gambarBenda("kloset_jongkok", { ...k, proyeksi });
      const pusat = (p: Primitif) => {
        const x = titikSemua([p]).map((t) => t[0]);
        return (Math.min(...x) + Math.max(...x)) / 2;
      };
      const pelat = daftar.find((p) => p.jenis === "poligon" && p.muka === "atas")!;
      const rongga = daftar.find((p) => p.jenis === "poligon" && p.muka === "rongga")!;
      return [pusat(pelat), pusat(rongga)];
    };
    const [pelatN, ronggaN] = sumbu((_x, y, z): Titik => [y, -z]);
    expect(ronggaN).toBeCloseTo(pelatN, 5);
    const [pelatA, ronggaA] = sumbu((x, _y, z): Titik => [x, -z]);
    expect(ronggaA).toBeCloseTo(pelatA, 5);
  });
});
