import { H, PAD, titikDinding, W } from "../domain/denahGeometri";
import { OBJEK_DENAH, type LetakDenah, type ObjekDenah } from "../domain/denahPindai";
import { UKURAN_AREA_MANDI, UKURAN_KLOSET, UKURAN_PINTU, UKURAN_WASTAFEL } from "../domain/objekUkuran";
import { titikTertata } from "../domain/tataLetak";

// Denah tampak atas: arah benda menempel dinding, bukan ukuran. Bentuk benda disalin dari DenahKamarMandi Transisi,
// tanpa lencana nomor dan status (di sini tidak ada status per benda).

type Titik = { x: number; y: number };
const GARIS = "text-garisKontrol";

function Pintu({ letak, t }: { letak: LetakDenah; t: Titik }) {
  const { dinding } = titikDinding(letak);
  const { panjang } = UKURAN_PINTU;
  if (dinding === "kiri" || dinding === "kanan") {
    const sisi = dinding === "kiri" ? -1 : 1;
    const xd = dinding === "kiri" ? PAD : W - PAD;
    const xb = xd - sisi * panjang * 0.8;
    return (
      <g className={GARIS} stroke="currentColor" fill="none" strokeWidth={2}>
        <line x1={xd} y1={t.y - panjang / 2} x2={xd} y2={t.y + panjang / 2} stroke="white" strokeWidth={3} />
        <line x1={xd} y1={t.y - panjang / 2} x2={xb} y2={t.y} />
        <path
          d={`M ${xd} ${t.y + panjang / 2} A ${panjang} ${panjang} 0 0 ${dinding === "kiri" ? 1 : 0} ${xb} ${t.y}`}
          strokeDasharray="4 4"
          opacity={0.6}
        />
      </g>
    );
  }
  const sisi = dinding === "belakang" ? -1 : 1;
  const yd = dinding === "belakang" ? PAD : H - PAD;
  const yb = yd - sisi * panjang * 0.8;
  return (
    <g className={GARIS} stroke="currentColor" fill="none" strokeWidth={2}>
      <line x1={t.x - panjang / 2} y1={yd} x2={t.x + panjang / 2} y2={yd} stroke="white" strokeWidth={3} />
      <line x1={t.x - panjang / 2} y1={yd} x2={t.x} y2={yb} />
      <path
        d={`M ${t.x + panjang / 2} ${yd} A ${panjang} ${panjang} 0 0 ${dinding === "belakang" ? 0 : 1} ${t.x} ${yb}`}
        strokeDasharray="4 4"
        opacity={0.6}
      />
    </g>
  );
}

function Kloset({ letak, t }: { letak: LetakDenah; t: Titik }) {
  const { dinding } = titikDinding(letak);
  const { w, h } = UKURAN_KLOSET.tangki;
  const { rx, ry } = UKURAN_KLOSET.mangkuk;
  const tangki =
    dinding === "kiri"
      ? { x: t.x - 32, y: t.y - h / 2, w, h }
      : dinding === "kanan"
        ? { x: t.x + 12, y: t.y - h / 2, w, h }
        : dinding === "depan"
          ? { x: t.x - h / 2, y: t.y + 12, w: h, h: w }
          : { x: t.x - h / 2, y: t.y - 32, w: h, h: w };
  return (
    <g className={GARIS} stroke="currentColor" fill="white" strokeWidth={1.5}>
      <rect x={tangki.x} y={tangki.y} width={tangki.w} height={tangki.h} rx={2} />
      <ellipse cx={t.x} cy={t.y} rx={rx} ry={ry} />
    </g>
  );
}

function Wastafel({ letak, t }: { letak: LetakDenah; t: Titik }) {
  const { dinding } = titikDinding(letak);
  const { w, h } = UKURAN_WASTAFEL.kotak;
  const k =
    dinding === "kiri"
      ? { x: t.x - 33, y: t.y - h / 2, w, h }
      : dinding === "kanan"
        ? { x: t.x - 3, y: t.y - h / 2, w, h }
        : dinding === "depan"
          ? { x: t.x - h / 2, y: t.y - 3, w: h, h: w }
          : { x: t.x - h / 2, y: t.y - 33, w: h, h: w };
  return (
    <g className={GARIS} stroke="currentColor" fill="white" strokeWidth={1.5}>
      <rect x={k.x} y={k.y} width={k.w} height={k.h} rx={4} />
      <rect x={t.x - 1.5} y={t.y - 4} width={3} height={6} rx={1.5} strokeWidth={1} />
      <circle cx={t.x} cy={t.y + 3} r={1.5} strokeWidth={1} />
    </g>
  );
}

/** Zona shower memanjang sepanjang dinding: diarsir, dengan kepala shower dan pipanya. */
function AreaMandi({ letak, t }: { letak: LetakDenah; t: Titik }) {
  const { dinding } = titikDinding(letak);
  const { panjangZona, tebalZona, jariShower, panjangPipa, jarakPojokBelakang, jarakPojokDepan } = UKURAN_AREA_MANDI;
  const sisi = dinding === "kiri" || dinding === "kanan";
  const yZona = Math.max(PAD + jarakPojokBelakang, Math.min(H - PAD - jarakPojokDepan - panjangZona, t.y - panjangZona / 2));
  const xZona = Math.max(PAD, Math.min(W - PAD - panjangZona, t.x - panjangZona / 2));
  const zona =
    dinding === "kiri"
      ? { x: PAD, y: yZona, w: tebalZona, h: panjangZona }
      : dinding === "kanan"
        ? { x: W - PAD - tebalZona, y: yZona, w: tebalZona, h: panjangZona }
        : dinding === "depan"
          ? { x: xZona, y: H - PAD - tebalZona, w: panjangZona, h: tebalZona }
          : { x: xZona, y: PAD, w: panjangZona, h: tebalZona };
  const tengah = { x: zona.x + zona.w / 2, y: zona.y + zona.h / 2 };
  const dindingSisi = dinding === "kiri" ? zona.x : dinding === "kanan" ? zona.x + zona.w : dinding === "depan" ? zona.y + zona.h : zona.y;
  const jarak = jariShower + panjangPipa;
  const arah = dinding === "kiri" || dinding === "belakang" ? 1 : -1;
  const kepala = sisi ? { x: dindingSisi + arah * jarak, y: tengah.y } : { x: tengah.x, y: dindingSisi + arah * jarak };
  const ujung = sisi ? { x: dindingSisi, y: kepala.y } : { x: kepala.x, y: dindingSisi };
  const idArsir = `arsir-${dinding}`;
  return (
    <g>
      <defs>
        <pattern id={idArsir} width={6} height={6} patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1={0} y1={0} x2={0} y2={6} stroke="currentColor" strokeWidth={1} />
        </pattern>
      </defs>
      <g className="text-utama" stroke="currentColor" fill="none" strokeWidth={1.5}>
        <rect x={zona.x} y={zona.y} width={zona.w} height={zona.h} rx={3} />
        <rect x={zona.x} y={zona.y} width={zona.w} height={zona.h} rx={3} fill={`url(#${idArsir})`} opacity={0.5} stroke="none" />
      </g>
      <g className={GARIS} stroke="currentColor" fill="white" strokeWidth={1.5}>
        <line x1={kepala.x} y1={kepala.y} x2={ujung.x} y2={ujung.y} strokeWidth={3} strokeLinecap="round" />
        <circle cx={kepala.x} cy={kepala.y} r={jariShower} />
      </g>
    </g>
  );
}

const NAMA: Record<ObjekDenah, string> = { pintu: "pintu", kloset: "kloset", wastafel: "wastafel", area_mandi: "area mandi" };

export function DenahTampakAtas({
  letak,
  label,
  className = "mx-auto h-auto w-full max-w-xs",
}: {
  letak: (id: ObjekDenah) => LetakDenah;
  label: string;
  className?: string;
}) {
  const titik = titikTertata(letak);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} ${OBJEK_DENAH.map((id) => NAMA[id]).join(", ")}`} className={className}>
      <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} className="fill-lantai stroke-tinta" strokeWidth={3} />
      <AreaMandi letak={letak("area_mandi")} t={titik.area_mandi} />
      <Wastafel letak={letak("wastafel")} t={titik.wastafel} />
      <Kloset letak={letak("kloset")} t={titik.kloset} />
      <Pintu letak={letak("pintu")} t={titik.pintu} />
    </svg>
  );
}
