import { describe, expect, it } from "vitest";
import {
  bacaHasilDenahKamarTidur,
  bisaDigambarKamarTidur,
  DENAH_KAMAR_TIDUR_TIRUAN,
  lapisanTerbacaKamarTidur,
  OBJEK_KAMAR_TIDUR,
} from "../src/domain/denahKamarTidur";
import { RUANG_TETAP } from "../src/domain/gambarRuangTetap";
import { PROMPT, SKEMA } from "../server/denahKamarTidur";
import { AWAL, reducer } from "../src/state/reducer";
import { konteksUji } from "./konteksRuangUji";

const sah = { kamar_tidur: true, objek: { tempat_tidur: true, nakas: false, lemari: true, pintu: true, saklar_stopkontak: false } };

describe("bacaHasilDenahKamarTidur", () => {
  it("membaca respons yang sah", () => {
    const h = bacaHasilDenahKamarTidur(sah)!;
    expect(h.kamarTidur).toBe(true);
    expect([...lapisanTerbacaKamarTidur(h)].sort()).toEqual(["lemari", "pintu", "tempatTidur"]);
  });

  it("menolak bentuk yang salah dan menganggap nilai selain true tidak terbaca", () => {
    expect(bacaHasilDenahKamarTidur(null)).toBeNull();
    expect(bacaHasilDenahKamarTidur({ objek: {} })).toBeNull();
    expect(bacaHasilDenahKamarTidur({ kamar_tidur: "ya" })).toBeNull();
    const h = bacaHasilDenahKamarTidur({ kamar_tidur: true, objek: { nakas: "ya", lemari: true } })!;
    expect(h.terbaca).toEqual({ tempat_tidur: false, nakas: false, lemari: true, pintu: false, saklar_stopkontak: false });
  });

  it("gambar hanya dibuat bila kamar tidur dan sedikitnya satu benda terbaca", () => {
    expect(bisaDigambarKamarTidur(null)).toBe(false);
    expect(bisaDigambarKamarTidur(bacaHasilDenahKamarTidur({ kamar_tidur: false, objek: sah.objek }))).toBe(false);
    expect(bisaDigambarKamarTidur(bacaHasilDenahKamarTidur({ kamar_tidur: true, objek: {} }))).toBe(false);
    expect(bisaDigambarKamarTidur(bacaHasilDenahKamarTidur(sah))).toBe(true);
    expect(bisaDigambarKamarTidur(DENAH_KAMAR_TIDUR_TIRUAN)).toBe(true);
  });
});

describe("skema dan prompt server denah kamar tidur", () => {
  it("skema memuat semua benda sebagai boolean wajib, tanpa posisi atau angka", () => {
    expect(SKEMA.required).toEqual(["kamar_tidur", "objek"]);
    expect(SKEMA.properties.objek.required).toEqual([...OBJEK_KAMAR_TIDUR]);
    for (const id of OBJEK_KAMAR_TIDUR) expect(SKEMA.properties.objek.properties[id]).toEqual({ type: "BOOLEAN" });
    expect(PROMPT).toMatch(/Never estimate sizes/);
  });
});

describe("gambar kamar tidur dari hasil baca foto", () => {
  const susun = (id: string | null, ada: ReadonlySet<string>) =>
    RUANG_TETAP["kamar-tidur"].susun(id, { ...konteksUji("kamar-tidur"), ada }).lapisan.map((l) => l.id);

  it("hanya benda yang terbaca yang digambar", () => {
    const ids = susun(null, new Set(["tempatTidur", "pintu"]));
    expect(ids).toEqual(expect.arrayContaining(["tempatTidur", "pintu"]));
    for (const x of ["nakas", "lemari", "saklar"]) expect(ids).not.toContain(x);
  });

  it("pertanyaan tentang benda yang tidak terbaca tetap menggambar versi hijaunya", () => {
    const ids = susun("B-04", new Set(["pintu"]));
    expect(ids).toContain("tempatTidur-mod");
    expect(ids).not.toContain("tempatTidur");
  });

  it("tanpa hasil baca dipakai tata letak contoh, dan ruang lengkap memuat semua benda dasar", () => {
    const tanpa = RUANG_TETAP["kamar-tidur"].susun(null, konteksUji("kamar-tidur")).lapisan.map((l) => l.id);
    expect(tanpa).toEqual(expect.arrayContaining(["tempatTidur", "nakas", "lemari", "pintu", "saklar"]));
    const lengkap = RUANG_TETAP["kamar-tidur"].susun("LENGKAP", { ...konteksUji("kamar-tidur"), ada: new Set() }).lapisan.map((l) => l.id);
    expect(lengkap).toEqual(expect.arrayContaining(["tempatTidur", "nakas", "lemari", "pintu", "saklar"]));
  });
});

describe("denah kamar tidur di state", () => {
  it("disimpan, dan dihapus saat foto berubah atau area diganti", () => {
    const s0 = reducer(AWAL, { jenis: "pilih_area", areaId: "kamar-tidur" });
    const s1 = reducer(s0, { jenis: "selesai_denah_kamar_tidur", denah: DENAH_KAMAR_TIDUR_TIRUAN });
    expect(s1.denahKamarTidur).toBe(DENAH_KAMAR_TIDUR_TIRUAN);
    expect(reducer(s1, { jenis: "tambah_foto", foto: { id: "a", url: "x" } }).denahKamarTidur).toBeNull();
    expect(reducer(s1, { jenis: "pilih_area", areaId: "dapur" }).denahKamarTidur).toBeNull();
  });
});
