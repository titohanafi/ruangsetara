import { describe, expect, it } from "vitest";
import { titikPrimitif } from "../src/domain/gambarBenda";
import type { KonteksRuang } from "../src/domain/gambarRuang";
import { RUANG_TETAP } from "../src/domain/gambarRuangTetap";
import { titikDinding } from "../src/domain/denahGeometri";
import { DENAH_TIRUAN, letakDariDenah } from "../src/domain/denahPindai";
import { DIM } from "../src/domain/dimensiGambar";
import { gambarBenda } from "../src/domain/gambarBenda";
import type { Dinding, Kerangka, Primitif } from "../src/domain/gambarShower";
import { kursiRoda, tempatSampah, waterHeater } from "../src/domain/perabotUmum";
import { letakLantaiLengkap, posisiSepanjang } from "../src/domain/tataLetak";

// Ruang terisi lengkap harus masuk akal: dua benda tidak boleh menempati lantai yang sama, dan tidak ada benda (termasuk kursi roda)
// yang berdiri di area ayunan pintu. Denah dilihat dari atas: proyeksi (x, y, z) -> (x, y), jadi kotak pembatas tiap benda adalah
// jejaknya di lantai. Bentuk bulat (silinder, roda) dihitung dari titik pusat dan jari-jarinya.
const dariAtas = (x: number, y: number): [number, number] => [x, y];

/** Benda yang memang boleh tumpang tindih dengan benda lain di denah atas: tergantung di dinding, bertumpu di benda lain, atau alas datar. */
const BOLEH_TUMPANG = new Set([
  "kabinetAtas", // tergantung di atas meja dapur
  "rakPiring", // tergantung di dinding
  "microwave", // di atas meja dapur
  "riceCooker", // di atas meja dapur
  "saklar", // menempel di dinding
  "lampuMeja", // di atas nakas
  "keset", // alas datar
  "karpet", // alas datar
  "retak", // tanda keramik retak di lantai
  "undakan", // ambang pintu, bagian dari pintu
]);

type Kotak = { x0: number; x1: number; y0: number; y1: number };

function jejak(daftar: Primitif[]): Kotak | null {
  const pts: [number, number][] = [];
  for (const p of daftar) {
    if (p.jenis === "elips") {
      const r = p.ry * Math.SQRT2;
      pts.push([p.cx - r, p.cy - r], [p.cx + r, p.cy + r]);
    } else if (p.jenis === "badan") {
      const r = p.ry * Math.SQRT2;
      pts.push([p.cx - r, p.yAtas - r], [p.cx + r, p.yAtas + r]);
    } else if (p.jenis === "cakram") pts.push([p.cx, p.cy]);
    else pts.push(...(titikPrimitif(p) as [number, number][]));
  }
  if (pts.length === 0) return null;
  const xs = pts.map((t) => t[0]);
  const ys = pts.map((t) => t[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

const tumpang = (a: Kotak, b: Kotak, toleransi = 1): boolean =>
  a.x0 < b.x1 - toleransi && b.x0 < a.x1 - toleransi && a.y0 < b.y1 - toleransi && b.y0 < a.y1 - toleransi;

describe.each(["dapur", "kamar-tidur", "mobilitas"])("ruang terisi lengkap: %s", (area) => {
  const { ruang, susun } = RUANG_TETAP[area]!;
  const bidang = (d: Dinding): number =>
    d === "belakang" ? -ruang.dalam / 2 : d === "depan" ? ruang.dalam / 2 : d === "kiri" ? -ruang.lebar / 2 : ruang.lebar / 2;
  const konteks: KonteksRuang = {
    kerangka: (dinding) => ({ dinding, sepanjang: 0, bidang: bidang(dinding), proyeksi: dariAtas, skala: 1 }),
    proyeksi: dariAtas,
    tampilkanUkuran: false,
  };
  const benda = susun("LENGKAP", konteks)
    .lapisan.map((l) => ({ id: l.id, kotak: jejak(l.daftar) }))
    .filter((b): b is { id: string; kotak: Kotak } => b.kotak !== null);

  it("tidak ada dua benda di lantai yang sama", () => {
    const lantai = benda.filter((b) => !BOLEH_TUMPANG.has(b.id) && b.id !== "pintu");
    const tabrakan: string[] = [];
    for (const [i, a] of lantai.entries())
      for (const b of lantai.slice(i + 1)) if (tumpang(a.kotak, b.kotak)) tabrakan.push(`${a.id} x ${b.id}`);
    expect(tabrakan).toEqual([]);
  });

  it("kursi roda punya jarak sedikitnya 10 cm dari benda lain dan dari area ayunan pintu", () => {
    const roda = benda.find((b) => b.id === "kursiRoda");
    expect(roda).toBeDefined();
    const dekat = benda
      .filter((b) => b.id !== "kursiRoda" && !BOLEH_TUMPANG.has(b.id) && tumpang(roda!.kotak, b.kotak, -10))
      .map((b) => b.id);
    expect(dekat).toEqual([]);
  });

  it("tidak ada benda di area ayunan pintu", () => {
    const pintu = benda.find((b) => b.id === "pintu");
    expect(pintu).toBeDefined();
    const masuk = benda.filter((b) => b.id !== "pintu" && !BOLEH_TUMPANG.has(b.id) && tumpang(b.kotak, pintu!.kotak)).map((b) => b.id);
    expect(masuk).toEqual([]);
  });

  it("nakas digambar di depan tempat tidur (lebih dekat ke kamera)", () => {
    const urutan = susun("LENGKAP", konteks).lapisan;
    const nakas = urutan.find((l) => l.id === "nakas");
    const tidur = urutan.find((l) => l.id === "tempatTidur");
    if (nakas && tidur) expect(nakas.kedalaman).toBeGreaterThan(tidur.kedalaman);
  });

  it("semua benda ada di dalam ruang", () => {
    const luar = benda
      .filter((b) => b.id !== "pintu")
      .filter(
        (b) =>
          b.kotak.x0 < -ruang.lebar / 2 - 2 ||
          b.kotak.x1 > ruang.lebar / 2 + 2 ||
          b.kotak.y0 < -ruang.dalam / 2 - 2 ||
          b.kotak.y1 > ruang.dalam / 2 + 2,
      )
      .map((b) => b.id);
    expect(luar).toEqual([]);
  });
});

describe("ruang terisi lengkap: kamar mandi (tata letak bawaan)", () => {
  const { lebar, dalam } = DIM.ruang;
  const letak = letakDariDenah(DENAH_TIRUAN.objek);
  const posisi = posisiSepanjang(letak, ["pintu", "kloset", "wastafel", "area_mandi"]);
  const bidang = (d: Dinding): number =>
    d === "belakang" ? -dalam / 2 : d === "depan" ? dalam / 2 : d === "kiri" ? -lebar / 2 : lebar / 2;
  const kerangka = (dinding: Dinding, sepanjang: number, tambahan: Partial<Kerangka> = {}): Kerangka => ({
    dinding,
    sepanjang,
    bidang: bidang(dinding),
    proyeksi: dariAtas,
    skala: 1,
    ...tambahan,
  });
  const dindingShower = titikDinding(letak("area_mandi")).dinding;
  const L = letakLantaiLengkap(DIM.ruang);
  const lantai = (x: number, y: number): Kerangka => kerangka("belakang", x, { bidang: y });
  const daftar: { id: string; daftar: Primitif[] }[] = [
    { id: "pintu", daftar: gambarBenda("pintu", kerangka(titikDinding(letak("pintu")).dinding, posisi.pintu)) },
    { id: "kloset", daftar: gambarBenda("kloset_duduk", kerangka(titikDinding(letak("kloset")).dinding, posisi.kloset)) },
    { id: "wastafel", daftar: gambarBenda("wastafel", kerangka(titikDinding(letak("wastafel")).dinding, posisi.wastafel)) },
    { id: "pemanasAir", daftar: waterHeater(kerangka(dindingShower, posisi.area_mandi + L.geserPemanasAir)) },
    { id: "kursiRoda", daftar: kursiRoda(lantai(...L.kursiRoda)) },
    { id: "tempatSampah", daftar: tempatSampah(lantai(...L.tempatSampah)) },
  ];
  const benda = daftar.map((b) => ({ id: b.id, kotak: jejak(b.daftar)! }));

  it("tidak ada dua benda di lantai yang sama", () => {
    const lantaiBenda = benda.filter((b) => b.id !== "pintu");
    const tabrakan: string[] = [];
    for (const [i, a] of lantaiBenda.entries())
      for (const b of lantaiBenda.slice(i + 1)) if (tumpang(a.kotak, b.kotak)) tabrakan.push(`${a.id} x ${b.id}`);
    expect(tabrakan).toEqual([]);
  });

  it("tidak ada benda di area ayunan pintu", () => {
    const pintu = benda.find((b) => b.id === "pintu")!;
    const masuk = benda.filter((b) => b.id !== "pintu" && tumpang(b.kotak, pintu.kotak)).map((b) => b.id);
    expect(masuk).toEqual([]);
  });

  it("kursi roda punya jarak sedikitnya 10 cm dari benda lain", () => {
    const roda = benda.find((b) => b.id === "kursiRoda")!;
    const dekat = benda.filter((b) => b.id !== "kursiRoda" && tumpang(roda.kotak, b.kotak, -10)).map((b) => b.id);
    expect(dekat).toEqual([]);
  });

  it("semua benda ada di dalam ruang", () => {
    const luar = benda
      .filter((b) => b.id !== "pintu")
      .filter((b) => b.kotak.x0 < -lebar / 2 - 2 || b.kotak.x1 > lebar / 2 + 2 || b.kotak.y0 < -dalam / 2 - 2 || b.kotak.y1 > dalam / 2 + 2)
      .map((b) => b.id);
    expect(luar).toEqual([]);
  });
});
