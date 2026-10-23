import { describe, expect, it } from "vitest";
import { OBJEK_DENAH, POSISI_BAWAAN, type HasilDenah, type LetakDenah, type ObjekDenah } from "../src/domain/denahPindai";
import { titikDinding } from "../src/domain/denahGeometri";
import { DIM } from "../src/domain/dimensiGambar";
import { BERGAMBAR, dindingSamping, gambarModifikasi, PENGGANTI, type KonteksModifikasi } from "../src/domain/gambarModifikasi";
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
  // M-01 dan M-04 menggambar hanya lewat penggantian benda (pintu, kloset), tanpa bagian tambahan.
  const soloPengganti = ["M-01", "M-04"];

  it("setiap gambar menghasilkan titik berhingga", () => {
    for (const id of soloPengganti) expect(gambarModifikasi(id, konteks()), id).toEqual([]);
    for (const id of Object.keys(BERGAMBAR).filter((i) => !soloPengganti.includes(i))) {
      const bagian = gambarModifikasi(id, konteks());
      expect(bagian.length, id).toBeGreaterThan(0);
      for (const b of bagian) for (const [x, y] of semuaTitik(b.daftar)) expect(Number.isFinite(x) && Number.isFinite(y), id).toBe(true);
    }
  });

  it("pertanyaan yang gambarnya bukan bagian tambahan menghasilkan daftar kosong", () => {
    expect(gambarModifikasi("M-07", konteks())).toEqual([]); // hand shower: lewat mode gambar shower
    expect(gambarModifikasi("tidak-ada", konteks())).toEqual([]);
  });

  it("pergantian benda (PENGGANTI) hanya untuk benda yang ada di BERGAMBAR", () => {
    for (const [id, objek] of Object.entries(PENGGANTI)) expect(BERGAMBAR[id], id).toContain(objek);
  });

  it("cermin (M-06) memakai tepi bawah ADA dan tepi atas PerMen dari tabel, dalam jangkauan wajar", () => {
    expect(DIM.cermin.tepiBawah).toBe(101.5);
    expect(DIM.cermin.tepiAtas).toBe(180);
    expect(DIM.cermin.tepiAtas).toBeLessThan(DIM.ruang.tinggi);
    const [b] = gambarModifikasi("M-06", konteks());
    expect(b.objek).toBe("wastafel");
  });

  it("lantai bertekstur (M-09) tidak bergantung benda dan menutup seluruh lantai", () => {
    const [b] = gambarModifikasi("M-09", konteks());
    expect(b).toMatchObject({ objek: null, pijak: "lantai" });
    expect(b.daftar.length).toBeGreaterThan(50);
  });

  it("rak dan handuk (M-11): satu di area mandi, satu di wastafel, tinggi dalam rentang jangkauan", () => {
    const bagian = gambarModifikasi("M-11", konteks());
    expect(bagian.map((b) => b.objek).sort()).toEqual(["area_mandi", "wastafel"]);
    expect((DIM.jangkauan.bawah + DIM.jangkauan.atas) / 2).toBeGreaterThanOrEqual(DIM.jangkauan.bawah);
  });

  it("tombol darurat (M-12): dekat kloset dan dekat area mandi", () => {
    expect(gambarModifikasi("M-12", konteks()).map((b) => b.objek)).toEqual(["kloset", "area_mandi"]);
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
        for (const id of Object.keys(BERGAMBAR).filter((i) => !soloPengganti.includes(i)))
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
    expect(id(r.digambar)).toEqual(["M-01", "M-05"]);
    expect(id(r.belumDigambar)).toEqual([]);
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

  it("rak dan handuk (M-11) tetap digambar bila salah satu bendanya terlihat; tombol darurat (M-12) bila salah satu dari tiga", () => {
    expect(id(ringkasModifikasi(daftar, tidak("M-11"), denah({}, ["area_mandi"])).digambar)).toEqual(["M-11"]);
    expect(id(ringkasModifikasi(daftar, tidak("M-11"), denah({}, ["area_mandi", "wastafel"])).bendaTakTerlihat)).toEqual(["M-11"]);
    expect(id(ringkasModifikasi(daftar, tidak("M-12"), denah({}, ["kloset", "area_mandi"])).digambar)).toEqual(["M-12"]);
  });

  it("lantai bertekstur (M-09) dan ruang putar (M-02) digambar walau semua benda tidak terbaca", () => {
    const r = ringkasModifikasi(daftar, tidak("M-02", "M-09"), denah({}, [...OBJEK_DENAH]));
    expect(id(r.digambar)).toEqual(["M-02", "M-09"]);
  });

  it("semua 12 pertanyaan kamar mandi kini punya gambar (tidak ada yang belum digambar)", () => {
    const r = ringkasModifikasi(daftar, tidak(...daftar.map((p) => p.id)), denah());
    expect(id(r.belumDigambar)).toEqual([]);
    expect(id(r.digambar)).toHaveLength(12);
  });

  it("kloset tidak terbaca: M-03, M-04, M-05 tidak digambar, M-02 tetap (tidak bergantung benda)", () => {
    const r = ringkasModifikasi(daftar, tidak("M-02", "M-03", "M-04", "M-05"), denah({}, ["kloset"]));
    expect(id(r.digambar)).toEqual(["M-02"]);
    expect(id(r.bendaTakTerlihat)).toEqual(["M-03", "M-04", "M-05"]);
  });
});
