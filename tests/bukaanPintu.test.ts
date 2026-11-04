import { describe, expect, it } from "vitest";
import { bukaanDinding, gambarBenda } from "../src/domain/gambarBenda";
import { kerangkaPanel, type Primitif } from "../src/domain/gambarShower";

const poligon = (daftar: Primitif[]) => daftar.filter((p): p is Extract<Primitif, { jenis: "poligon" }> => p.jenis === "poligon");

describe("bukaan pintu", () => {
  it("lubang polos: abu-abu rata area luar, tanpa garis tepi, tanpa lantai atau garis di dalamnya", () => {
    const hasil = bukaanDinding(kerangkaPanel("kanan"));
    expect(hasil).toHaveLength(1);
    const lubang = hasil[0];
    expect(lubang.jenis).toBe("poligon");
    if (lubang.jenis === "poligon") {
      expect(lubang.muka).toBe("luar");
      expect(lubang.tanpaGaris).toBe(true);
      expect(lubang.titik).toHaveLength(4);
    }
    expect(JSON.stringify(hasil)).not.toMatch(/null|NaN|Infinity/);
  });

  it("daun pintu ayun ke luar tidak keluar dari lubang (tidak memotong dinding)", () => {
    const k = kerangkaPanel("kanan");
    const lubang = poligon(bukaanDinding(k))[0].titik;
    const xs = lubang.map((t) => t[0]);
    const ys = lubang.map((t) => t[1]);
    const kusen = new Set(gambarBenda("pintu_tanpa_daun", k).map((p) => JSON.stringify(p)));
    const daun = poligon(gambarBenda("pintu_ayun_luar", k)).filter((p) => !kusen.has(JSON.stringify(p)));
    expect(daun.length).toBeGreaterThan(0);
    for (const p of daun) {
      for (const [x, y] of p.titik) {
        expect(x).toBeGreaterThanOrEqual(Math.min(...xs) - 1e-6);
        expect(x).toBeLessThanOrEqual(Math.max(...xs) + 1e-6);
        expect(y).toBeGreaterThanOrEqual(Math.min(...ys) - 1e-6);
        expect(y).toBeLessThanOrEqual(Math.max(...ys) + 1e-6);
      }
    }
  });

  it("pintu ayun ke luar tidak menggambar garis lintasan ayun di lantai luar", () => {
    const hasil = gambarBenda("pintu_ayun_luar", kerangkaPanel("kanan"));
    expect(hasil.some((p) => p.jenis === "garisPoli")).toBe(false);
    const dalam = gambarBenda("pintu", kerangkaPanel("kanan"));
    expect(dalam.some((p) => p.jenis === "garisPoli" && p.peran === "hantu")).toBe(true);
  });

  it("daun pintu geser berada di sisi luar: hanya bagian di dalam lubang yang digambar", () => {
    const k = kerangkaPanel("kanan");
    const lubang = poligon(bukaanDinding(k))[0].titik;
    const xs = lubang.map((t) => t[0]);
    const ys = lubang.map((t) => t[1]);
    const kusen = new Set(gambarBenda("pintu_tanpa_daun", k).map((p) => JSON.stringify(p)));
    const daun = poligon(gambarBenda("pintu_geser", k)).filter((p) => !kusen.has(JSON.stringify(p)));
    expect(daun.length).toBeGreaterThan(0);
    for (const p of daun) {
      for (const [x, y] of p.titik) {
        expect(x).toBeGreaterThanOrEqual(Math.min(...xs) - 1e-6);
        expect(x).toBeLessThanOrEqual(Math.max(...xs) + 1e-6);
        expect(y).toBeGreaterThanOrEqual(Math.min(...ys) - 1e-6);
        expect(y).toBeLessThanOrEqual(Math.max(...ys) + 1e-6);
      }
    }
  });
});
