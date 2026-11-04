import { useEffect, useRef, useState } from "react";
import { titikPrimitif } from "../domain/gambarBenda";
import type { HasilRuang, KonteksRuang } from "../domain/gambarRuang";
import {
  garisUbin,
  garisUbinLantai,
  kotak,
  poligon,
  titik,
  type Dinding,
  type Kerangka,
  type Primitif,
  type Titik,
} from "../domain/gambarShower";
import { bangunProyeksi } from "../lib/proyeksiIso3D";
import { LapisPrimitif } from "./LapisPrimitif";

export interface UkuranRuangTetap {
  lebar: number;
  dalam: number;
  tinggi: number;
  tebalDinding: number;
}

const FRUSTUM_AWAL = 2.2;
const MARGIN = 0.03;
// Dinding yang digambar solid: belakang dan kanan. Kamera di (-X,+Z), jadi dinding kanan ada di sisi jauh.
const AZIMUTH = (3 * Math.PI) / 4;

const bidangDalam = (dinding: Dinding, lebar: number, dalam: number): number =>
  dinding === "belakang" ? -dalam / 2 : dinding === "depan" ? dalam / 2 : dinding === "kiri" ? -lebar / 2 : lebar / 2;

/**
 * Isometrik ruangan dengan tata letak tetap (bukan hasil baca foto): lantai, dinding belakang dan kanan, lalu isi yang disusun
 * oleh `susun` (domain murni). Memakai kamera, primitif, dan lapisan gambar yang sama dengan kamar mandi.
 * `fokus` memperbesar ke bagian modifikasi (hijau).
 */
export function PratinjauRuangTetap({
  ruang,
  susun,
  tampilkanUkuran = false,
  fokus = false,
  kelas = "h-72 w-full",
  ukuranAwal = null,
}: {
  ruang: UkuranRuangTetap;
  susun: (konteks: KonteksRuang) => HasilRuang;
  tampilkanUkuran?: boolean;
  fokus?: boolean;
  kelas?: string;
  /** Ukuran kanvas awal (piksel); dipakai untuk render tanpa layar (tes). Bawaan: diukur dari elemen. */
  ukuranAwal?: { lebar: number; tinggi: number } | null;
}) {
  const { lebar: LEBAR, dalam: DALAM, tinggi: TINGGI, tebalDinding: TEBAL } = ruang;
  const pembungkusRef = useRef<HTMLDivElement>(null);
  const [ukuran, setUkuran] = useState<{ lebar: number; tinggi: number } | null>(ukuranAwal);
  useEffect(() => {
    const el = pembungkusRef.current;
    if (!el) return;
    const ukur = () => setUkuran(el.clientWidth > 0 && el.clientHeight > 0 ? { lebar: el.clientWidth, tinggi: el.clientHeight } : null);
    ukur();
    const pengamat = new ResizeObserver(ukur);
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, []);

  let gambar = null;
  if (ukuran) {
    const dasar = bangunProyeksi(AZIMUTH, ukuran.lebar, ukuran.tinggi, FRUSTUM_AWAL);
    const lihat = { x: -1, y: 1 } as const;
    const dm = (x: number, y: number, z: number) => dasar(x / 100, y / 100, z / 100);
    const sudutRuang = [
      dm(-LEBAR / 2, -DALAM / 2, 0),
      dm(LEBAR / 2, -DALAM / 2, 0),
      dm(LEBAR / 2, DALAM / 2, 0),
      dm(-LEBAR / 2, DALAM / 2, 0),
      dm(-LEBAR / 2 - TEBAL, -DALAM / 2 - TEBAL, TINGGI),
      dm(LEBAR / 2 + TEBAL, -DALAM / 2 - TEBAL, TINGGI),
      dm(LEBAR / 2, DALAM / 2, TINGGI),
    ];
    const [xMin, xMax] = [Math.min(...sudutRuang.map((t) => t[0])), Math.max(...sudutRuang.map((t) => t[0]))];
    const [yMin, yMax] = [Math.min(...sudutRuang.map((t) => t[1])), Math.max(...sudutRuang.map((t) => t[1]))];
    const pembesaran = Math.min((ukuran.lebar * (1 - 2 * MARGIN)) / (xMax - xMin), (ukuran.tinggi * (1 - 2 * MARGIN)) / (yMax - yMin));
    const proyeksi = (x: number, y: number, z: number): Titik => {
      const [px, py] = dm(x, y, z);
      return [(px - (xMin + xMax) / 2) * pembesaran + ukuran.lebar / 2, (py - (yMin + yMax) / 2) * pembesaran + ukuran.tinggi / 2];
    };
    const kerangka = (dinding: Dinding): Kerangka => ({
      dinding,
      sepanjang: 0,
      bidang: bidangDalam(dinding, LEBAR, DALAM),
      proyeksi,
      skala: 1,
      lihat,
    });

    const kB = kerangka("belakang");
    const kK = kerangka("kanan");
    const lantai = poligon(
      "lantai",
      [
        proyeksi(-LEBAR / 2, -DALAM / 2, 0),
        proyeksi(LEBAR / 2, -DALAM / 2, 0),
        proyeksi(LEBAR / 2, DALAM / 2, 0),
        proyeksi(-LEBAR / 2, DALAM / 2, 0),
      ],
      "ruang",
    );
    const ubinLantai = garisUbinLantai(kB, -LEBAR / 2, LEBAR / 2, 0, DALAM, -LEBAR / 2, 0);
    const mukaDalam = (k: Kerangka, a0: number, a1: number, muka: "latar" | "kanan"): Primitif =>
      poligon(muka, [titik(k, a0, 0, 0), titik(k, a1, 0, 0), titik(k, a1, 0, TINGGI), titik(k, a0, 0, TINGGI)], "ruang");
    const dinding: Primitif[] = [
      ...kotak(kB, -LEBAR / 2 - TEBAL, LEBAR / 2 + TEBAL, -TEBAL, 0, 0, TINGGI, "ruang"),
      mukaDalam(kB, -LEBAR / 2 - TEBAL, LEBAR / 2 + TEBAL, "latar"),
      ...garisUbin(kB, -LEBAR / 2, LEBAR / 2, TINGGI, -LEBAR / 2),
      ...kotak(kK, -DALAM / 2, DALAM / 2, -TEBAL, 0, 0, TINGGI, "ruang"),
      mukaDalam(kK, -DALAM / 2, DALAM / 2, "kanan"),
      ...garisUbin(kK, -DALAM / 2, DALAM / 2, TINGGI, -DALAM / 2),
    ];

    const { lapisan, anotasi } = susun({ kerangka, proyeksi, tampilkanUkuran });
    const susunan = [...lapisan].sort((a, b) => a.kedalaman - b.kedalaman);

    let tampak = { x: 0, y: 0, w: ukuran.lebar, h: ukuran.tinggi };
    const aksen = lapisan.filter((l) => l.aksen && l.kedalaman > -1e8);
    if (fokus && aksen.length > 0) {
      const titikFokus = [...aksen.flatMap((l) => l.daftar), ...anotasi].flatMap(titikPrimitif);
      const xs = titikFokus.map((t) => t[0]);
      const ys = titikFokus.map((t) => t[1]);
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      const sisa = Math.max(120, 0.45 * Math.max(x1 - x0, y1 - y0));
      let [w, h] = [x1 - x0 + 2 * sisa, y1 - y0 + 2 * sisa];
      const rasio = ukuran.lebar / ukuran.tinggi;
      if (w / h < rasio) w = h * rasio;
      else h = w / rasio;
      if (w < ukuran.lebar && h < ukuran.tinggi) {
        const geser = (nilai: number, panjang: number, batas: number) => Math.min(Math.max(nilai, 0), batas - panjang);
        tampak = { x: geser((x0 + x1) / 2 - w / 2, w, ukuran.lebar), y: geser((y0 + y1) / 2 - h / 2, h, ukuran.tinggi), w, h };
      }
    }

    gambar = (
      <svg
        viewBox={`${tampak.x} ${tampak.y} ${tampak.w} ${tampak.h}`}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <g strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round">
          <LapisPrimitif daftar={[lantai, ...ubinLantai, ...dinding]} garisDasar={1.6} />
          {susunan.map((l) => (
            <g key={l.id}>
              <LapisPrimitif daftar={l.daftar} tebal={0.75} garisDasar={1.6} skalaTeks={tampak.w / ukuran.lebar} />
            </g>
          ))}
          <LapisPrimitif daftar={anotasi} tebal={0.75} garisDasar={1.6} skalaTeks={tampak.w / ukuran.lebar} />
        </g>
      </svg>
    );
  }

  return (
    <div ref={pembungkusRef} className={`relative mx-auto ${kelas}`}>
      {gambar}
    </div>
  );
}
