import type { Titik } from "../domain/gambarShower";

const ELEVASI_KAMERA = Math.atan(1 / Math.sqrt(2));
const JARAK_KAMERA = 12;
const TITIK_BIDIK: readonly [number, number, number] = [0, 0.3, 0];

type V3 = readonly [number, number, number];
const kurang = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const titikKali = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const silang = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const satuan = (a: V3): V3 => {
  const p = Math.hypot(...a);
  return [a[0] / p, a[1] / p, a[2] / p];
};

/** Posisi kamera isometrik pada sudut `azimuth` (radian) mengelilingi titik bidik, pada elevasi isometrik sejati. */
export function posisiKameraIso(azimuth: number): V3 {
  return [
    JARAK_KAMERA * Math.cos(ELEVASI_KAMERA) * Math.cos(azimuth),
    JARAK_KAMERA * Math.sin(ELEVASI_KAMERA),
    JARAK_KAMERA * Math.cos(ELEVASI_KAMERA) * Math.sin(azimuth),
  ];
}

/**
 * Proyeksi ortografik dari koordinat ruangan (x sepanjang lebar, y sepanjang kedalaman, z tinggi) ke piksel kanvas
 * `lebar` x `tinggi`; setengah-tinggi pandangan `frustum` dalam satuan ruangan. Hasilnya sama dengan kamera ortografik
 * Three.js yang menghadap titik bidik (tes membandingkannya), tanpa memuat Three.js.
 */
export function bangunProyeksi(
  azimuth: number,
  lebar: number,
  tinggi: number,
  frustum: number,
): (x: number, y: number, z: number) => Titik {
  const posisi = posisiKameraIso(azimuth);
  const depan = satuan(kurang(TITIK_BIDIK, posisi));
  const kanan = satuan(silang(depan, [0, 1, 0]));
  const atas = silang(kanan, depan);
  const aspek = lebar / tinggi;
  return (x, y, z) => {
    // Koordinat dunia kamera: x ke kanan, y naik, kedalaman ruangan di sumbu ketiga (z ruangan = tinggi = sumbu naik).
    const d = kurang([x, z, y], posisi);
    return [((titikKali(d, kanan) / (frustum * aspek)) * 0.5 + 0.5) * lebar, (0.5 - (titikKali(d, atas) / frustum) * 0.5) * tinggi];
  };
}
