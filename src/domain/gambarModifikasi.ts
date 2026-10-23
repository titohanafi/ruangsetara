// Gambar "setelah modifikasi" untuk ruang kamar mandi isometrik: tiap fungsi menghasilkan bentuk (primitif) untuk satu
// pertanyaan checklist yang dijawab Tidak, sesuai teks Modifikasi di sheet peneliti. Semuanya berperan "aksen" (hijau)
// supaya terlihat beda dari kondisi sekarang. Ukuran hanya untuk proporsi gambar (dari `dimensiGambar.ts`, yang berasal
// dari tabel ukuran). Bila `tampilkanUkuran` aktif, gambar per pertanyaan juga menuliskan ukuran, hanya angka yang ada di teks
// Modifikasi di sheet atau di tabel; angka yang masih ditinjau peneliti (lihat `ANGKA_DITINJAU`) diberi tanda *.
import { titikDinding } from "./denahGeometri";
import type { LetakDenah, ObjekDenah } from "./denahPindai";
import { DIM } from "./dimensiGambar";
import { footprintOval, kotak, poligon, titik, type Dinding, type Kerangka, type Primitif, type Titik } from "./gambarShower";

/**
 * Pertanyaan yang sudah punya gambar modifikasi, dan benda di ruangan yang dipasangi. Gambar dibuat bila **salah satu** benda
 * itu terlihat di foto; daftar kosong berarti gambarnya tidak bergantung pada benda tertentu (lantai atau ruang bebas).
 * M-01, M-04, dan sebagian M-06 dan M-12 menggambar lewat penggantian benda di `PratinjauRuangIso3D` (warna hijau).
 */
export const BERGAMBAR: Record<string, readonly ObjekDenah[]> = {
  "M-01": ["pintu"],
  "M-02": [],
  "M-03": ["kloset"],
  "M-04": ["kloset"],
  "M-05": ["kloset"],
  "M-06": ["wastafel"],
  "M-08": ["area_mandi"],
  "M-09": [],
  "M-10": ["area_mandi"],
  "M-11": ["area_mandi", "wastafel"],
  "M-12": ["kloset", "area_mandi", "pintu"],
};

/**
 * Pertanyaan yang gambarnya memuat angka yang masih ditinjau peneliti (`riset/koreksi-untuk-tim-riset.md`, bagian "Perlu
 * kejelasan sumber"): angkanya tetap sama dengan teks Modifikasi di sheet, tetapi diberi tanda * di gambar.
 */
export const ANGKA_DITINJAU: ReadonlySet<string> = new Set(["M-03", "M-04", "M-05", "M-07", "M-11"]);

/** Angka dari teks Modifikasi di sheet yang tidak ada di tabel ukuran (tinggi dudukan kloset 45 sampai 50 cm, M-04). */
const KLOSET_SHEET = { min: 45, maks: 50 };

/** Angka Indonesia: koma desimal. */
const angka = (n: number): string => String(n).replace(".", ",");
const rentang = (a: number, b: number): string => `${angka(a)}–${angka(b)} cm`;

/** Pertanyaan yang mengganti benda (warna hijau) alih-alih menambah bagian, dan bendanya. */
export const PENGGANTI: Record<string, ObjekDenah> = { "M-01": "pintu", "M-04": "kloset", "M-06": "wastafel", "M-12": "pintu" };

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
  /** Tulis ukuran dan nama di gambar (gambar per pertanyaan); mati di gambar ringkasan supaya tidak penuh. */
  tampilkanUkuran: boolean;
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

/** Posisi `a` pada dinding samping `samping` yang berjarak `jarak` dari bidang dinding `asal` tempat benda menempel. */
function aDariDinding(samping: Dinding, asal: Dinding, jarak: number): number {
  const minus = asal === "belakang" || asal === "kiri";
  return minus ? -panjangDinding(samping) / 2 + jarak : panjangDinding(samping) / 2 - jarak;
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
  if (a1 - a0 > 10) {
    const daftar = batang(tengahBelakang, a0, a1);
    if (ctx.tampilkanUkuran) {
      const { tinggiMin, tinggiMaks } = DIM.pegangan;
      // Tinggi di ujung kiri batang (jauh dari hand shower), panjang di atas batang; label samping lebih tinggi supaya tidak bertabrakan.
      daftar.push(
        ukurTegak(tengahBelakang, Math.max(a0 - 10, -batas - s + 2), 0, 0, tinggiMaks, `${rentang(tinggiMin, tinggiMaks)}*`, "atas"),
      );
      daftar.push(ukurSejajar(tengahBelakang, a0, a1, 0, tinggiMaks + 10, `${angka(panjangBelakang)} cm`));
    }
    hasil.push({ daftar, objek: "kloset", pijak: pusat(tengahBelakang, (a0 + a1) / 2, 0) });
  }
  const dS = dindingSamping(dT, s);
  if (ctx.dindingTergambar.includes(dS)) {
    const kS = ctx.kerangka(dS);
    const [b0, b1] = rentangDariDinding(dS, dT, panjangSamping);
    const daftar = batang(kS, b0, b1);
    if (ctx.tampilkanUkuran) daftar.push(ukurSejajar(kS, b0, b1, 0, DIM.pegangan.tinggiMaks + 26, `${angka(panjangSamping)} cm`));
    hasil.push({ daftar, objek: "kloset", pijak: pusat(kS, (b0 + b1) / 2, 0) });
  }
  return hasil;
}

/** Garis ukur tegak (tinggi dari lantai) pada dinding `k`, di posisi lokal (a, n), dari tinggi `u0` ke `u1`. */
function ukurTegak(k: Kerangka, a: number, n: number, u0: number, u1: number, teks: string, teksDi?: "atas"): Primitif {
  return { jenis: "ukur", dari: titik(k, a, n, u0), ke: titik(k, a, n, u1), teks, teksDi };
}

/** Garis ukur sejajar dinding `k` (panjang), dari `a0` ke `a1`, di kedalaman `n` dan tinggi `u`. */
function ukurSejajar(k: Kerangka, a0: number, a1: number, n: number, u: number, teks: string): Primitif {
  return { jenis: "ukur", dari: titik(k, a0, n, u), ke: titik(k, a1, n, u), teks };
}

/** Teks pendek di titik lokal (a, n, u) pada dinding `k`. */
function labelDi(k: Kerangka, a: number, n: number, u: number, teks: string): Primitif {
  const [x, y] = titik(k, a, n, u);
  return { jenis: "label", x, y, teks };
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
  if (ctx.tampilkanUkuran) daftar.push(ukurTegak(k, a + setengah + 14, t, 0, t, rentang(DIM.kursiMandi.min, DIM.kursiMandi.maks)));
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
  const dalam = DIM.rollIn.lebar;
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
  if (ctx.tampilkanUkuran) daftar.push(labelDi(k, tengah, dalam + 30, 0, `${angka(DIM.rollIn.lebar)} × ${angka(a1 - a0)} cm`));
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
  const daftar: Primitif[] = [{ jenis: "garisPoli", titik: [...garis, garis[0]], peran: "aksen", putus: true }];
  if (ctx.tampilkanUkuran) {
    const [x, y] = ctx.proyeksi(0, 0, 0);
    daftar.push({ jenis: "label", x, y: y + 4, teks: `ø ${angka(DIM.ruangPutar)} cm` });
  }
  return [{ daftar, objek: null, pijak: "lantai" }];
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
  const daftar: Primitif[] = [
    { jenis: "garisPoli", titik: [T(a0, 0), T(a1, 0), T(a1, dalam), T(a0, dalam), T(a0, 0)], peran: "aksen", putus: true },
  ];
  if (ctx.tampilkanUkuran) daftar.push(ukurSejajar(k, a0, a1, dalam + 10, 0, `${angka(DIM.ruangPutar)} cm*`));
  return [{ daftar, objek: "kloset", pijak: "lantai" }];
}

/** Kerangka dinding tempat `objek` menempel, di posisinya sepanjang dinding. */
function kerangkaBenda(ctx: KonteksModifikasi, objek: ObjekDenah): Kerangka {
  return { ...ctx.kerangka(titikDinding(ctx.letak(objek)).dinding), sepanjang: ctx.posisi[objek] };
}

/** Rentang `a` yang dijepit agar tetap di dalam dinding (cm), bila `a0..a1` pada kerangka `k` melewati ujung dinding. */
function jepitDinding(k: Kerangka, a0: number, a1: number): [number, number] {
  const batas = panjangDinding(k.dinding) / 2;
  return [Math.max(a0, -batas - k.sepanjang + 2), Math.min(a1, batas - k.sepanjang - 2)];
}

/** M-06: cermin di atas wastafel, tepi bawahnya dalam jangkauan duduk. (Wastafel dan keran diganti lewat penggantian benda.) */
function cermin(ctx: KonteksModifikasi): BagianModifikasi[] {
  const k = kerangkaBenda(ctx, "wastafel");
  const [a0, a1] = jepitDinding(k, -DIM.wastafel.lebarBak / 2, DIM.wastafel.lebarBak / 2);
  if (a1 - a0 < 10) return [];
  const daftar = kotak(k, a0, a1, 0, 1.5, DIM.cermin.tepiBawah, DIM.cermin.tepiAtas, "aksen");
  if (ctx.tampilkanUkuran)
    daftar.push(
      ukurTegak(
        k,
        jepit(a1 + 14, a0, panjangDinding(k.dinding) / 2 - k.sepanjang - 2),
        0,
        0,
        DIM.cermin.tepiBawah,
        `maks. ${angka(DIM.cermin.tepiBawah)} cm`,
      ),
    );
  return [{ daftar, objek: "wastafel", pijak: pusat(k, (a0 + a1) / 2, 0) }];
}

/** M-09: keramik bertekstur, digambar sebagai goresan pendek tersebar di seluruh lantai. */
function lantaiBertekstur(ctx: KonteksModifikasi): BagianModifikasi[] {
  const daftar: Primitif[] = [];
  const jarak = 20;
  const tepi = 8;
  let baris = 0;
  for (let y = -DALAM / 2 + tepi; y <= DALAM / 2 - tepi; y += jarak, baris++) {
    const geser = baris % 2 === 0 ? 0 : jarak / 2;
    for (let x = -LEBAR / 2 + tepi + geser; x <= LEBAR / 2 - tepi - 3; x += jarak) {
      daftar.push({ jenis: "garisPoli", titik: [ctx.proyeksi(x, y, 0), ctx.proyeksi(x + 4, y, 0)], peran: "aksen" });
    }
  }
  if (ctx.tampilkanUkuran) {
    const [x, y] = ctx.proyeksi(0, DALAM / 4, 0);
    daftar.push({ jenis: "label", x, y, teks: "Keramik bertekstur" });
  }
  return [{ daftar, objek: null, pijak: "lantai" }];
}

/** M-11: rak di dinding area shower dan handuk pada batang di dinding wastafel, pada ketinggian dalam rentang jangkauan. */
function rakHandukBagian(ctx: KonteksModifikasi): BagianModifikasi[] {
  const u = (DIM.jangkauan.bawah + DIM.jangkauan.atas) / 2;
  const hasil: BagianModifikasi[] = [];
  const kM = kerangkaBenda(ctx, "area_mandi");
  const batasM = panjangDinding(kM.dinding) / 2;
  // Rak di sisi seberang hand shower (hand shower dipasang ke arah a positif).
  const aRak = jepit(-40, -batasM - kM.sepanjang + 24, batasM - kM.sepanjang - 24);
  hasil.push({
    daftar: [
      ...kotak(kM, aRak - 20, aRak + 20, 0, 12, u, u + 3, "aksen"),
      ...kotak(kM, aRak - 17, aRak - 13, 0, 10, u - 9, u, "aksen"),
      ...kotak(kM, aRak + 13, aRak + 17, 0, 10, u - 9, u, "aksen"),
    ],
    objek: "area_mandi",
    pijak: pusat(kM, aRak, 6),
  });
  if (ctx.tampilkanUkuran)
    hasil[0].daftar.push(
      ukurTegak(kM, aRak - 30, 0, DIM.jangkauan.bawah, DIM.jangkauan.atas, `${rentang(DIM.jangkauan.bawah, DIM.jangkauan.atas)}*`, "atas"),
    );
  const kW = kerangkaBenda(ctx, "wastafel");
  const batasW = panjangDinding(kW.dinding) / 2;
  // Di sisi wastafel yang lebih jauh dari kloset, supaya tidak menumpuk dengan pegangan di belakang kloset.
  const kK = kerangkaBenda(ctx, "kloset");
  const [kx, ky] = ruangDari(kK, 0, 30);
  const calon = [-1, 1].map((sisi) =>
    jepit(sisi * (DIM.wastafel.lebarBak / 2 + 24), -batasW - kW.sepanjang + 18, batasW - kW.sepanjang - 18),
  );
  const jarak = (a: number) => Math.hypot(ruangDari(kW, a, 4)[0] - kx, ruangDari(kW, a, 4)[1] - ky);
  const aBatang = jarak(calon[0]) >= jarak(calon[1]) ? calon[0] : calon[1];
  hasil.push({
    daftar: [
      ...kotak(kW, aBatang - 16, aBatang + 16, 3, 5.5, u - 1, u + 1, "aksen"),
      ...kotak(kW, aBatang - 14, aBatang - 11, 0, 3, u - 2, u + 2, "aksen"),
      ...kotak(kW, aBatang + 11, aBatang + 14, 0, 3, u - 2, u + 2, "aksen"),
      ...kotak(kW, aBatang - 12, aBatang + 12, 5.5, 8, u - 38, u + 1, "aksen"),
    ],
    objek: "wastafel",
    pijak: pusat(kW, aBatang, 4),
  });
  return hasil;
}

/** Tombol panggil darurat: pelat kecil di dinding dekat kloset dan di area shower, serendah batas bawah jangkauan duduk. */
function tombol(k: Kerangka, a: number, u: number): Primitif[] {
  return [...kotak(k, a - 5, a + 5, 0, 2, u, u + 10, "aksen"), ...kotak(k, a - 2, a + 2, 2, 3.5, u + 3, u + 7, "aksen")];
}

/** M-12: tombol panggil darurat dekat kloset dan dekat area mandi. (Pintu membuka ke luar digambar lewat penggantian pintu.) */
function tombolDarurat(ctx: KonteksModifikasi): BagianModifikasi[] {
  const u = DIM.jangkauan.bawah;
  const kK = kerangkaBenda(ctx, "kloset");
  const [b0, b1] = jepitDinding(kK, -60, 60);
  // Tombol dekat kloset dipasang di dinding samping di sebelah mangkuk bila dindingnya tergambar (tidak tertutup kloset);
  // bila tidak, di dinding belakang kloset di sisi yang lebih jauh dari wastafel.
  const dT = titikDinding(ctx.letak("kloset")).dinding;
  const dS = dindingSamping(dT, kK.sepanjang);
  let bagianKloset: { k: Kerangka; a: number };
  if (ctx.dindingTergambar.includes(dS)) {
    bagianKloset = { k: ctx.kerangka(dS), a: aDariDinding(dS, dT, 31) };
  } else {
    const kW = kerangkaBenda(ctx, "wastafel");
    const [wx, wy] = ruangDari(kW, 0, 12);
    const calonK = [-32, 32].map((a) => jepit(a, b0 + 6, b1 - 6));
    const jarakW = (a: number) => Math.hypot(ruangDari(kK, a, 1)[0] - wx, ruangDari(kK, a, 1)[1] - wy);
    bagianKloset = { k: kK, a: jarakW(calonK[0]) >= jarakW(calonK[1]) ? calonK[0] : calonK[1] };
  }
  const kM = kerangkaBenda(ctx, "area_mandi");
  const sebut = (k: Kerangka, a: number): Primitif[] => (ctx.tampilkanUkuran ? [labelDi(k, a, 0, u + 22, "Tombol darurat")] : []);
  return [
    {
      daftar: [...tombol(bagianKloset.k, bagianKloset.a, u), ...sebut(bagianKloset.k, bagianKloset.a)],
      objek: "kloset",
      pijak: pusat(bagianKloset.k, bagianKloset.a, 1),
    },
    { daftar: [...tombol(kM, 0, u), ...sebut(kM, 0)], objek: "area_mandi", pijak: pusat(kM, 0, 1) },
  ];
}

/** M-01: ukuran bukaan pintu (pintu sendiri diganti lewat penggantian benda). */
function ukuranPintu(ctx: KonteksModifikasi): BagianModifikasi[] {
  if (!ctx.tampilkanUkuran) return [];
  const k = kerangkaBenda(ctx, "pintu");
  const s2 = DIM.pintu.bukaanBersih / 2;
  return [
    {
      daftar: [ukurSejajar(k, -s2, s2, 0, DIM.pintu.tinggi + 28, `min. ${angka(DIM.pintu.bukaanBersih)} cm`)],
      objek: "pintu",
      pijak: pusat(k, 0, 0),
    },
  ];
}

/** M-04: tinggi dudukan kloset (kloset sendiri diganti lewat penggantian benda). */
function ukuranKloset(ctx: KonteksModifikasi): BagianModifikasi[] {
  if (!ctx.tampilkanUkuran) return [];
  const k = kerangkaBenda(ctx, "kloset");
  const [, b1] = jepitDinding(k, -60, 60);
  const a = jepit(46, -60, b1 - 4);
  return [
    {
      daftar: [ukurTegak(k, a, 31, 0, DIM.kloset.tinggiDudukan, `${rentang(KLOSET_SHEET.min, KLOSET_SHEET.maks)}*`)],
      objek: "kloset",
      pijak: pusat(k, 0, 0),
    },
  ];
}

/** M-07: rentang jangkauan keran dan holder (hand shower diganti lewat mode gambar shower). */
function ukuranJangkauan(ctx: KonteksModifikasi): BagianModifikasi[] {
  if (!ctx.tampilkanUkuran) return [];
  const k = kerangkaBenda(ctx, "area_mandi");
  const batas = panjangDinding(k.dinding) / 2;
  const a = jepit(62, -batas - k.sepanjang + 4, batas - k.sepanjang - 4);
  return [
    {
      daftar: [ukurTegak(k, a, 0, DIM.jangkauan.bawah, DIM.jangkauan.atas, `${rentang(DIM.jangkauan.bawah, DIM.jangkauan.atas)}*`)],
      objek: "area_mandi",
      pijak: pusat(k, a, 0),
    },
  ];
}

/** Semua bagian gambar untuk pertanyaan `id` (kosong bila belum punya gambar). */
export function gambarModifikasi(id: string, ctx: KonteksModifikasi): BagianModifikasi[] {
  switch (id) {
    case "M-01":
      return ukuranPintu(ctx);
    case "M-02":
      return ruangPutar(ctx);
    case "M-03":
      return areaBebasKloset(ctx);
    case "M-04":
      return ukuranKloset(ctx);
    case "M-05":
      return pegangan(ctx);
    case "M-06":
      return cermin(ctx);
    case "M-07":
      return ukuranJangkauan(ctx);
    case "M-08":
      return showerRata(ctx);
    case "M-09":
      return lantaiBertekstur(ctx);
    case "M-10":
      return kursiMandi(ctx);
    case "M-11":
      return rakHandukBagian(ctx);
    case "M-12":
      return tombolDarurat(ctx);
    default:
      return [];
  }
}
