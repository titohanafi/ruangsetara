import { describe, expect, it } from "vitest";
import { OBJEK_DENAH, POSISI_BAWAAN, type HasilDenah, type LetakDenah, type ObjekDenah } from "../src/domain/denahPindai";
import { titikDinding } from "../src/domain/denahGeometri";
import { DIM } from "../src/domain/dimensiGambar";
import { BERGAMBAR, dindingSamping, gambarModifikasi, type KonteksModifikasi } from "../src/domain/gambarModifikasi";
import type { Dinding, Kerangka, Primitif, Titik } from "../src/domain/gambarShower";
import { PERTANYAAN } from "../src/domain/konten";
import { ringkasModifikasi } from "../src/domain/modifikasi";
import { posisiSepanjang } from "../src/domain/tataLetak";

const bidang: Record<Dinding, number> = {
  belakang: -DIM.ruang.dalam / 2,
  depan: DIM.ruang.dalam / 2,
  kiri: -DIM.ruang.lebar / 2,
  kanan: DIM.ruang.lebar / 2,
};
const proyeksi = (x: number, y: number, z: number): Titik => [x - y, (x + y) / 2 - z];
const kerangka = (dinding: Dinding): Kerangka => ({ dinding, sepanjang: 0, bidang: bidang[dinding], proyeksi, skala: 1 });

function konteks(
  dindingTergambar: Dinding[] = ["belakang", "kanan"],
  letak: (id: ObjekDenah) => LetakDenah = (id) => POSISI_BAWAAN[id],
): KonteksModifikasi {
  return { kerangka, proyeksi, letak, posisi: posisiSepanjang(letak), dindingTergambar };
}

function semuaTitik(daftar: Primitif[]): Titik[] {
  return daftar.flatMap((p) => ("titik" in p ? p.titik : "dari" in p ? [p.dari, p.ke] : []));
}

describe("dinding samping terdekat", () => {
  it("benda di dinding belakang atau depan: ke kanan bila di sisi kanan; di dinding samping: ke depan atau belakang", () => {
    expect(dindingSamping("belakang", 10)).toBe("kanan");
    expect(dindingSamping("belakang", -10)).toBe("kiri");
    expect(dindingSamping("depan", 0)).toBe("kanan");
    expect(dindingSamping("kanan", 5)).toBe("depan");
    expect(dindingSamping("kiri", -5)).toBe("belakang");
  });
});

describe("gambar modifikasi", () => {
  it("setiap gambar menghasilkan titik berhingga (M-04 menggambar lewat penggantian kloset, bukan bagian tambahan)", () => {
    expect(gambarModifikasi("M-04", konteks())).toEqual([]);
    for (const id of Object.keys(BERGAMBAR).filter((i) => i !== "M-04")) {
      const bagian = gambarModifikasi(id, konteks());
      expect(bagian.length, id).toBeGreaterThan(0);
      for (const b of bagian) for (const [x, y] of semuaTitik(b.daftar)) expect(Number.isFinite(x) && Number.isFinite(y), id).toBe(true);
    }
  });

  it("pertanyaan tanpa gambar menghasilkan daftar kosong", () => {
    expect(gambarModifikasi("M-12", konteks())).toEqual([]);
  });

  it("pegangan (M-05): batang belakang dan samping, samping hanya bila dindingnya digambar", () => {
    const loksi = konteks(["belakang", "kanan"]);
    expect(gambarModifikasi("M-05", loksi)).toHaveLength(2);
    // Kloset belakang/kanan: dinding samping terdekat = kanan. Bila hanya dinding kiri digambar, tinggal batang belakang.
    expect(gambarModifikasi("M-05", konteks(["belakang", "kiri"]))).toHaveLength(1);
    for (const b of gambarModifikasi("M-05", loksi)) expect(b.objek).toBe("kloset");
  });

  it("zona lantai (M-02, M-03, M-08) digambar di lantai dan terikat benda yang benar", () => {
    expect(gambarModifikasi("M-02", konteks())[0]).toMatchObject({ objek: null, pijak: "lantai" });
    expect(gambarModifikasi("M-03", konteks())[0]).toMatchObject({ objek: "kloset", pijak: "lantai" });
    expect(gambarModifikasi("M-08", konteks())[0]).toMatchObject({ objek: "area_mandi", pijak: "lantai" });
  });

  it("kursi mandi (M-10): satu bagian di dinding area shower, naik dari lantai", () => {
    const [b] = gambarModifikasi("M-10", konteks());
    expect(b.objek).toBe("area_mandi");
    const tinggiMaks = Math.max(...semuaTitik(b.daftar).map(([, y]) => -y));
    expect(tinggiMaks).toBeGreaterThan(0);
  });

  it("tetap berhingga di semua kombinasi dinding kloset dan area mandi", () => {
    const dinding: Dinding[] = ["belakang", "kiri", "kanan", "depan"];
    for (const dk of dinding)
      for (const dm of dinding) {
        const letak = (id: ObjekDenah): LetakDenah =>
          id === "kloset" ? { dinding: dk, posisi: "tengah" } : id === "area_mandi" ? { dinding: dm, posisi: "tengah" } : POSISI_BAWAAN[id];
        for (const id of Object.keys(BERGAMBAR).filter((i) => i !== "M-04"))
          for (const b of gambarModifikasi(id, konteks(["belakang", "kanan"], letak)))
            for (const [x, y] of semuaTitik(b.daftar)) expect(Number.isFinite(x) && Number.isFinite(y), `${id} ${dk} ${dm}`).toBe(true);
      }
    expect(titikDinding(POSISI_BAWAAN.kloset).dinding).toBe("belakang");
  });
});

const denah = (o: Partial<HasilDenah> = {}, tak: ObjekDenah[] = []): HasilDenah => ({
  kamarMandi: true,
  objek: Object.fromEntries(
    OBJEK_DENAH.map((id) => [id, tak.includes(id) ? { dinding: "tidak_terlihat", posisi: "tengah" } : POSISI_BAWAAN[id]]),
  ) as HasilDenah["objek"],
  varianShower: "hand_shower_gantung",
  jenisKloset: "duduk",
  varianPintu: "ayun_ke_dalam",
  ...o,
});
const tidak = (...ids: string[]) => Object.fromEntries(ids.map((i) => [i, { nilai: "tidak" as const, sumber: "pengguna" as const }]));
const daftar = PERTANYAAN["kamar-mandi"].pertanyaan;
const id = (r: { id: string }[]) => r.map((p) => p.id);

describe("ringkasModifikasi", () => {
  it("memisahkan yang digambar, yang belum ada gambarnya, dan yang bendanya tidak terbaca", () => {
    const r = ringkasModifikasi(daftar, tidak("M-01", "M-05", "M-07", "M-10"), denah({}, ["area_mandi"]));
    expect(id(r.digambar)).toEqual(["M-05"]);
    expect(id(r.belumDigambar)).toEqual(["M-01"]);
    expect(id(r.bendaTakTerlihat)).toEqual(["M-07", "M-10"]);
  });

  it("hanya jawaban Tidak yang digambar; Ya dan Belum tahu tidak", () => {
    const j = {
      ...tidak("M-05"),
      "M-10": { nilai: "ya" as const, sumber: "pengguna" as const },
      "M-08": { nilai: "belum" as const, sumber: "pengguna" as const },
    };
    expect(id(ringkasModifikasi(daftar, j, denah()).digambar)).toEqual(["M-05"]);
  });

  it("perlengkapan mandi (M-07) hanya digambar untuk hand shower yang digantung", () => {
    expect(id(ringkasModifikasi(daftar, tidak("M-07"), denah()).digambar)).toEqual(["M-07"]);
    expect(id(ringkasModifikasi(daftar, tidak("M-07"), denah({ varianShower: "shower_tetap" })).belumDigambar)).toEqual(["M-07"]);
  });

  it("kloset tidak terbaca: M-03, M-04, M-05 tidak digambar, M-02 tetap (tidak bergantung benda)", () => {
    const r = ringkasModifikasi(daftar, tidak("M-02", "M-03", "M-04", "M-05"), denah({}, ["kloset"]));
    expect(id(r.digambar)).toEqual(["M-02"]);
    expect(id(r.bendaTakTerlihat)).toEqual(["M-03", "M-04", "M-05"]);
  });
});
