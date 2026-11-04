import { describe, expect, it } from "vitest";
import { bacaHasilDenahDapur, bisaDigambarDapur, DENAH_DAPUR_TIRUAN, lapisanTerbaca, OBJEK_DAPUR } from "../src/domain/denahDapur";
import { RUANG_TETAP } from "../src/domain/gambarRuangTetap";
import { PROMPT, SKEMA } from "../server/denahDapur";
import { AWAL, reducer } from "../src/state/reducer";
import { komporGasPortabel } from "../src/domain/perabotUmum";
import { konteksUji } from "./konteksRuangUji";

const sah = { dapur: true, objek: { meja_kerja: true, kompor: true, wastafel: false, kulkas: false, pintu: true } };

describe("bacaHasilDenahDapur", () => {
  it("membaca respons yang sah", () => {
    const h = bacaHasilDenahDapur(sah)!;
    expect(h.dapur).toBe(true);
    expect(h.terbaca).toEqual({ meja_kerja: true, kompor: true, kompor_portabel: false, wastafel: false, kulkas: false, pintu: true });
    expect([...lapisanTerbaca(h)].sort()).toEqual(["kompor", "meja", "pintu"]);
  });

  it("menolak bentuk yang salah", () => {
    expect(bacaHasilDenahDapur(null)).toBeNull();
    expect(bacaHasilDenahDapur("x")).toBeNull();
    expect(bacaHasilDenahDapur({ objek: {} })).toBeNull();
    expect(bacaHasilDenahDapur({ dapur: "ya" })).toBeNull();
  });

  it("nilai selain true atau yang hilang dianggap tidak terbaca, tidak ditebak", () => {
    const h = bacaHasilDenahDapur({ dapur: true, objek: { kompor: "ya", kulkas: 1, wastafel: true } })!;
    expect(h.terbaca).toEqual({ meja_kerja: false, kompor: false, kompor_portabel: false, wastafel: true, kulkas: false, pintu: false });
  });

  it("gambar hanya dibuat bila dapur dan sedikitnya satu benda terbaca", () => {
    expect(bisaDigambarDapur(null)).toBe(false);
    expect(bisaDigambarDapur(bacaHasilDenahDapur({ dapur: false, objek: sah.objek }))).toBe(false);
    expect(bisaDigambarDapur(bacaHasilDenahDapur({ dapur: true, objek: {} }))).toBe(false);
    expect(bisaDigambarDapur(bacaHasilDenahDapur(sah))).toBe(true);
    expect(bisaDigambarDapur(DENAH_DAPUR_TIRUAN)).toBe(true);
  });
});

describe("skema dan prompt server denah dapur", () => {
  it("skema memuat semua benda sebagai boolean wajib, tanpa posisi atau angka", () => {
    expect(SKEMA.required).toEqual(["dapur", "objek"]);
    expect(SKEMA.properties.objek.required).toEqual([...OBJEK_DAPUR]);
    for (const id of OBJEK_DAPUR) expect(SKEMA.properties.objek.properties[id]).toEqual({ type: "BOOLEAN" });
    expect(PROMPT).toMatch(/Never estimate sizes/);
  });
});

describe("gambar dapur dari hasil baca foto", () => {
  const susun = (id: string | null, ada: ReadonlySet<string>) =>
    RUANG_TETAP.dapur.susun(id, { ...konteksUji("dapur"), ada }).lapisan.map((l) => l.id);

  it("hanya benda yang terbaca yang digambar", () => {
    const ids = susun(null, new Set(["kompor", "pintu"]));
    expect(ids).toEqual(expect.arrayContaining(["kompor", "pintu"]));
    for (const x of ["meja", "wastafel", "kulkas"]) expect(ids).not.toContain(x);
  });

  it("kompor portabel digambar di atas meja bila meja terbaca, dan di meja kecil sendiri bila tidak", () => {
    const denganMeja = susun(null, new Set(["meja", "kompor_portabel"]));
    expect(denganMeja).toEqual(expect.arrayContaining(["meja", "kompor_portabel"]));
    expect(denganMeja).not.toContain("kompor");
    const tanpaMeja = RUANG_TETAP.dapur.susun(null, { ...konteksUji("dapur"), ada: new Set(["kompor_portabel"]) }).lapisan;
    expect(tanpaMeja.map((l) => l.id)).toEqual(["kompor_portabel"]);
    expect(tanpaMeja[0]!.daftar.length).toBeGreaterThan(komporGasPortabel(konteksUji("dapur").kerangka("belakang")).length);
  });

  it("pertanyaan tentang benda yang tidak terbaca tetap menggambar versi hijaunya", () => {
    const ids = susun("K-06", new Set(["kompor"]));
    expect(ids).toContain("kulkas-mod");
    expect(ids).not.toContain("kulkas");
  });

  it("tanpa hasil baca dipakai tata letak contoh tanpa kulkas, dan ruang lengkap memuat kulkas", () => {
    const tanpa = RUANG_TETAP.dapur.susun(null, konteksUji("dapur")).lapisan.map((l) => l.id);
    expect(tanpa).not.toContain("kulkas");
    expect(RUANG_TETAP.dapur.susun("LENGKAP", { ...konteksUji("dapur"), ada: new Set() }).lapisan.map((l) => l.id)).toContain("kulkas");
  });
});

describe("denah dapur di state", () => {
  it("disimpan, dan dihapus saat foto berubah atau area diganti", () => {
    const s0 = reducer(AWAL, { jenis: "pilih_area", areaId: "dapur" });
    const s1 = reducer(s0, { jenis: "selesai_denah_dapur", denah: DENAH_DAPUR_TIRUAN });
    expect(s1.denahDapur).toBe(DENAH_DAPUR_TIRUAN);
    expect(reducer(s1, { jenis: "tambah_foto", foto: { id: "a", url: "x" } }).denahDapur).toBeNull();
    expect(reducer(s1, { jenis: "pilih_area", areaId: "kamar-tidur" }).denahDapur).toBeNull();
  });
});
