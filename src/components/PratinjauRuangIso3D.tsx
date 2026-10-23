import { useEffect, useRef, useState } from "react";
import { titikDinding } from "../domain/denahGeometri";
import { DIM } from "../domain/dimensiGambar";
import { bukaanDinding, gambarBenda, titikPrimitif, type JenisBenda } from "../domain/gambarBenda";
import { gambarModifikasi, type BagianModifikasi, type KonteksModifikasi } from "../domain/gambarModifikasi";
import {
  garisUbin,
  garisUbinLantai,
  gambarShower,
  keRuang,
  kotak,
  poligon,
  titik,
  type Dinding,
  type ModeGambar,
  type Kerangka,
  type Primitif,
  type Titik,
} from "../domain/gambarShower";
import { posisiSepanjang } from "../domain/tataLetak";
import {
  OBJEK_DENAH,
  type JenisKloset,
  type LetakDenah,
  type ObjekDenah,
  type VarianPintu,
  type VarianShower,
} from "../domain/denahPindai";
import { bangunProyeksi } from "../lib/proyeksiIso3D";
import { LapisPrimitif } from "./LapisPrimitif";

const JENIS_KLOSET_GAMBAR: Record<JenisKloset, JenisBenda> = {
  duduk: "kloset_duduk",
  jongkok: "kloset_jongkok",
  tidak_jelas: "kloset_tidak_jelas",
};
const VARIAN_PINTU_GAMBAR: Record<VarianPintu, JenisBenda> = {
  ayun_ke_dalam: "pintu",
  ayun_ke_luar: "pintu_ayun_luar",
  geser: "pintu_geser",
  tidak_jelas: "pintu_tanpa_daun",
};

// Seluruh gambar dalam cm nyata (1 satuan = 1 cm, sama dengan panel): ruangan seluas ruang dalam toilet PerMen
// (`DIM.ruang`), benda memakai dimensi dari `DIM`. Kamera bekerja dalam meter, jadi koordinat dibagi 100.
const LEBAR = DIM.ruang.lebar;
const DALAM = DIM.ruang.dalam;
const TINGGI = DIM.ruang.tinggi;
const TEBAL = DIM.ruang.tebalDinding;
// Setengah-tinggi pandangan awal kamera (meter); gambar lalu dipas-kan ke kanvas, jadi nilainya tidak menentukan ukuran.
const FRUSTUM_AWAL = 2.2;
// Margin gambar terhadap tepi kanvas (pecahan lebar/tinggi).
const MARGIN = 0.03;

/**
 * Benda yang tidak digambar karena dinding tempatnya menempel tidak digambar (dinding samping berlawanan dan dinding
 * depan): dari luar mereka tampak dari belakang dan melayang. Berlaku sama untuk semua benda, termasuk pintu.
 */
export function bendaTersembunyi(
  letak: (id: ObjekDenah) => LetakDenah,
  sisiSamping: "kiri" | "kanan",
  tidakTerlihat: readonly ObjekDenah[] = [],
): ObjekDenah[] {
  return OBJEK_DENAH.filter((id) => {
    if (tidakTerlihat.includes(id)) return false;
    const dinding = titikDinding(letak(id)).dinding;
    return dinding !== "belakang" && dinding !== sisiSamping;
  });
}

/** Azimuth kamera (radian) supaya dinding samping yang digambar SELALU di sisi jauh dari kamera (tidak menghalangi
 *  benda): kamera di (+X,+Z) (45°) membuat sisi kiri+belakang jauh; kamera di (-X,+Z) (135°) membuat kanan+belakang jauh. */
function azimuthDariSudut(sisiSamping: "kiri" | "kanan"): number {
  return sisiSamping === "kanan" ? (3 * Math.PI) / 4 : Math.PI / 4;
}

/** Permukaan dalam dinding (cm dari pusat ruangan): ruang dalam persis seluas `DIM.ruang`, dinding di luarnya. */
function bidangDalam(dinding: Dinding): number {
  switch (dinding) {
    case "belakang":
      return -DALAM / 2;
    case "depan":
      return DALAM / 2;
    case "kiri":
      return -LEBAR / 2;
    case "kanan":
      return LEBAR / 2;
  }
}

/**
 * Tampilan isometrik tingkat-ruangan (prototipe di belakang flag `VITE_ISO_3D`), seluruhnya gambar SVG bergaya manual
 * perakitan dalam cm nyata: lantai dan dinding berkeramik (belakang selalu, satu dinding samping sesuai `sudutAktif.x`),
 * lalu keempat benda (pintu, kloset, wastafel, shower) diposisikan sesuai `letak(id)` yang sama dengan denah tampak atas.
 * Kamera ortografik isometrik sungguhan berputar mengelilingi ruangan (`bangunProyeksi`), jadi sudut pandang tetap
 * benar; tidak ada Three.js, kanvas WebGL, atau model 3D yang dimuat (ringan untuk kuota rendah).
 */
export function PratinjauRuangIso3D({
  letak,
  sudutAktif,
  varianShower = "tidak_jelas",
  modeShower = "kondisi",
  modifikasi = [],
  tampilkanUkuran = false,
  fokus = false,
  jenisKloset = "tidak_jelas",
  varianPintu = "tidak_jelas",
  tampilkanSemua = false,
  tidakTerlihat = [],
  kelas = "h-96 w-full",
}: {
  letak: (id: ObjekDenah) => LetakDenah;
  sudutAktif: { x: "kiri" | "kanan" };
  varianShower?: VarianShower;
  /** Keadaan shower yang digambar: kondisi sekarang, penyesuaian praktis (hack), atau modifikasi permanen. */
  modeShower?: ModeGambar;
  /** Pertanyaan yang gambar modifikasinya ditampilkan (hijau). Kosong = kondisi sekarang. M-04 mengganti kloset dengan kloset duduk. */
  modifikasi?: readonly string[];
  /** Tulis ukuran dan nama pada gambar modifikasi (gambar per pertanyaan). */
  tampilkanUkuran?: boolean;
  /** Perbesar ke bagian yang dimodifikasi (dan benda yang diganti), supaya terbaca di gambar kecil. */
  fokus?: boolean;
  /** Jenis kloset dan cara pintu membuka (hasil pindai); "tidak_jelas" menggambar penanda netral. */
  jenisKloset?: JenisKloset;
  varianPintu?: VarianPintu;
  /** Tampilkan juga benda yang biasanya disembunyikan (di dinding yang tidak digambar). */
  tampilkanSemua?: boolean;
  /** Benda yang tidak terlihat di foto (posisinya tidak diketahui): tidak digambar sama sekali, juga bukan lewat tombol mata. */
  tidakTerlihat?: readonly ObjekDenah[];
  kelas?: string;
}) {
  const pembungkusRef = useRef<HTMLDivElement>(null);
  const [ukuran, setUkuran] = useState<{ lebar: number; tinggi: number } | null>(null);
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
    const dasar = bangunProyeksi(azimuthDariSudut(sudutAktif.x), ukuran.lebar, ukuran.tinggi, FRUSTUM_AWAL);
    const lihat = { x: sudutAktif.x === "kanan" ? -1 : 1, y: 1 } as const;

    // Pas-kan ruangan (lantai dan puncak dinding yang digambar) ke kanvas: diperbesar sebesar mungkin dan dipusatkan,
    // berapa pun bentuk kartunya.
    const sisiX = sudutAktif.x === "kanan" ? LEBAR / 2 : -LEBAR / 2;
    const dm = (x: number, y: number, z: number) => dasar(x / 100, y / 100, z / 100);
    const sudutRuang = [
      dm(-LEBAR / 2, -DALAM / 2, 0),
      dm(LEBAR / 2, -DALAM / 2, 0),
      dm(LEBAR / 2, DALAM / 2, 0),
      dm(-LEBAR / 2, DALAM / 2, 0),
      dm(-LEBAR / 2 - TEBAL, -DALAM / 2 - TEBAL, TINGGI),
      dm(LEBAR / 2 + TEBAL, -DALAM / 2 - TEBAL, TINGGI),
      dm(sisiX, DALAM / 2, TINGGI),
    ];
    const [xMin, xMax] = [Math.min(...sudutRuang.map((t) => t[0])), Math.max(...sudutRuang.map((t) => t[0]))];
    const [yMin, yMax] = [Math.min(...sudutRuang.map((t) => t[1])), Math.max(...sudutRuang.map((t) => t[1]))];
    const pembesaran = Math.min((ukuran.lebar * (1 - 2 * MARGIN)) / (xMax - xMin), (ukuran.tinggi * (1 - 2 * MARGIN)) / (yMax - yMin));
    const proyeksi = (x: number, y: number, z: number): Titik => {
      const [px, py] = dm(x, y, z);
      return [(px - (xMin + xMax) / 2) * pembesaran + ukuran.lebar / 2, (py - (yMin + yMax) / 2) * pembesaran + ukuran.tinggi / 2];
    };

    const kerangkaDinding = (dinding: Dinding): Kerangka => ({
      dinding,
      sepanjang: 0,
      bidang: bidangDalam(dinding),
      proyeksi,
      skala: 1,
      lihat,
    });

    // Lantai hanya seluas ruang dalam (PerMen); dinding berdiri di luarnya dan tidak ikut tercakup lantai. Lantai paling
    // gelap dan berkotak 30 cm (sama dengan dinding) sebagai penggaris; kotak dimulai dari sudut pojok belakang-kiri.
    const kBelakang = kerangkaDinding("belakang");
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
    const ubinLantai = garisUbinLantai(kBelakang, -LEBAR / 2, LEBAR / 2, 0, DALAM, -LEBAR / 2, 0);
    // Dinding setebal TEBAL di luar ruang dalam. Dinding belakang melebar sampai menutupi ujung dinding samping; dinding
    // samping dimulai dari permukaan dalam dinding belakang. Garis keramik dimulai dari sudut pojok belakang.
    const kSamping = kerangkaDinding(sudutAktif.x);
    // Permukaan dalam dinding dibuat terang supaya garis keramik terlihat: dinding belakang (wastafel dan kloset) putih,
    // dinding samping (shower) sedikit lebih gelap untuk memberi kesan kedalaman, dan lantai paling gelap. Sisi tebal dan
    // puncak dinding tetap bernada abu.
    const mukaDalam = (k: Kerangka, a0: number, a1: number, muka: "latar" | "kanan"): Primitif =>
      poligon(muka, [titik(k, a0, 0, 0), titik(k, a1, 0, 0), titik(k, a1, 0, TINGGI), titik(k, a0, 0, TINGGI)], "ruang");
    const dinding: Primitif[] = [
      ...kotak(kBelakang, -LEBAR / 2 - TEBAL, LEBAR / 2 + TEBAL, -TEBAL, 0, 0, TINGGI, "ruang"),
      mukaDalam(kBelakang, -LEBAR / 2 - TEBAL, LEBAR / 2 + TEBAL, "latar"),
      ...garisUbin(kBelakang, -LEBAR / 2, LEBAR / 2, TINGGI, -LEBAR / 2),
      ...kotak(kSamping, -DALAM / 2, DALAM / 2, -TEBAL, 0, 0, TINGGI, "ruang"),
      mukaDalam(kSamping, -DALAM / 2, DALAM / 2, "kanan"),
      ...garisUbin(kSamping, -DALAM / 2, DALAM / 2, TINGGI, -DALAM / 2),
    ];

    const jenisBenda = (id: Exclude<ObjekDenah, "area_mandi">): JenisBenda =>
      id === "kloset" ? JENIS_KLOSET_GAMBAR[jenisKloset] : id === "pintu" ? VARIAN_PINTU_GAMBAR[varianPintu] : "wastafel";
    const terlihat = OBJEK_DENAH.filter((id) => !tidakTerlihat.includes(id));
    const tersembunyi = tampilkanSemua ? [] : bendaTersembunyi(letak, sudutAktif.x, tidakTerlihat);
    const posisi = posisiSepanjang(letak, terlihat);
    // Bukaan pintu pada dinding yang digambar: lubang di atas dinding berkeramik supaya pintu menembus dinding. Pada dinding
    // yang tidak digambar (mis. dinding depan, sisi kamera) tidak ada dinding untuk dilubangi.
    const dindingPintu = titikDinding(letak("pintu")).dinding;
    const bukaan: Primitif[] =
      terlihat.includes("pintu") && !tersembunyi.includes("pintu") && (dindingPintu === "belakang" || dindingPintu === sudutAktif.x)
        ? [bukaanDinding({ ...kerangkaDinding(dindingPintu), sepanjang: posisi.pintu })]
        : [];
    const susunBenda = terlihat
      .map((id) => {
        const letakId = letak(id);
        const kerangka: Kerangka = { ...kerangkaDinding(titikDinding(letakId).dinding), sepanjang: posisi[id] };
        // Benda yang disembunyikan tidak digambar sama sekali (termasuk pintu, tanpa garis bukaan).
        if (tersembunyi.includes(id)) return null;
        const daftar: Primitif[] =
          id === "area_mandi"
            ? gambarShower(varianShower, modeShower, { kerangka })
            : id === "kloset" && modifikasi.includes("M-04")
              ? gambarBenda("kloset_duduk", kerangka, "aksen") // M-04: kloset diganti kloset duduk (hijau)
              : id === "pintu" && (modifikasi.includes("M-01") || modifikasi.includes("M-12"))
                ? gambarBenda("pintu_ayun_luar", kerangka, "aksen") // M-01, M-12: pintu lebar membuka ke luar (hijau)
                : id === "wastafel" && modifikasi.includes("M-06")
                  ? gambarBenda("wastafel", kerangka, "aksen") // M-06: wastafel gantung, keran tuas (hijau)
                  : gambarBenda(jenisBenda(id), kerangka);
        // Urutan gambar dari belakang ke depan: titik pijak benda yang lebih rendah di layar berarti lebih dekat kamera.
        const [x, y] = keRuang(kerangka, 0, 0);
        return { id, daftar, kedalaman: proyeksi(x, y, 0)[1] };
      })
      .filter((b) => b !== null);

    // Gambar modifikasi: bagian di lantai digambar lebih dulu; bagian di dinding ikut diurutkan bersama benda. Yang dipasang
    // pada benda yang disembunyikan atau tidak terlihat di foto tidak digambar.
    const ctx: KonteksModifikasi = {
      kerangka: kerangkaDinding,
      proyeksi,
      letak,
      posisi,
      dindingTergambar: ["belakang", sudutAktif.x],
      tampilkanUkuran,
    };
    const bagian: BagianModifikasi[] = modifikasi.flatMap((id) => gambarModifikasi(id, ctx));
    const susunMod = bagian
      .filter((b) => b.objek === null || (!tersembunyi.includes(b.objek) && !tidakTerlihat.includes(b.objek)))
      .map((b, i) => ({
        id: `mod-${i}`,
        // Garis ukur dan teks digambar terpisah di lapisan paling atas (lihat `anotasi`), jadi tidak tertutup benda lain.
        daftar: b.daftar.filter((p) => p.jenis !== "ukur" && p.jenis !== "label"),
        // Lantai: isian lebih dulu, garis putus-putus di atasnya supaya tidak tertutup isian zona lain.
        kedalaman:
          b.pijak === "lantai"
            ? -1e9 + (b.daftar.some((p) => p.jenis === "poligon") ? 0 : 1000) + i
            : proyeksi(b.pijak[0], b.pijak[1], 0)[1],
      }));
    const susunan = [...susunBenda, ...susunMod].sort((a, b) => a.kedalaman - b.kedalaman);
    const anotasi = bagian
      .filter((b) => b.objek === null || (!tersembunyi.includes(b.objek) && !tidakTerlihat.includes(b.objek)))
      .flatMap((b) => b.daftar.filter((p) => p.jenis === "ukur" || p.jenis === "label"));

    // Fokus: kotak pembatas (piksel kanvas) dari bagian modifikasi dan benda yang diganti, diberi ruang, dengan rasio kanvas.
    let tampak = { x: 0, y: 0, w: ukuran.lebar, h: ukuran.tinggi };
    if (fokus && susunMod.length > 0) {
      const diganti = [
        modifikasi.includes("M-04") ? "kloset" : null,
        modifikasi.includes("M-01") || modifikasi.includes("M-12") ? "pintu" : null,
        modifikasi.includes("M-06") ? "wastafel" : null,
        modifikasi.includes("M-07") ? "area_mandi" : null,
      ];
      // Cakram (kepala shower) dihitung dari ukuran sebenarnya di layar; titikPrimitif memakai perkiraan untuk panel yang jauh lebih besar.
      const titikBentuk = (p: Primitif): Titik[] =>
        p.jenis === "cakram"
          ? (() => {
              const jari = p.r * Math.max(Math.hypot(...p.sumbuA), Math.hypot(...p.sumbuU));
              return [
                [p.cx - jari, p.cy - jari],
                [p.cx + jari, p.cy + jari],
              ];
            })()
          : titikPrimitif(p);
      const titikFokus = [
        ...susunMod.flatMap((b) => b.daftar),
        ...anotasi,
        ...susunBenda.filter((b) => diganti.includes(b.id)).flatMap((b) => b.daftar),
      ].flatMap(titikBentuk);
      if (titikFokus.length > 0) {
        const xs = titikFokus.map((t) => t[0]);
        const ys = titikFokus.map((t) => t[1]);
        const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        const sisa = Math.max(60, 0.45 * Math.max(x1 - x0, y1 - y0));
        let [w, h] = [x1 - x0 + 2 * sisa, y1 - y0 + 2 * sisa];
        const rasio = ukuran.lebar / ukuran.tinggi;
        if (w / h < rasio) w = h * rasio;
        else h = w / rasio;
        // Bagian yang lebar (lantai, ruang putar) tidak perlu diperbesar: pakai kanvas penuh.
        if (w < ukuran.lebar && h < ukuran.tinggi) tampak = { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h };
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
          <LapisPrimitif daftar={[lantai, ...ubinLantai, ...dinding, ...bukaan]} garisDasar={1.6} />
          {susunan.map((b) => (
            <g key={b.id}>
              <LapisPrimitif daftar={b.daftar} tebal={0.75} garisDasar={1.6} skalaTeks={tampak.w / ukuran.lebar} />
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
