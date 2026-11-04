import { describe, expect, it } from "vitest";
import { bukaanDinding } from "../src/domain/gambarBenda";
import { kerangkaPanel } from "../src/domain/gambarShower";

describe("bukaan pintu", () => {
  it("lubang putih tembus (bukan warna dinding) dan berhingga", () => {
    const hasil = bukaanDinding(kerangkaPanel("kanan"));
    expect(hasil.length).toBeGreaterThan(0);
    const lubang = hasil[0];
    expect(lubang.jenis).toBe("poligon");
    if (lubang.jenis === "poligon") {
      expect(lubang.muka).toBe("latar");
      expect(lubang.peran).toBe("netral");
    }
    expect(JSON.stringify(hasil)).not.toMatch(/null|NaN|Infinity/);
  });

  it("lantai di balik bukaan, bila tampak, tidak keluar dari lubang", () => {
    const [lubang, lantai] = bukaanDinding({ ...kerangkaPanel("kanan"), lihat: { x: -1, y: 1 } });
    if (!lantai || lantai.jenis !== "poligon" || lubang.jenis !== "poligon") return;
    const xs = lubang.titik.map((t) => t[0]);
    const ys = lubang.titik.map((t) => t[1]);
    for (const [x, y] of lantai.titik) {
      expect(x).toBeGreaterThanOrEqual(Math.min(...xs) - 1e-6);
      expect(x).toBeLessThanOrEqual(Math.max(...xs) + 1e-6);
      expect(y).toBeGreaterThanOrEqual(Math.min(...ys) - 1e-6);
      expect(y).toBeLessThanOrEqual(Math.max(...ys) + 1e-6);
    }
  });
});
