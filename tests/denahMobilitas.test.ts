import { describe, expect, it } from "vitest";
import {
  bacaHasilDenahMobilitas,
  bisaDigambarMobilitas,
  DENAH_MOBILITAS_TIRUAN,
  lapisanTerbacaMobilitas,
  OBJEK_MOBILITAS,
} from "../src/domain/denahMobilitas";
import { RUANG_TETAP } from "../src/domain/gambarRuangTetap";
import { PROMPT, SKEMA } from "../server/denahMobilitas";
import { AWAL, reducer } from "../src/state/reducer";
import { konteksUji } from "./konteksRuangUji";

const sah = {
  area_rumah: true,
  objek: { pintu: true, undakan: false, lemari_tanam: true, furnitur_besar: false, saklar_stopkontak: false, karpet: true },
};
const ids = (id: string | null, ada?: ReadonlySet<string>) =>
  RUANG_TETAP.mobilitas.susun(id, ada ? { ...konteksUji("mobilitas"), ada } : konteksUji("mobilitas")).lapisan.map((l) => l.id);

describe("bacaHasilDenahMobilitas", () => {
  it("membaca respons yang sah", () => {
    const h = bacaHasilDenahMobilitas(sah)!;
    expect(h.areaRumah).toBe(true);
    expect([...lapisanTerbacaMobilitas(h)].sort()).toEqual(["karpet", "lemariTanam", "pintu"]);
  });

  it("menolak bentuk yang salah dan menganggap nilai selain true tidak terbaca", () => {
    expect(bacaHasilDenahMobilitas(null)).toBeNull();
    expect(bacaHasilDenahMobilitas({ objek: {} })).toBeNull();
    expect(bacaHasilDenahMobilitas({ area_rumah: "ya" })).toBeNull();
    const h = bacaHasilDenahMobilitas({ area_rumah: true, objek: { pintu: "ya", karpet: true } })!;
    expect(Object.values(h.terbaca).filter(Boolean)).toHaveLength(1);
    expect(h.terbaca.karpet).toBe(true);
  });

  it("gambar hanya dibuat bila area rumah dan sedikitnya satu benda terbaca", () => {
    expect(bisaDigambarMobilitas(null)).toBe(false);
    expect(bisaDigambarMobilitas(bacaHasilDenahMobilitas({ area_rumah: false, objek: sah.objek }))).toBe(false);
    expect(bisaDigambarMobilitas(bacaHasilDenahMobilitas({ area_rumah: true, objek: {} }))).toBe(false);
    expect(bisaDigambarMobilitas(bacaHasilDenahMobilitas(sah))).toBe(true);
    expect(bisaDigambarMobilitas(DENAH_MOBILITAS_TIRUAN)).toBe(true);
  });
});

describe("skema dan prompt server denah mobilitas", () => {
  it("skema memuat semua benda sebagai boolean wajib, tanpa posisi atau angka", () => {
    expect(SKEMA.required).toEqual(["area_rumah", "objek"]);
    expect(SKEMA.properties.objek.required).toEqual([...OBJEK_MOBILITAS]);
    for (const id of OBJEK_MOBILITAS) expect(SKEMA.properties.objek.properties[id]).toEqual({ type: "BOOLEAN" });
    expect(PROMPT).toMatch(/Never estimate sizes/);
  });
});

describe("gambar mobilitas dari hasil baca foto", () => {
  it("hanya benda yang terbaca yang digambar, dan keramik retak tidak muncul", () => {
    const daftar = ids(null, new Set(["pintu", "karpet"]));
    expect(daftar).toEqual(expect.arrayContaining(["pintu", "karpet"]));
    for (const x of ["undakan", "lemariTanam", "meja", "saklar", "retak"]) expect(daftar).not.toContain(x);
  });

  it("pertanyaan tentang benda yang tidak terbaca tetap menggambar versi hijaunya", () => {
    const daftar = ids("G-04", new Set(["pintu"]));
    // G-04 mengganti undakan dengan ramp hijau, yang tetap digambar walau undakan tidak terbaca di foto.
    expect(daftar).toContain("ramp-mod");
    expect(daftar).not.toContain("undakan");
  });

  it("tanpa hasil baca dipakai tata letak contoh, dan ruang lengkap memuat semua benda dasar", () => {
    expect(ids(null)).toEqual(expect.arrayContaining(["pintu", "undakan", "lemariTanam", "meja", "saklar", "retak", "karpet"]));
    expect(ids("LENGKAP", new Set())).toEqual(
      expect.arrayContaining(["pintu", "undakan", "lemariTanam", "meja", "saklar", "retak", "karpet"]),
    );
  });
});

describe("denah mobilitas di state", () => {
  it("disimpan, dan dihapus saat foto berubah atau area diganti", () => {
    const s0 = reducer(AWAL, { jenis: "pilih_area", areaId: "mobilitas" });
    const s1 = reducer(s0, { jenis: "selesai_denah_mobilitas", denah: DENAH_MOBILITAS_TIRUAN });
    expect(s1.denahMobilitas).toBe(DENAH_MOBILITAS_TIRUAN);
    expect(reducer(s1, { jenis: "tambah_foto", foto: { id: "a", url: "x" } }).denahMobilitas).toBeNull();
    expect(reducer(s1, { jenis: "pilih_area", areaId: "dapur" }).denahMobilitas).toBeNull();
  });
});
