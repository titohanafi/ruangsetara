// Gambar "setelah modifikasi" untuk dapur (isometrik, hijau = bagian yang diubah). Berbeda dari kamar mandi, tata letak
// dapur TETAP (ilustrasi umum, bukan hasil baca foto): prompt Gemini untuk dapur belum diuji dengan foto asli.
// Ukuran benda hanya untuk proporsi (`DAPUR`, perkiraan). Angka yang TERTULIS di gambar hanya dari teks Modifikasi di sheet
// peneliti (K-01..K-08); angka yang tampak keliru atau masih ditinjau tidak ditulis (lihat `ANGKA_DAPUR_DITINJAU`).
import { DIM } from "./dimensiGambar";
import {
  apar,
  baskom,
  dispenser,
  kabinetAtas,
  keranSemprot,
  keranTuas,
  komporInduksi,
  kursi,
  kursiRoda,
  mejaDorong,
  mejaMakan,
  microwave,
  papanTarik,
  pegboard,
  rakPiring,
  rakTarikTurun,
  rampPortable,
  riceCooker,
  tempatSampah,
  bagKotak,
  urutkanKedalaman,
} from "./perabotUmum";
import { mejaLipatDinding } from "./perabotRuang";
import { footprintOval, kotak, poligon, titik, type Kerangka, type Primitif, type Titik } from "./gambarShower";
import {
  angka,
  garis,
  label,
  pelat,
  pintuTetap,
  pivot,
  rentang,
  ukur,
  ukurTegak,
  zonaLantai,
  type HasilRuang,
  type KonteksRuang,
  type Lapisan,
  type PeranBenda as Peran,
} from "./gambarRuang";

export type { HasilRuang, KonteksRuang, Lapisan };

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
  pintuKanan: { pusat: 70 },
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

/** Alternatif "cara praktis" (hack) di sheet yang digambar pada kondisi dasar: tidak ada benda yang diganti. */
const HACK_DAPUR: ReadonlySet<string> = new Set(["portable", "dorong", "baskom", "induksi", "pegboard", "apar"]);

/** Benda dasar yang diganti oleh gambar modifikasi pertanyaan itu (tidak digambar ganda). */
const DIGANTI: Record<string, "pintu" | "meja" | "wastafel" | "kompor" | "kulkas"> = {
  "K-01": "pintu",
  "K-02": "meja",
  "K-03": "wastafel",
  "K-04": "kompor",
  "K-05": "meja",
  "K-06": "kulkas",
};

const belakang = (c: KonteksRuang): Kerangka => c.kerangka("belakang");
const kanan = (c: KonteksRuang): Kerangka => c.kerangka("kanan");
const xyBelakang = (a: number, n: number): [number, number] => [a, -DAPUR.ruang.dalam / 2 + n];

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
function wastafel(k: Kerangka, peran: Peran, terbuka: boolean, tinggiAtas: number, tanpaKeran = false): Primitif[] {
  const [a0, a1] = DAPUR.letak.wastafel;
  const tengah = (a0 + a1) / 2;
  const hasil: Primitif[] = [];
  if (terbuka) {
    // Kaki papan di sisi luar supaya papan tidak melayang; bagian bawah dibiarkan kosong untuk lutut. Digambar lebih dulu
    // agar papan dan bak berada di atasnya (kaki sisi dekat kamera tidak menutupi bak).
    hasil.push(...kotak(k, a0, a0 + 3, 4, dalamKaki(), 0, tinggiAtas - DAPUR.meja.tebalPapan, peran));
    hasil.push(...kotak(k, a1 - 3, a1, 4, dalamKaki(), 0, tinggiAtas - DAPUR.meja.tebalPapan, peran));
  }
  hasil.push(...kabinet(k, a0, a1, tinggiAtas, peran, terbuka ? "terbuka" : "pintu"));
  const T = (a: number, n: number): Titik => titik(k, a, n, tinggiAtas);
  hasil.push(poligon("rongga", [T(tengah - 28, 14), T(tengah + 28, 14), T(tengah + 28, 46), T(tengah - 28, 46)], peran));
  if (!tanpaKeran) {
    hasil.push(...kotak(k, tengah - 2, tengah + 2, 4, 8, tinggiAtas, tinggiAtas + 22, peran));
    hasil.push(...kotak(k, tengah - 2, tengah + 2, 4, 20, tinggiAtas + 19, tinggiAtas + 22, peran));
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

/** Gambar dapur untuk satu pertanyaan (`id`) yang dijawab Tidak; `null` = kondisi dasar tanpa modifikasi. */
export function susunDapur(id: string | null, c: KonteksRuang): HasilRuang {
  const kB = belakang(c);
  // Id bisa memuat alternatif dari sheet, mis. "K-02~lipat".
  const [kode = null, varian] = id ? id.split("~") : [];
  // Hack dari sheet menambah benda tanpa mengganti benda dasar.
  const hack = varian !== undefined && HACK_DAPUR.has(varian);
  const keluar = (kode === "K-02" && varian === "lipat") || hack;
  const diganti = kode && !keluar && !(kode === "K-05" && varian === "rak") ? DIGANTI[kode] : undefined;
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
  // Kulkas hanya digambar pada pertanyaan K-06 (versi hijau di bawah) dan pada ruang terisi lengkap; tidak semua dapur punya kulkas.
  if (kode === "LENGKAP") tambah("kulkas", kulkas(kB, "netral", false), (kA0 + kA1) / 2, by);
  if (diganti !== "meja") tambah("meja", kabinet(kB, mA0, mA1, tMeja, "netral", "pintu"), (mA0 + mA1) / 2, by);
  if (diganti !== "kompor") tambah("kompor", kompor(kB, "netral", tMeja), (pA0 + pA1) / 2, by);
  if (diganti !== "wastafel") tambah("wastafel", wastafel(kB, "netral", false, tMeja), (wA0 + wA1) / 2, by);
  if (diganti !== "pintu")
    tambah("pintu", pintuTetap(c, "kanan", DAPUR.pintuKanan.pusat, "pintu", "netral"), DAPUR.ruang.lebar / 2, DAPUR.pintuKanan.pusat);

  switch (kode) {
    case "K-01": {
      if (varian === "portable") {
        // Hack sheet: ramp ambang karet portable di dasar pintu.
        const kPintu = { ...kanan(c), sepanjang: DAPUR.pintuKanan.pusat };
        tambah("ramp-hack", rampPortable(kPintu, "aksen"), DAPUR.ruang.lebar / 2, DAPUR.pintuKanan.pusat + 30, true);
        if (T) anotasi.push(label(titik(kPintu, 0, 70, 20), "Ramp ambang portable"));
        break;
      }
      const kK = kanan(c);
      const { pusat } = DAPUR.pintuKanan;
      const lebar = DIM.pintu.bukaanBersih;
      tambah("pintu-mod", pintuTetap(c, "kanan", pusat, "pintu_tanpa_daun", "aksen"), DAPUR.ruang.lebar / 2, pusat, true);
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
      if (varian === "dorong") {
        // Hack sheet: meja dorong setinggi kursi roda.
        const geser = { ...kB, sepanjang: -110, bidang: kB.bidang + 90 };
        tambah("dorong-hack", mejaDorong(geser, "aksen"), -110, by + 130, true);
        if (T) anotasi.push(label(titik(geser, 0, 20, 100), "Meja dorong"));
        break;
      }
      if (varian === "lipat") {
        // Alternatif sheet: permukaan lipat di dinding.
        const kKanan = kanan(c);
        tambah("lipat-mod", mejaLipatDinding(kKanan, -60, 20, "aksen"), DAPUR.ruang.lebar / 2, -20, true);
        if (T) anotasi.push(label(titik(kKanan, -20, 44, 100), "Permukaan lipat di dinding"));
        break;
      }
      if (varian === "papan") {
        // Alternatif sheet: papan tarik di bawah meja.
        tambah("meja-mod", papanTarik({ ...kB, sepanjang: (mA0 + mA1) / 2 }, "aksen"), (mA0 + mA1) / 2, by + 80, true);
        if (T) anotasi.push(label(titik(kB, (mA0 + mA1) / 2, 84, 60), "Papan tarik di bawah meja"));
        break;
      }
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
      if (varian === "baskom") {
        // Hack sheet: cuci di baskom di meja rendah.
        const alas = { ...kB, sepanjang: (mA0 + mA1) / 2 };
        tambah("baskom-hack", baskom(alas, "aksen", tMeja), (mA0 + mA1) / 2, by + 30, true);
        if (T) anotasi.push(label(titik(alas, 0, 24, tMeja + 36), "Baskom di meja rendah"));
        break;
      }
      const atas = 84;
      const tengah = (wA0 + wA1) / 2;
      tambah("wastafel-mod", wastafel(kB, "aksen", true, atas, true), tengah, by, true);
      // Keran diganti keran tuas, atau keran semprot tarik (alternatif sheet).
      const kKeran = { ...kB, sepanjang: tengah };
      tambah("keran-mod", varian === "semprot" ? keranSemprot(kKeran, "aksen", atas) : keranTuas(kKeran, "aksen", atas), tengah, by, true);
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
        anotasi.push(label(titik(kB, tengah, 30, atas + 78), varian === "semprot" ? "Keran semprot tarik" : "Keran tuas"));
      }
      break;
    }
    case "K-04": {
      if (varian === "induksi") {
        // Hack sheet: kompor induksi portable dengan tombol di depan, di meja rendah.
        const alas = { ...kB, sepanjang: (mA0 + mA1) / 2 };
        tambah("induksi-hack", komporInduksi(alas, "aksen", tMeja), (mA0 + mA1) / 2, by + 30, true);
        if (T) anotasi.push(label(titik(alas, 0, 20, tMeja + 24), "Kompor induksi portable"));
        break;
      }
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
      if (varian === "pegboard") {
        // Hack sheet: pegboard setinggi pinggang.
        const alas = { ...kB, sepanjang: (mA0 + mA1) / 2 };
        tambah("pegboard-hack", pegboard(alas, "aksen"), (mA0 + mA1) / 2, by, true);
        if (T) anotasi.push(label(titik(alas, 0, 20, 175), "Pegboard"));
        break;
      }
      if (varian === "rak") {
        // Alternatif sheet: rak tarik turun.
        tambah("rak-mod", rakTarikTurun({ ...kB, sepanjang: (mA0 + mA1) / 2 }, "aksen"), (mA0 + mA1) / 2, by + 40, true);
        if (T) anotasi.push(label(titik(kB, (mA0 + mA1) / 2, 44, 215), "Rak tarik turun"));
        break;
      }
      const daftar = kabinet(kB, mA0, mA1, tMeja, "aksen", "laci");
      tambah("laci-mod", daftar, (mA0 + mA1) / 2, by, true);
      // Satu laci ditarik penuh ke depan.
      const tengah = (mA0 + mA1) / 2;
      // Laci terbuka selebar muka laci (mA0 sampai mA1): dasar, dinding sisi, dinding depan bergagang, dan beberapa barang.
      const d0 = DAPUR.meja.dalam;
      const d1 = d0 + 40;
      const tarik = urutkanKedalaman(kB, [
        bagKotak(kB, mA0, mA1, d0, d1, 34, 37, "aksen"),
        bagKotak(kB, mA0, mA0 + 3, d0, d1, 37, 54, "aksen"),
        bagKotak(kB, mA1 - 3, mA1, d0, d1, 37, 54, "aksen"),
        bagKotak(kB, mA0 + 3, mA1 - 3, d0, d0 + 3, 37, 54, "aksen"),
        bagKotak(kB, mA0 + 8, mA0 + 24, d0 + 6, d0 + 20, 37, 52, "aksen"),
        bagKotak(kB, mA0 + 30, mA0 + 48, d0 + 14, d0 + 30, 37, 47, "aksen"),
        bagKotak(kB, mA1 - 26, mA1 - 10, d0 + 4, d0 + 18, 37, 58, "aksen"),
        bagKotak(kB, mA0 + 3, mA1 - 3, d1 - 3, d1, 34, 54, "aksen"),
        bagKotak(kB, (mA0 + mA1) / 2 - 7, (mA0 + mA1) / 2 + 7, d1, d1 + 3, 44, 47, "aksen"),
      ]);
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
      if (varian === "apar") {
        // Hack sheet: siapkan APAR kecil.
        const celah = { ...kB, sepanjang: 80 };
        tambah("apar-hack", apar(celah, "aksen"), 80, by + 10, true);
        if (T) anotasi.push(label(titik(celah, 0, 20, 65), "APAR kecil"));
        break;
      }
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
    case "LENGKAP": {
      // Dapur terisi lengkap (perabot umum bukan dari sheet, ditambah kursi roda sebagai acuan skala); tanpa bagian hijau.
      const di = (a: number, tambahan: Partial<Kerangka> = {}): Kerangka => ({ ...kB, sepanjang: a, ...tambahan });
      const maju = (y: number) => kB.bidang + (y - xyBelakang(0, 0)[1]);
      tambah("kabinetAtas", kabinetAtas(di((mA0 + mA1) / 2), "netral"), (mA0 + mA1) / 2, by);
      tambah("rakPiring", rakPiring(di((wA0 + wA1) / 2), "netral"), (wA0 + wA1) / 2, by);
      tambah("microwave", microwave(di(-150), "netral", tMeja), -150, by + 5);
      tambah("riceCooker", riceCooker(di(-108), "netral", tMeja), -108, by + 5);
      tambah("tempatSampah", tempatSampah(di(80), "netral"), 80, by + 5);
      tambah("mejaMakan", mejaMakan(di(-20, { bidang: maju(40) }), "netral"), -20, 120);
      tambah("kursi-1", kursi(di(-50, { bidang: maju(-5) }), "netral"), -50, 37);
      tambah("kursi-2", kursi(di(10, { bidang: maju(-5) }), "netral"), 10, 37);
      tambah("dispenser", dispenser({ ...kanan(c), sepanjang: 135 }, "netral"), DAPUR.ruang.lebar / 2, 135);
      tambah("kursiRoda", kursiRoda(di(105, { bidang: maju(55) }), "netral"), 105, 100);
      break;
    }
    default:
      break;
  }
  return { lapisan, anotasi };
}
