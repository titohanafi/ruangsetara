import type { Peran, Primitif, Titik } from "../domain/gambarShower";

type Bidang = "atas" | "kanan" | "kiri" | "latar" | "lantai" | "zona" | "pita" | "rongga";
const ISI: Record<Peran, Record<Bidang, string>> = {
  netral: {
    atas: "fill-benda-atas",
    kanan: "fill-benda-kanan",
    kiri: "fill-benda-kiri",
    latar: "fill-white",
    lantai: "fill-lantai",
    zona: "fill-utama/10",
    pita: "fill-benda-kiri",
    rongga: "fill-benda-kiri",
  },
  aksen: {
    atas: "fill-utama-muda",
    kanan: "fill-utama-redup",
    kiri: "fill-utama/40",
    latar: "fill-white",
    lantai: "fill-lantai",
    zona: "fill-utama/10",
    pita: "fill-utama/40",
    rongga: "fill-utama/40",
  },
  hantu: {
    atas: "fill-none",
    kanan: "fill-none",
    kiri: "fill-none",
    latar: "fill-none",
    lantai: "fill-none",
    zona: "fill-none",
    pita: "fill-none",
    rongga: "fill-none",
  },
  ruang: {
    atas: "fill-white",
    kanan: "fill-dinding",
    kiri: "fill-dinding-tebal",
    latar: "fill-dinding-belakang",
    lantai: "fill-lantai",
    zona: "fill-utama/10",
    pita: "fill-dinding-tebal",
    rongga: "fill-dinding-tebal",
  },
};
const GARIS: Record<Peran, string> = { netral: "stroke-tinta", aksen: "stroke-utama", hantu: "stroke-garisKontrol", ruang: "stroke-tinta" };
const ISI_BADAN: Record<Peran, Record<"kanan" | "kiri", string>> = {
  netral: { kanan: "fill-benda-kanan", kiri: "fill-benda-kiri" },
  ruang: { kanan: "fill-dinding", kiri: "fill-dinding-tebal" },
  aksen: { kanan: "fill-utama-redup", kiri: "fill-utama/40" },
  hantu: { kanan: "fill-none", kiri: "fill-none" },
};
const ISI_ATAS: Record<Peran, string> = { netral: "fill-benda-atas", ruang: "fill-white", aksen: "fill-utama-muda", hantu: "fill-none" };
const ISI_RONGGA: Record<Peran, string> = { netral: "fill-benda-kiri", ruang: "fill-garis", aksen: "fill-utama/40", hantu: "fill-none" };
const ISI_LUBANG: Record<Peran, string> = { netral: "fill-tinta", ruang: "fill-tinta", aksen: "fill-utama", hantu: "fill-none" };
const LUBANG: readonly (readonly [number, number])[] = [
  [0, 0],
  [8, 0],
  [-8, 0],
  [0, 8],
  [0, -8],
  [5.7, 5.7],
  [-5.7, 5.7],
  [5.7, -5.7],
  [-5.7, -5.7],
];

const kePoin = (pts: readonly Titik[]) => pts.map(([x, y]) => `${x},${y}`).join(" ");

/** Bezier berantai: titik ke-0 awal, lalu tiap tiga titik berikutnya satu segmen; dua titik = garis lurus. */
function kePath(pts: readonly Titik[]): string {
  if (pts.length === 2) return `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i + 2 < pts.length; i += 3)
    d += ` C${pts[i][0]},${pts[i][1]} ${pts[i + 1][0]},${pts[i + 1][1]} ${pts[i + 2][0]},${pts[i + 2][1]}`;
  return d;
}

function Bentuk({ s, penanda, m, w }: { s: Primitif; penanda: string; m: number; w: number }) {
  switch (s.jenis) {
    case "poligon": {
      if (s.muka === "zona") {
        return <polygon points={kePoin(s.titik)} className="fill-utama/10 stroke-utama" strokeWidth={2.4 * m} strokeDasharray="9 6" />;
      }
      if (s.tepi) return <polygon points={kePoin(s.titik)} className="fill-tinta stroke-tinta" strokeWidth={2 * w} />;
      const hantu = s.peran === "hantu";
      return (
        <polygon
          points={kePoin(s.titik)}
          className={`${ISI[s.peran][s.muka]} ${s.muka === "pita" || s.tanpaGaris ? "stroke-none" : GARIS[s.peran]}`}
          strokeDasharray={hantu ? "5 4" : undefined}
          strokeWidth={hantu ? 1.8 * m : s.garisTipis ? 0.45 * w : undefined}
        />
      );
    }
    case "garisPoli":
      return (
        <polyline
          points={kePoin(s.titik)}
          className={`fill-none ${GARIS[s.peran]}`}
          strokeDasharray={s.putus || s.peran === "hantu" ? "5 4" : undefined}
          strokeWidth={s.peran === "hantu" ? 1.8 * m : undefined}
        />
      );
    case "elips": {
      const lebar = s.tingkat === "tutup" ? 1.2 * m : s.tingkat === "rongga" ? 1.4 * m : undefined;
      const kelas = s.tingkat === "atas" ? ISI_ATAS[s.peran] : s.tingkat === "rongga" ? ISI_RONGGA[s.peran] : "fill-none";
      return <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} className={`${kelas} ${GARIS[s.peran]}`} strokeWidth={lebar} />;
    }
    case "badan":
      return (
        <path
          d={`M${s.cx - s.rx},${s.yAtas} L${s.cx - s.rx},${s.yBawah} A${s.rx} ${s.ry} 0 0 0 ${s.cx + s.rx},${s.yBawah} L${s.cx + s.rx},${s.yAtas} Z`}
          className={`${ISI_BADAN[s.peran][s.muka]} ${GARIS[s.peran]}`}
        />
      );
    case "cakram": {
      const muka = s.tingkat !== "belakang";
      const lubang = s.tingkat === "depan";
      return (
        <g transform={`matrix(${s.sumbuA[0]} ${s.sumbuA[1]} ${s.sumbuU[0]} ${s.sumbuU[1]} ${s.cx} ${s.cy})`} className={GARIS[s.peran]}>
          <circle r={s.r} className={muka ? ISI_ATAS[s.peran] : ISI.netral.pita} vectorEffect="non-scaling-stroke" />
          {lubang && (
            <>
              <circle r={s.r * 0.68} className="fill-none" strokeWidth={1.2 * m} vectorEffect="non-scaling-stroke" />
              <g className={ISI_LUBANG[s.peran]} stroke="none">
                {LUBANG.map(([x, y]) => (
                  <circle key={`${x}${y}`} cx={x * (s.r / 22)} cy={y * (s.r / 22)} r={1.6 * (s.r / 22)} />
                ))}
              </g>
            </>
          )}
        </g>
      );
    }
    case "garis": {
      const [x1, y1] = s.dari;
      const [x2, y2] = s.ke;
      if (s.gaya === "air")
        return <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-garisKontrol" strokeWidth={2 * m} strokeDasharray="4 5" />;
      if (s.gaya === "ubin")
        return <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-garisKontrol" strokeOpacity={0.13} strokeWidth={0.45 * w} />;
      if (s.gaya === "ubinLantai")
        return <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-garisKontrol" strokeOpacity={0.3} strokeWidth={0.45 * w} />;
      if (s.gaya === "silang") return <line x1={x1} y1={y1} x2={x2} y2={y2} className={GARIS[s.peran]} strokeWidth={5 * m} />;
      if (s.gaya === "panah") {
        return (
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className={GARIS[s.peran]}
            strokeWidth={3.5 * m}
            strokeDasharray="7 5"
            markerEnd={`url(#${penanda})`}
          />
        );
      }
      return <line x1={x1} y1={y1} x2={x2} y2={y2} className={GARIS[s.peran]} strokeDasharray={s.gaya === "putus" ? "6 5" : undefined} />;
    }
    case "jalur": {
      const d = kePath(s.titik);
      if (s.gaya === "lengkung") return <path d={d} className={`fill-none ${GARIS[s.peran]}`} strokeWidth={1.8 * m} />;
      const dalam = s.gaya === "selang" ? "stroke-white" : "stroke-luar";
      return (
        <>
          <path d={d} className="fill-none stroke-tinta" strokeWidth={(s.gaya === "selang" ? 8.5 : 7) * m} />
          <path d={d} className={`fill-none ${dalam}`} strokeWidth={(s.gaya === "selang" ? 4.5 : 3) * m} />
        </>
      );
    }
    case "baut":
      return <circle cx={s.cx} cy={s.cy} r={1.8 * m} className={`${ISI_LUBANG[s.peran]} stroke-none`} />;
    case "tanda":
      return (
        <text x={s.x} y={s.y} textAnchor="middle" fontSize={30} fontWeight={800} className="fill-redup stroke-none">
          {s.teks}
        </text>
      );
  }
}

/** Daftar bentuk gambar shower di dalam <svg> yang sudah ada (denah isometrik), dengan tebal garis dikalikan `tebal`. */
export function LapisPrimitif({
  daftar,
  penanda = "",
  tebal = 1,
  garisDasar = 2.2,
}: {
  daftar: Primitif[];
  penanda?: string;
  tebal?: number;
  /** Tebal garis dasar pada <g> pembungkus; dipakai untuk menurunkan tebal garis tepi dan garis tipis. */
  garisDasar?: number;
}) {
  return (
    <>
      {daftar.map((s, i) => (
        <Bentuk key={i} s={s} penanda={penanda} m={tebal} w={garisDasar} />
      ))}
    </>
  );
}
