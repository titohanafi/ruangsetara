import { describe, expect, it } from "vitest";
import { bangunProyeksi } from "../src/lib/proyeksiIso3D";

// Proyeksi ortografik ditulis sendiri (tanpa Three.js). Di Transisi tesnya membandingkan dengan kamera Three.js;
// di sini Three.js tidak dipasang, jadi yang dicek adalah sifat proyeksinya.
describe("proyeksi isometrik", () => {
  const [lebar, tinggi, frustum] = [280, 256, 4.1];

  it.each([Math.PI / 4, (3 * Math.PI) / 4])("titik bidik jatuh di tengah kanvas (azimuth %f)", (azimuth) => {
    const [px, py] = bangunProyeksi(azimuth, lebar, tinggi, frustum)(0, 0, 0.3);
    expect(px).toBeCloseTo(lebar / 2, 6);
    expect(py).toBeCloseTo(tinggi / 2, 6);
  });

  it("naik di ruangan berarti naik di layar, dan garis sejajar tetap sejajar", () => {
    const p = bangunProyeksi(Math.PI / 4, lebar, tinggi, frustum);
    expect(p(0, 0, 1)[1]).toBeLessThan(p(0, 0, 0)[1]);
    const a = [p(1, 0, 0)[0] - p(0, 0, 0)[0], p(1, 0, 0)[1] - p(0, 0, 0)[1]];
    const b = [p(3, 2, 1)[0] - p(2, 2, 1)[0], p(3, 2, 1)[1] - p(2, 2, 1)[1]];
    expect(b[0]).toBeCloseTo(a[0], 9);
    expect(b[1]).toBeCloseTo(a[1], 9);
  });
});
