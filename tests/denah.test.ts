import { describe, expect, it } from "vitest";
import { bacaHasilDenah, DENAH_TIRUAN, letakDariDenah, POSISI_BAWAAN, tidakTerlihatDariDenah } from "../src/domain/denahPindai";
import { AWAL, reducer } from "../src/state/reducer";

const sah = {
  kamar_mandi: true,
  objek: {
    pintu: { dinding: "depan", posisi: "kiri" },
    kloset: { dinding: "belakang", posisi: "tengah" },
    wastafel: { dinding: "belakang", posisi: "kiri" },
    area_mandi: { dinding: "kanan", posisi: "tengah" },
  },
  varian_shower: "hand_shower_gantung",
  jenis_kloset: "duduk",
  varian_pintu: "tidak_jelas",
};

describe("bacaHasilDenah", () => {
  it("membaca respons yang sah", () => {
    const h = bacaHasilDenah(sah);
    expect(h?.kamarMandi).toBe(true);
    expect(h?.objek.area_mandi).toEqual({ dinding: "kanan", posisi: "tengah" });
    expect(h?.varianShower).toBe("hand_shower_gantung");
    expect(h?.jenisKloset).toBe("duduk");
    expect(h?.varianPintu).toBe("tidak_jelas");
  });

  it("menolak bentuk yang salah", () => {
    expect(bacaHasilDenah(null)).toBeNull();
    expect(bacaHasilDenah("x")).toBeNull();
    expect(bacaHasilDenah({ objek: {} })).toBeNull();
    expect(bacaHasilDenah({ kamar_mandi: "ya" })).toBeNull();
  });

  it("nilai asing atau hilang menjadi tidak jelas / tidak terlihat, tidak ditebak", () => {
    const h = bacaHasilDenah({
      kamar_mandi: true,
      objek: { pintu: { dinding: "atap", posisi: "x" } },
      varian_shower: "air_terjun",
      jenis_kloset: 3,
    });
    expect(h?.varianShower).toBe("tidak_jelas");
    expect(h?.jenisKloset).toBe("tidak_jelas");
    expect(h?.varianPintu).toBe("tidak_jelas");
    expect(tidakTerlihatDariDenah(h!.objek).sort()).toEqual(["area_mandi", "kloset", "pintu", "wastafel"]);
  });

  it("benda yang tidak terlihat memakai posisi bawaan hanya sebagai tempat", () => {
    const h = bacaHasilDenah({ ...sah, objek: { ...sah.objek, kloset: { dinding: "tidak_terlihat", posisi: "tengah" } } })!;
    expect(tidakTerlihatDariDenah(h.objek)).toEqual(["kloset"]);
    expect(letakDariDenah(h.objek)("kloset")).toEqual(POSISI_BAWAAN.kloset);
  });

  it("hasil tiruan sah dan menampilkan kamar mandi", () => {
    expect(DENAH_TIRUAN.kamarMandi).toBe(true);
    expect(tidakTerlihatDariDenah(DENAH_TIRUAN.objek)).toEqual([]);
  });
});

describe("denah di state", () => {
  it("disimpan, lalu dibuang saat foto atau area berubah", () => {
    let s = reducer(AWAL, { jenis: "pilih_area", areaId: "kamar-mandi" });
    s = reducer(s, { jenis: "selesai_denah", denah: DENAH_TIRUAN });
    expect(s.denah).toEqual(DENAH_TIRUAN);
    expect(reducer(s, { jenis: "tambah_foto", foto: { id: "a", url: "data:" } }).denah).toBeNull();
    expect(reducer(s, { jenis: "hapus_foto", id: "a" }).denah).toBeNull();
    expect(reducer(s, { jenis: "pilih_area", areaId: "dapur" }).denah).toBeNull();
    expect(reducer(s, { jenis: "area_lain" }).denah).toBeNull();
  });
});
