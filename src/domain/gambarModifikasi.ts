// Gambar "setelah modifikasi" untuk ruang kamar mandi isometrik: tiap fungsi menghasilkan bentuk (primitif) untuk satu
// pertanyaan checklist yang dijawab Tidak, sesuai teks Modifikasi di sheet peneliti. Semuanya berperan "aksen" (hijau)
// supaya terlihat beda dari kondisi sekarang. Ukuran hanya untuk proporsi gambar (dari `dimensiGambar.ts`, yang berasal
// dari tabel ukuran); gambar tidak pernah menampilkan angka.
import { titikDinding } from "./denahGeometri";
import type { LetakDenah, ObjekDenah } from "./denahPindai";
import { DIM } from "./dimensiGambar";
import { footprintOval, kotak, poligon, titik, type Dinding, type Kerangka, type Primitif, type Titik } from "./gambarShower";

/** Pertanyaan yang sudah punya gambar modifikasi, dan benda di ruangan yang harus terlihat agar gambarnya bisa dipasang. */
export const BERGAMBAR: Record<string, ObjekDenah | null> = {
  "M-02": null,
  "M-03": "kloset",
  "M-04": "kloset",
  "M-05": "kloset",
  "M-08": "area_mandi",
  "M-10": "area_mandi",
};

export interface KonteksModifikasi {
  /** Permukaan dalam dinding (sepanjang = 0, skala 1), satuan cm. */
  kerangka: (dinding: Dinding) => Kerangka;
  /** Proyeksi koordinat ruangan (cm: x lebar, y dalam, z tinggi) ke kanvas. */
  proyeksi: (x: number, y: number, z: number) => Titik;
  letak: (id: ObjekDenah) => LetakDenah;
  /** Posisi tengah tiap benda sepanjang dindingnya (cm dari tengah dinding), setelah penataan jarak. */
  posisi: Record<ObjekDenah, number>;
  /** Dinding yang digambar solid pada sudut pandang ini. */
  dindingTergambar: readonly Dinding[];
}

export interface BagianModifikasi {
  daftar: Primitif[];
  /** Benda yang dipasangi; bagian ini ikut disembunyikan bila benda itu disembunyikan. */
  objek: ObjekDenah | null;
  /** Titik pijak (koordinat ruangan, cm) untuk urutan gambar; lantai digambar paling awal. */
  pijak: readonly [number, number] | "lantai";
}

const LEBAR = DIM.ruang.lebar;
const DALAM = DIM.ruang.dalam;
const panjangDinding = (d: Dinding): number => (d === "belakang" || d === "depan" ? LEBAR : DALAM);
const jepit = (v: number, min: number, maks: number): number => Math.min(Math.max(v, min), maks);

/** Dinding samping terdekat dari benda yang menempel di `dinding` pada posisi `sepanjang` (cm dari tengah dinding). */
export function dindingSamping(dinding: Dinding, sepanjang: number): Dinding {
  if (dinding === "belakang" || dinding === "depan") return sepanjang >= 0 ? "kanan" : "kiri";
  return sepanjang >= 0 ? "depan" : "belakang";
}

/** Rentang `a` (pada dinding samping) yang mulai dari bidang dinding tempat benda menempel dan masuk sejauh `panjang`. */
function rentangDariDinding(samping: Dinding, asal: Dinding, panjang: number): [number, number] {
  const minus = asal === "belakang" || asal === "kiri";
  const awal = minus ? -panjangDinding(samping) / 2 : panjangDinding(samping) / 2 - panjang;
  return [awal, awal + panjang];
}

/** Batang pegangan: tabung (kotak tipis) horizontal dengan dua braket ke dinding. */
function batang(k: Kerangka, a0: number, a1: number): Primitif[] {
  const { diameter, tinggiMaks, jarakDinding } = DIM.pegangan;
  const u0 = tinggiMaks - diameter;
  const braket = (a: number) => kotak(k, a - 2, a + 2, 0, jarakDinding, u0, tinggiMaks, "aksen");
  return [...braket(a0 + 6), ...braket(a1 - 6), ...kotak(k, a0, a1, jarakDinding, jarakDinding + diameter, u0, tinggiMaks, "aksen")];
}

/** M-05: pegangan rambat di dinding belakang kloset dan di dinding samping terdekat (bila dindingnya digambar). */
function pegangan(ctx: KonteksModifikasi): BagianModifikasi[] {
  const dT = titikDinding(ctx.letak("kloset")).dinding;
  const s = ctx.posisi.kloset;
  const { panjangBelakang, panjangSamping } = DIM.pegangan;
  const hasil: BagianModifikasi[] = [];
  const tengahBelakang = { ...ctx.kerangka(dT), sepanjang: s };
  const sisiBelakang = panjangBelakang / 2;
  const batas = panjangDinding(dT) / 2;
  const a0 = Math.max(-batas - s, -sisiBelakang);
  const a1 = Math.min(batas - s, sisiBelakang);
  if (a1 - a0 > 10) hasil.push({ daftar: batang(tengahBelakang, a0, a1), objek: "kloset", pijak: pusat(tengahBelakang, (a0 + a1) / 2, 0) });
  const dS = dindingSamping(dT, s);
  if (ctx.dindingTergambar.includes(dS)) {
    const kS = ctx.kerangka(dS);
    const [b0, b1] = rentangDariDinding(dS, dT, panjangSamping);
    hasil.push({ daftar: batang(kS, b0, b1), objek: "kloset", pijak: pusat(kS, (b0 + b1) / 2, 0) });
  }
  return hasil;
}

function pusat(k: Kerangka, a: number, n: number): [number, number] {
  const [x, y] = ruangDari(k, a, n);
  return [x, y];
}

/** Koordinat ruangan (x, y) untuk titik lokal (a, n) pada kerangka dinding. */
function ruangDari(k: Kerangka, a: number, n: number): readonly [number, number] {
  switch (k.dinding) {
    case "belakang":
      return [k.sepanjang + a, k.bidang + n];
    case "kiri":
      return [k.bidang + n, k.sepanjang + a];
    case "kanan":
      return [k.bidang - n, k.sepanjang + a];
    case "depan":
      return [k.sepanjang + a, k.bidang - n];
  }
}

/** M-10: kursi lipat menempel di dinding area shower; lebar, dalam, dan tinggi dari tabel. Dipasang di sisi yang lebih jauh dari kloset. */
function kursiMandi(ctx: KonteksModifikasi): BagianModifikasi[] {
  const dM = titikDinding(ctx.letak("area_mandi")).dinding;
  const k = { ...ctx.kerangka(dM), sepanjang: ctx.posisi.area_mandi };
  const t = DIM.akses.tempatDuduk;
  const setengah = t / 2;
  const batas = panjangDinding(dM) / 2;
  const dKloset = titikDinding(ctx.letak("kloset")).dinding;
  const kKloset = { ...ctx.kerangka(dKloset), sepanjang: ctx.posisi.kloset };
  const [kx, ky] = ruangDari(kKloset, 0, 30);
  const calon = [-45, 45].map((a) => jepit(a, -batas - k.sepanjang + setengah + 4, batas - k.sepanjang - setengah - 4));
  const jarak = (a: number) => Math.hypot(ruangDari(k, a, t / 2)[0] - kx, ruangDari(k, a, t / 2)[1] - ky);
  const a = jarak(calon[0]) >= jarak(calon[1]) ? calon[0] : calon[1];
  const tebal = 4;
  const kaki = (a0: number) => kotak(k, a0, a0 + 4, t - 7, t - 4, 0, t - tebal, "aksen");
  const daftar: Primitif[] = [
    ...kotak(k, a - setengah, a + setengah, 0, 3, t - tebal - 18, t, "aksen"),
    ...kaki(a - setengah + 2),
    ...kaki(a + setengah - 6),
    ...kotak(k, a - setengah, a + setengah, 0, t, t - tebal, t, "aksen"),
  ];
  return [{ daftar, objek: "area_mandi", pijak: pusat(k, a, t / 2) }];
}

/** M-08: area shower tanpa undakan (zona rata di lantai) dengan saluran memanjang dan panah kemiringan ke saluran. */
function showerRata(ctx: KonteksModifikasi): BagianModifikasi[] {
  const dM = titikDinding(ctx.letak("area_mandi")).dinding;
  const k = { ...ctx.kerangka(dM), sepanjang: ctx.posisi.area_mandi };
  const batas = panjangDinding(dM) / 2;
  const setengah = DIM.rollIn.panjang / 2;
  const a0 = Math.max(-batas - k.sepanjang, -setengah);
  const a1 = Math.min(batas - k.sepanjang, setengah);
  const dalam = DIM.akses.lebarBilik;
  const T = (a: number, n: number): Titik => titik(k, a, n, 0);
  const daftar: Primitif[] = [
    // Lantai rata tanpa undakan: isian hijau muda polos (bukan putus-putus), supaya beda dari zona ruang bebas.
    poligon("atas", [T(a0, 0), T(a1, 0), T(a1, dalam), T(a0, dalam)], "aksen"),
    // Saluran memanjang di tepi depan zona.
    poligon("rongga", [T(a0 + 6, dalam - 9), T(a1 - 6, dalam - 9), T(a1 - 6, dalam - 4), T(a0 + 6, dalam - 4)], "aksen"),
  ];
  const tengah = (a0 + a1) / 2;
  for (const a of [tengah - 40, tengah, tengah + 40]) {
    if (a - 6 < a0 || a + 6 > a1) continue;
    const dari = dalam - 40;
    const ke = dalam - 16;
    daftar.push({ jenis: "garisPoli", titik: [T(a, dari), T(a, ke)], peran: "aksen" });
    daftar.push({ jenis: "garisPoli", titik: [T(a - 5, ke - 7), T(a, ke), T(a + 5, ke - 7)], peran: "aksen" });
  }
  return [{ daftar, objek: "area_mandi", pijak: "lantai" }];
}

/** Lingkaran lantai (dalam koordinat ruangan) sebagai poligon proyeksi. */
function lingkaranLantai(ctx: KonteksModifikasi, x: number, y: number, r: number): Titik[] {
  return footprintOval(x, y, r, r, 40).map(([px, py]) => ctx.proyeksi(px, py, 0));
}

/** M-02: ruang putar kursi roda, lingkaran bebas di lantai, di tengah ruangan. */
function ruangPutar(ctx: KonteksModifikasi): BagianModifikasi[] {
  const r = Math.min(DIM.ruangPutar, LEBAR) / 2;
  const garis = lingkaranLantai(ctx, 0, 0, r);
  return [{ daftar: [{ jenis: "garisPoli", titik: [...garis, garis[0]], peran: "aksen", putus: true }], objek: null, pijak: "lantai" }];
}

/** M-03: area bebas di samping kloset, persegi (sebesar ruang putar) di lantai sepanjang dinding kloset, tanpa isian. */
function areaBebasKloset(ctx: KonteksModifikasi): BagianModifikasi[] {
  const dT = titikDinding(ctx.letak("kloset")).dinding;
  const k = { ...ctx.kerangka(dT), sepanjang: ctx.posisi.kloset };
  const lebar = DIM.ruangPutar;
  const batas = panjangDinding(dT) / 2;
  const a0 = Math.max(-batas - k.sepanjang, -lebar / 2);
  const a1 = Math.min(batas - k.sepanjang, lebar / 2);
  const dalam = Math.min(lebar, panjangDinding(dindingSamping(dT, k.sepanjang)));
  const T = (a: number, n: number): Titik => titik(k, a, n, 0);
  return [
    {
      daftar: [{ jenis: "garisPoli", titik: [T(a0, 0), T(a1, 0), T(a1, dalam), T(a0, dalam), T(a0, 0)], peran: "aksen", putus: true }],
      objek: "kloset",
      pijak: "lantai",
    },
  ];
}

/** Semua bagian gambar untuk pertanyaan `id` (kosong bila belum punya gambar). */
export function gambarModifikasi(id: string, ctx: KonteksModifikasi): BagianModifikasi[] {
  switch (id) {
    case "M-02":
      return ruangPutar(ctx);
    case "M-03":
      return areaBebasKloset(ctx);
    case "M-05":
      return pegangan(ctx);
    case "M-08":
      return showerRata(ctx);
    case "M-10":
      return kursiMandi(ctx);
    default:
      return [];
  }
}
