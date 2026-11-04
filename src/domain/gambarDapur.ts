// Gambar "setelah modifikasi" untuk dapur (isometrik, hijau = bagian yang diubah). Berbeda dari kamar mandi, tata letak
// dapur TETAP (ilustrasi umum, bukan hasil baca foto): prompt Gemini untuk dapur belum diuji dengan foto asli.
// Ukuran benda hanya untuk proporsi (`DAPUR`, perkiraan). Angka yang TERTULIS di gambar hanya dari teks Modifikasi di sheet
// peneliti (K-01..K-08); angka yang tampak keliru atau masih ditinjau tidak ditulis (lihat `ANGKA_DAPUR_DITINJAU`).
import { footprintOval, kotak, poligon, titik, type Dinding, type Kerangka, type Primitif, type Titik } from "./gambarShower";

import { BERGAMBAR_DAPUR } from "./bergambarDapur";

export { BERGAMBAR_DAPUR };

/** Gambar yang memuat angka yang masih ditinjau peneliti (tanda * dan keterangan): K-08 memakai 38–122 cm yang juga ditinjau di kamar mandi. */
export const ANGKA_DAPUR_DITINJAU: ReadonlySet<string> = new Set(["K-08"]);

/** Ukuran ilustratif dapur (cm). Perkiraan untuk proporsi, BUKAN acuan dan tidak ditulis di gambar; dilaporkan ke peneliti. */
export const DAPUR = {
  ruang: { lebar: 360, dalam: 300, tinggi: 260, tebalDinding: 10 },
  meja: { tinggi: 90, dalam: 60, tebalPapan: 4 },
  kulkas: { lebar: 70, dalam: 68, tinggi: 170 },
  pintu: { tinggi: 210 },
  // Tata letak tetap sepanjang dinding belakang (cm dari tengah dinding), dari kiri ke kanan. Kulkas yang tinggi di ujung kanan
  // (jauh dari kamera) supaya tidak menutupi benda lain.
  letak: {
    meja: [-170, -80],
    kompor: [-80, -20],
    wastafel: [-20, 60],
    kulkas: [100, 170],
  },
  // Pintu di dinding kanan: pusatnya sepanjang dinding (cm dari tengah) dan lebar daun yang digambar pada kondisi sekarang.
  pintuKanan: { pusat: 70, daun: 75 },
} as const;

/** Angka dari teks Modifikasi di sheet (hanya yang dipakai di gambar). */
const SHEET = {
  pintuMin: 80,
  jalurMin: 92,
  ruangPutar: 152.5,
  mejaMin: 71,
  mejaMaks: 86.5,
  mejaLebarMin: 76,
  lututTinggi: 68.5,
  lututDalam: 43,
  bakMaks: 16.5,
  bebasLebar: 76,
  bebasDalam: 122,
  freezerBawahMaks: 137,
  sakelarMin: 38,
  sakelarMaks: 122,
} as const;

const angka = (n: number): string => String(n).replace(".", ",");
const rentang = (a: number, b: number): string => `${angka(a)}–${angka(b)} cm`;

export interface KonteksRuang {
  kerangka: (dinding: Dinding) => Kerangka;
  /** Proyeksi koordinat ruangan (cm: x lebar, y dalam, z tinggi) ke kanvas. */
  proyeksi: (x: number, y: number, z: number) => Titik;
  /** Tulis ukuran dan nama di gambar. */
  tampilkanUkuran: boolean;
}

export interface Lapisan {
  id: string;
  daftar: Primitif[];
  /** Urutan gambar (makin besar makin depan); lantai memakai nilai sangat kecil. */
  kedalaman: number;
  /** Bagian modifikasi (hijau), dipakai untuk memperbesar gambar ke bagian itu. */
  aksen: boolean;
}

export interface HasilRuang {
  lapisan: Lapisan[];
  /** Garis ukur dan teks: digambar di lapisan paling atas supaya tidak tertutup benda. */
  anotasi: Primitif[];
}

/** Benda dasar yang diganti oleh gambar modifikasi pertanyaan itu (tidak digambar ganda). */
const DIGANTI: Record<string, "pintu" | "meja" | "wastafel" | "kompor" | "kulkas"> = {
  "K-01": "pintu",
  "K-02": "meja",
  "K-03": "wastafel",
  "K-04": "kompor",
  "K-05": "meja",
  "K-06": "kulkas",
};

type Peran = "netral" | "aksen";
const garis = (dari: Titik, ke: Titik, peran: Peran, gaya: "tegas" | "putus" = "tegas"): Primitif => ({
  jenis: "garis",
  dari,
  ke,
  gaya,
  peran,
});
const ukur = (dari: Titik, ke: Titik, teks: string, teksDi?: "atas"): Primitif => ({ jenis: "ukur", dari, ke, teks, teksDi });
const label = (p: Titik, teks: string, dx = 0, dy = 0): Primitif => ({ jenis: "label", x: p[0] + dx, y: p[1] + dy, teks });

const belakang = (c: KonteksRuang): Kerangka => c.kerangka("belakang");
const kanan = (c: KonteksRuang): Kerangka => c.kerangka("kanan");
const pivot = (c: KonteksRuang, x: number, y: number): number => c.proyeksi(x, y, 0)[1];
const xyBelakang = (a: number, n: number): [number, number] => [a, -DAPUR.ruang.dalam / 2 + n];

/** Tegak lurus ke atas di dinding `k`: garis ukur tinggi dari lantai. */
const ukurTegak = (k: Kerangka, a: number, n: number, u0: number, u1: number, teks: string): Primitif =>
  ukur(titik(k, a, n, u0), titik(k, a, n, u1), teks);

/** Persegi di lantai (garis putus-putus hijau + isian tipis), dari sudut ruangan (x0,y0) ke (x1,y1). */
function zonaLantai(c: KonteksRuang, id: string, x0: number, y0: number, x1: number, y1: number): Lapisan[] {
  const T = (x: number, y: number): Titik => c.proyeksi(x, y, 0);
  const sudut = [T(x0, y0), T(x1, y0), T(x1, y1), T(x0, y1)];
  return [
    { id: `${id}-isi`, daftar: [poligon("zona", sudut, "aksen")], kedalaman: -1e9, aksen: true },
    {
      id: `${id}-garis`,
      daftar: [{ jenis: "garisPoli", titik: [...sudut, sudut[0]], peran: "aksen", putus: true }],
      kedalaman: -1e9 + 1,
      aksen: true,
    },
  ];
}

/** Tombol dan pegangan kecil di muka depan lemari (n = bidang depan lemari). */
function pegangan(k: Kerangka, a: number, n: number, u: number, peran: Peran): Primitif[] {
  return kotak(k, a - 7, a + 7, n, n + 3, u, u + 2, peran);
}

/** Lemari bawah (kabinet) dengan papan atas; `pintu` menggambar dua daun, `laci` tiga laci. */
function kabinet(k: Kerangka, a0: number, a1: number, tinggiAtas: number, peran: Peran, isi: "pintu" | "laci" | "terbuka"): Primitif[] {
  const { dalam, tebalPapan } = DAPUR.meja;
  const hasil: Primitif[] = [];
  if (isi !== "terbuka") hasil.push(...kotak(k, a0, a1, 0, dalam - 2, 0, tinggiAtas - tebalPapan, peran));
  hasil.push(...kotak(k, a0, a1, 0, dalam, tinggiAtas - tebalPapan, tinggiAtas, peran));
  const muka = dalam - 2;
  const tengah = (a0 + a1) / 2;
  if (isi === "pintu") {
    hasil.push(garis(titik(k, tengah, muka, 4), titik(k, tengah, muka, tinggiAtas - tebalPapan), peran));
    hasil.push(...pegangan(k, tengah - 12, muka, tinggiAtas - 14, peran), ...pegangan(k, tengah + 12, muka, tinggiAtas - 14, peran));
  }
  if (isi === "laci") {
    const tinggiLaci = (tinggiAtas - tebalPapan - 4) / 3;
    for (let i = 0; i < 3; i++) {
      const u = 2 + i * tinggiLaci;
      if (i > 0) hasil.push(garis(titik(k, a0, muka, u), titik(k, a1, muka, u), peran));
      hasil.push(...pegangan(k, tengah, muka, u + tinggiLaci - 9, peran));
    }
  }
  return hasil;
}

function kulkas(k: Kerangka, peran: Peran, freezerBawah: boolean): Primitif[] {
  const [a0, a1] = DAPUR.letak.kulkas;
  const { dalam, tinggi } = DAPUR.kulkas;
  const sambungan = freezerBawah ? 62 : 120;
  const muka = dalam;
  const hasil = kotak(k, a0 + 2, a1 - 2, 0, dalam, 0, tinggi, peran);
  hasil.push(garis(titik(k, a0 + 2, muka, sambungan), titik(k, a1 - 2, muka, sambungan), peran));
  hasil.push(...kotak(k, a1 - 12, a1 - 9, muka, muka + 3, sambungan + 8, sambungan + 40, peran));
  hasil.push(...kotak(k, a1 - 12, a1 - 9, muka, muka + 3, sambungan - 40, sambungan - 8, peran));
  return hasil;
}

/** Wastafel dapur: papan dengan bak dan keran; `terbuka` = tanpa lemari di bawahnya (ruang lutut). */
function wastafel(k: Kerangka, peran: Peran, terbuka: boolean, tinggiAtas: number): Primitif[] {
  const [a0, a1] = DAPUR.letak.wastafel;
  const tengah = (a0 + a1) / 2;
  const hasil = kabinet(k, a0, a1, tinggiAtas, peran, terbuka ? "terbuka" : "pintu");
  const T = (a: number, n: number): Titik => titik(k, a, n, tinggiAtas);
  hasil.push(poligon("rongga", [T(tengah - 28, 14), T(tengah + 28, 14), T(tengah + 28, 46), T(tengah - 28, 46)], peran));
  hasil.push(...kotak(k, tengah - 2, tengah + 2, 4, 8, tinggiAtas, tinggiAtas + 22, peran));
  hasil.push(...kotak(k, tengah - 2, tengah + 2, 4, 20, tinggiAtas + 19, tinggiAtas + 22, peran));
  if (terbuka) {
    // Kaki papan di sisi luar supaya papan tidak melayang; bagian bawah dibiarkan kosong untuk lutut.
    hasil.push(...kotak(k, a0, a0 + 3, 4, dalamKaki(), 0, tinggiAtas - DAPUR.meja.tebalPapan, peran));
    hasil.push(...kotak(k, a1 - 3, a1, 4, dalamKaki(), 0, tinggiAtas - DAPUR.meja.tebalPapan, peran));
  }
  return hasil;
}
const dalamKaki = (): number => DAPUR.meja.dalam - 6;

function kompor(k: Kerangka, peran: Peran, tinggiAtas: number): Primitif[] {
  const [a0, a1] = DAPUR.letak.kompor;
  const tengah = (a0 + a1) / 2;
  const hasil = kabinet(k, a0, a1, tinggiAtas, peran, "pintu");
  for (const [da, dn] of [
    [-13, 18],
    [13, 18],
    [-13, 42],
    [13, 42],
  ] as const) {
    hasil.push(
      poligon(
        "rongga",
        footprintOval(tengah + da, dn, 9, 9, 16).map(([a, n]) => titik(k, a, n, tinggiAtas)),
        peran,
      ),
    );
  }
  return hasil;
}

function pintuKanan(c: KonteksRuang, peran: Peran, denganDaun: boolean, lebarBukaan: number): Primitif[] {
  const k = kanan(c);
  const { pusat } = DAPUR.pintuKanan;
  const a0 = pusat - lebarBukaan / 2;
  const a1 = pusat + lebarBukaan / 2;
  const tinggi = DAPUR.pintu.tinggi;
  const hasil: Primitif[] = [
    poligon("rongga", [titik(k, a0, 0, 0), titik(k, a1, 0, 0), titik(k, a1, 0, tinggi), titik(k, a0, 0, tinggi)], "ruang"),
  ];
  hasil.push(...kotak(k, a0 - 5, a0, 0, 8, 0, tinggi + 4, peran), ...kotak(k, a1, a1 + 5, 0, 8, 0, tinggi + 4, peran));
  hasil.push(...kotak(k, a0 - 5, a1 + 5, 0, 8, tinggi, tinggi + 4, peran));
  if (denganDaun) hasil.push(...kotak(k, a0, a1, 3, 7, 0, tinggi, peran));
  return hasil;
}

/** Stopkontak/saklar: pelat kecil di dinding `k` pada tinggi `u`. */
const pelat = (k: Kerangka, a: number, u: number, peran: Peran): Primitif[] => kotak(k, a - 4, a + 4, 0, 1.5, u, u + 8, peran);

/** Gambar dapur untuk satu pertanyaan (`id`) yang dijawab Tidak; `null` = kondisi dasar tanpa modifikasi. */
export function susunDapur(id: string | null, c: KonteksRuang): HasilRuang {
  const kB = belakang(c);
  const diganti = id ? DIGANTI[id] : undefined;
  const lapisan: Lapisan[] = [];
  const anotasi: Primitif[] = [];
  const tambah = (nama: string, daftar: Primitif[], x: number, y: number, aksen = false) =>
    lapisan.push({ id: nama, daftar, kedalaman: pivot(c, x, y), aksen });
  const T = c.tampilkanUkuran;
  const { tinggi: tMeja } = DAPUR.meja;
  const [mA0, mA1] = DAPUR.letak.meja;
  const [pA0, pA1] = DAPUR.letak.kompor;
  const [wA0, wA1] = DAPUR.letak.wastafel;
  const [kA0, kA1] = DAPUR.letak.kulkas;
  const by = xyBelakang(0, 0)[1];

  // Benda dasar (abu-abu); yang diganti modifikasi digambar ulang hijau di bawah.
  if (diganti !== "kulkas") tambah("kulkas", kulkas(kB, "netral", false), (kA0 + kA1) / 2, by);
  if (diganti !== "meja") tambah("meja", kabinet(kB, mA0, mA1, tMeja, "netral", "pintu"), (mA0 + mA1) / 2, by);
  if (diganti !== "kompor") tambah("kompor", kompor(kB, "netral", tMeja), (pA0 + pA1) / 2, by);
  if (diganti !== "wastafel") tambah("wastafel", wastafel(kB, "netral", false, tMeja), (wA0 + wA1) / 2, by);
  if (diganti !== "pintu")
    tambah("pintu", pintuKanan(c, "netral", true, DAPUR.pintuKanan.daun), DAPUR.ruang.lebar / 2, DAPUR.pintuKanan.pusat);

  switch (id) {
    case "K-01": {
      const kK = kanan(c);
      const { pusat } = DAPUR.pintuKanan;
      const lebar = SHEET.pintuMin + 5;
      tambah("pintu-mod", pintuKanan(c, "aksen", false, lebar), DAPUR.ruang.lebar / 2, pusat, true);
      lapisan.push(...zonaLantai(c, "putar", -SHEET.ruangPutar / 2, -60, SHEET.ruangPutar / 2, -60 + SHEET.ruangPutar));
      if (T) {
        anotasi.push(
          ukur(
            titik(kK, pusat - lebar / 2, 10, DAPUR.pintu.tinggi + 12),
            titik(kK, pusat + lebar / 2, 10, DAPUR.pintu.tinggi + 12),
            `min. ${SHEET.pintuMin} cm`,
          ),
        );
        const sisi = 120;
        anotasi.push(
          ukur(
            c.proyeksi(sisi, -DAPUR.ruang.dalam / 2 + DAPUR.meja.dalam, 0),
            c.proyeksi(sisi, -DAPUR.ruang.dalam / 2 + DAPUR.meja.dalam + SHEET.jalurMin, 0),
            `jalur min. ${SHEET.jalurMin} cm`,
          ),
        );
        anotasi.push(label(c.proyeksi(0, -60 + SHEET.ruangPutar / 2, 0), `${angka(SHEET.ruangPutar)} × ${angka(SHEET.ruangPutar)} cm`));
      }
      break;
    }
    case "K-02": {
      const atas = 79;
      const daftar = [
        ...kotak(kB, mA0, mA1, 0, DAPUR.meja.dalam, atas - DAPUR.meja.tebalPapan, atas, "aksen"),
        ...kotak(kB, mA0, mA0 + 3, DAPUR.meja.dalam - 6, DAPUR.meja.dalam - 3, 0, atas - DAPUR.meja.tebalPapan, "aksen"),
        ...kotak(kB, mA1 - 3, mA1, DAPUR.meja.dalam - 6, DAPUR.meja.dalam - 3, 0, atas - DAPUR.meja.tebalPapan, "aksen"),
      ];
      tambah("meja-mod", daftar, (mA0 + mA1) / 2, by, true);
      if (T) {
        anotasi.push(ukurTegak(kB, mA1, DAPUR.meja.dalam + 14, 0, atas, rentang(SHEET.mejaMin, SHEET.mejaMaks)));
        anotasi.push(
          ukur(
            titik(kB, mA0, DAPUR.meja.dalam + 6, atas),
            titik(kB, mA1, DAPUR.meja.dalam + 6, atas),
            `min. ${SHEET.mejaLebarMin} cm`,
            "atas",
          ),
        );
        anotasi.push(
          label(titik(kB, (mA0 + mA1) / 2, DAPUR.meja.dalam + 40, 30), `Ruang lutut ${angka(SHEET.lututTinggi)} × ${SHEET.lututDalam} cm`),
        );
      }
      break;
    }
    case "K-03": {
      const atas = 84;
      tambah("wastafel-mod", wastafel(kB, "aksen", true, atas), (wA0 + wA1) / 2, by, true);
      const tengah = (wA0 + wA1) / 2;
      lapisan.push(
        ...zonaLantai(
          c,
          "bebas",
          tengah - SHEET.bebasLebar / 2,
          -DAPUR.ruang.dalam / 2 + DAPUR.meja.dalam,
          tengah + SHEET.bebasLebar / 2,
          -DAPUR.ruang.dalam / 2 + DAPUR.meja.dalam + SHEET.bebasDalam,
        ),
      );
      if (T) {
        anotasi.push(ukurTegak(kB, wA1 + 8, DAPUR.meja.dalam, 0, atas, `maks. ${angka(SHEET.mejaMaks)} cm`));
        anotasi.push(
          label(
            c.proyeksi(tengah, -DAPUR.ruang.dalam / 2 + DAPUR.meja.dalam + SHEET.bebasDalam / 2, 0),
            `${SHEET.bebasLebar} × ${SHEET.bebasDalam} cm`,
          ),
        );
        anotasi.push(label(titik(kB, tengah, 30, atas + 34), `Bak maks. ${angka(SHEET.bakMaks)} cm`));
      }
      break;
    }
    case "K-04": {
      const atas = 79;
      tambah("kompor-mod", kompor(kB, "aksen", atas), (pA0 + pA1) / 2, by, true);
      const tengah = (pA0 + pA1) / 2;
      const kontrol: Primitif[] = [-21, -7, 7, 21].flatMap((da) =>
        kotak(kB, tengah + da - 3, tengah + da + 3, DAPUR.meja.dalam - 2, DAPUR.meja.dalam + 3, atas - 14, atas - 8, "aksen"),
      );
      tambah("kontrol-mod", kontrol, tengah, by + DAPUR.meja.dalam, true);
      if (T) {
        anotasi.push(ukurTegak(kB, pA1, DAPUR.meja.dalam + 14, 0, atas, rentang(SHEET.mejaMin, SHEET.mejaMaks)));
        anotasi.push(label(titik(kB, tengah, 40, atas + 32), "Tombol di depan"));
      }
      break;
    }
    case "K-05": {
      const daftar = kabinet(kB, mA0, mA1, tMeja, "aksen", "laci");
      tambah("laci-mod", daftar, (mA0 + mA1) / 2, by, true);
      // Satu laci ditarik penuh ke depan.
      const tengah = (mA0 + mA1) / 2;
      const tarik = kotak(kB, mA0 + 4, mA1 - 4, DAPUR.meja.dalam, DAPUR.meja.dalam + 40, 34, 56, "aksen");
      tambah("laci-tarik", tarik, tengah, by + DAPUR.meja.dalam + 40, true);
      if (T) {
        anotasi.push(label(titik(kB, tengah, DAPUR.meja.dalam + 44, 62), "Laci tarik penuh"));
        anotasi.push(label(titik(kB, tengah, 30, tMeja + 30), "Pegangan U atau D"));
      }
      break;
    }
    case "K-06": {
      tambah("kulkas-mod", kulkas(kB, "aksen", true), (kA0 + kA1) / 2, by, true);
      const tengah = (kA0 + kA1) / 2;
      lapisan.push(
        ...zonaLantai(
          c,
          "bebas",
          tengah - SHEET.bebasLebar / 2,
          -DAPUR.ruang.dalam / 2 + DAPUR.kulkas.dalam,
          tengah + SHEET.bebasLebar / 2,
          -DAPUR.ruang.dalam / 2 + DAPUR.kulkas.dalam + SHEET.bebasDalam,
        ),
      );
      if (T) {
        anotasi.push(ukurTegak(kB, kA1 + 8, DAPUR.kulkas.dalam, 0, SHEET.freezerBawahMaks, `${SHEET.freezerBawahMaks} cm`));
        anotasi.push(label(titik(kB, tengah, DAPUR.kulkas.dalam + 4, 28), "Freezer di bawah"));
        anotasi.push(
          label(
            c.proyeksi(tengah, -DAPUR.ruang.dalam / 2 + DAPUR.kulkas.dalam + SHEET.bebasDalam / 2, 0),
            `${SHEET.bebasLebar} × ${SHEET.bebasDalam} cm`,
          ),
        );
      }
      break;
    }
    case "K-08": {
      const sisi: Primitif[] = [...pelat(kB, 72, 100, "aksen"), ...pelat(kB, 86, 100, "aksen")];
      tambah("stopkontak-mod", sisi, 79, by, true);
      const detektor = poligon(
        "atas",
        footprintOval(0, 0, 9, 9, 18).map(([a, u]) => titik(kB, 20 + a, 0, 232 + u)),
        "aksen",
      );
      tambah("detektor-mod", [detektor], 20, by, true);
      if (T) {
        anotasi.push(ukurTegak(kB, 94, 0, SHEET.sakelarMin, SHEET.sakelarMaks, `${rentang(SHEET.sakelarMin, SHEET.sakelarMaks)}*`));
        anotasi.push(label(titik(kB, 20, 0, 252), "Detektor gas atau asap"));
      }
      break;
    }
    default:
      break;
  }
  return { lapisan, anotasi };
}

/** Semua teks label/ukur sebuah gambar (untuk tes: hanya angka yang diizinkan). */
export function teksGambar(hasil: HasilRuang): string[] {
  return hasil.anotasi.flatMap((p) => (p.jenis === "ukur" || p.jenis === "label" ? [p.teks] : []));
}
