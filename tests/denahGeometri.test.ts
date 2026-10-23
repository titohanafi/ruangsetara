import { describe, expect, it } from "vitest";
import {
  OBJEK_DENAH,
  POSISI_BAWAAN,
  selesaikanTabrakanDenah,
  type LetakDenah,
  type ObjekDenah,
  type PosisiObjek,
} from "../src/domain/denahPindai";
import { H, iso, PAD, titikDinding, W } from "../src/domain/denahGeometri";
import { setengahFootprintObjek } from "../src/domain/objekUkuran";

// 8+ tata letak sintetis: bawaan, satu benda per dinding berbeda, semua benda di dinding yang sama (memicu
// `selesaikanTabrakanDenah`), dan kombinasi "tidak_terlihat" — tidak merender SVG/React, cuma memeriksa koordinat
// yang dihasilkan fungsi geometri murni.
const SEMUA_SATU_DINDING: Record<ObjekDenah, PosisiObjek> = Object.fromEntries(
  OBJEK_DENAH.map((id) => [id, { dinding: "belakang", posisi: "tengah" }]),
) as Record<ObjekDenah, PosisiObjek>;

const SATU_PER_DINDING: Record<ObjekDenah, PosisiObjek> = {
  pintu: { dinding: "depan", posisi: "tengah" },
  kloset: { dinding: "belakang", posisi: "kiri" },
  wastafel: { dinding: "kiri", posisi: "tengah" },
  area_mandi: { dinding: "kanan", posisi: "tengah" },
};

const SEBAGIAN_TIDAK_TERLIHAT: Record<ObjekDenah, PosisiObjek> = {
  pintu: { dinding: "depan", posisi: "tengah" },
  kloset: { dinding: "tidak_terlihat", posisi: "tengah" },
  wastafel: { dinding: "belakang", posisi: "kanan" },
  area_mandi: { dinding: "tidak_terlihat", posisi: "tengah" },
};

const DAFTAR_DINDING_TUNGGAL = (["kiri", "kanan", "depan", "belakang"] as const).map((dinding): Record<ObjekDenah, PosisiObjek> => ({
  pintu: { dinding: "depan", posisi: "tengah" },
  kloset: { dinding: "belakang", posisi: "tengah" },
  wastafel: { dinding: "kiri", posisi: "tengah" },
  area_mandi: { dinding, posisi: "tengah" },
}));

const DAFTAR_LAYOUT: [string, Record<ObjekDenah, PosisiObjek>][] = [
  ["bawaan (POSISI_BAWAAN)", POSISI_BAWAAN as Record<ObjekDenah, PosisiObjek>],
  ["semua satu dinding (tabrakan)", SEMUA_SATU_DINDING],
  ["satu benda per dinding", SATU_PER_DINDING],
  ["sebagian tidak_terlihat", SEBAGIAN_TIDAK_TERLIHAT],
  ...DAFTAR_DINDING_TUNGGAL.map((l, i): [string, Record<ObjekDenah, PosisiObjek>] => [`area_mandi di dinding #${i}`, l]),
];

describe("titikDinding + iso: invariant geometri (tanpa render SVG)", () => {
  it.each(DAFTAR_LAYOUT)("semua titik benda berada di dalam batas ruangan (%s)", (_nama, layoutAwal) => {
    const letak = selesaikanTabrakanDenah(layoutAwal);
    for (const id of OBJEK_DENAH) {
      if (letak[id].dinding === "tidak_terlihat") continue;
      const titik = titikDinding(letak[id] as LetakDenah);
      expect(Number.isFinite(titik.x)).toBe(true);
      expect(Number.isFinite(titik.y)).toBe(true);
      expect(titik.x).toBeGreaterThanOrEqual(PAD);
      expect(titik.x).toBeLessThanOrEqual(W - PAD);
      expect(titik.y).toBeGreaterThanOrEqual(PAD);
      expect(titik.y).toBeLessThanOrEqual(H - PAD);
    }
  });

  it.each(DAFTAR_LAYOUT)("proyeksi iso() selalu menghasilkan angka valid (%s)", (_nama, layoutAwal) => {
    const letak = selesaikanTabrakanDenah(layoutAwal);
    for (const id of OBJEK_DENAH) {
      if (letak[id].dinding === "tidak_terlihat") continue;
      const titik = titikDinding(letak[id] as LetakDenah);
      const p = iso(titik.x, titik.y);
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  it("titikDinding menghasilkan titik berbeda untuk dinding yang berbeda (tidak collapse ke satu titik)", () => {
    const dindingUnik = (["kiri", "kanan", "depan", "belakang"] as const).map((dinding) => titikDinding({ dinding, posisi: "tengah" }));
    for (let i = 0; i < dindingUnik.length; i++) {
      for (let j = i + 1; j < dindingUnik.length; j++) {
        const jarak = Math.hypot(dindingUnik[i].x - dindingUnik[j].x, dindingUnik[i].y - dindingUnik[j].y);
        expect(jarak).toBeGreaterThan(0);
      }
    }
  });
});

describe("objekUkuran: katalog ukuran skematik", () => {
  it.each(OBJEK_DENAH)("setengahFootprintObjek(%s) menghasilkan angka positif dan finite", (objek) => {
    const f = setengahFootprintObjek(objek);
    expect(f.sepanjang).toBeGreaterThan(0);
    expect(f.dalam).toBeGreaterThan(0);
    expect(Number.isFinite(f.sepanjang)).toBe(true);
    expect(Number.isFinite(f.dalam)).toBe(true);
  });
});
