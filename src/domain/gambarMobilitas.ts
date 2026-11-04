// Gambar "setelah modifikasi" untuk mobilitas di rumah (isometrik, hijau = bagian yang diubah). Mobilitas tidak punya satu ruangan
// tetap, jadi digambar sebagai satu ruang depan contoh dengan pintu, undakan, lemari tanam, meja besar, dan saklar. Tata letak TETAP
// (ilustrasi umum, bukan hasil baca foto). Ukuran benda hanya untuk proporsi (`MOBILITAS`, perkiraan). Angka yang TERTULIS di gambar
// hanya dari teks Modifikasi sheet (G-01..G-09); G-06 dan G-08 tidak punya angka di teks Modifikasi.
import { DIM } from "./dimensiGambar";
import {
  kotakDunia,
  label,
  lingkaranLantai,
  pelat,
  pintuTetap,
  pivot,
  tuas,
  ukur,
  ukurTegak,
  zonaLantai,
  type HasilRuang,
  type KonteksRuang,
  type Lapisan,
  type PeranBenda as Peran,
} from "./gambarRuang";
import { kotak, poligon, titik, type Kerangka, type Primitif } from "./gambarShower";

/** Ukuran ilustratif ruang depan (cm). Perkiraan untuk proporsi, BUKAN acuan dan tidak ditulis di gambar; dilaporkan ke peneliti. */
export const MOBILITAS = {
  ruang: { lebar: 420, dalam: 360, tinggi: 260, tebalDinding: 10 },
  undakan: { tinggi: 20, dalam: 30 },
  lemariTanam: { dalam: 60, tinggi: 220 },
  meja: { tinggi: 75 },
  letak: {
    pintu: -120,
    lemariTanam: [20, 190],
    meja: { x: [0, 120], y: [-60, 20] },
    saklar: 40,
  },
} as const;

/** Angka dari teks Modifikasi di sheet (hanya yang dipakai di gambar). */
const SHEET = {
  jalurMin: 92,
  ruangPutar: 150,
  pintuMin: 80,
  tuasMaks: 110,
  bebas: 152.5,
  rampLebar: 95,
  rampDatar: 120,
  ambangMaks: "1,25",
};

/** Benda dasar yang diganti oleh gambar modifikasi pertanyaan itu (tidak digambar ganda). */
const DIGANTI: Record<string, "pintu" | "undakan" | "meja" | "lemariTanam" | "saklar" | "karpet"> = {
  "G-01": "lemariTanam",
  "G-02": "meja",
  "G-03": "pintu",
  "G-04": "undakan",
  "G-05": "karpet",
  "G-07": "meja",
  "G-08": "saklar",
  "G-09": "pintu",
};

/** Meja besar yang berdiri bebas di lantai (empat kaki dan papan), sebagai contoh furnitur yang menyempitkan jalur. */
export function mejaBesar(c: KonteksRuang, x0: number, x1: number, y0: number, y1: number, peran: Peran): Primitif[] {
  const t = MOBILITAS.meja.tinggi;
  const kaki = (x: number, y: number) => kotakDunia(c, x, x + 6, y, y + 6, 0, t - 4, peran);
  return [
    ...kaki(x0 + 2, y0 + 2),
    ...kaki(x1 - 8, y0 + 2),
    ...kaki(x0 + 2, y1 - 8),
    ...kaki(x1 - 8, y1 - 8),
    ...kotakDunia(c, x0, x1, y0, y1, t - 4, t, peran),
  ];
}

/** Meja lipat yang menempel di dinding kanan (ramping, tidak memakan lantai) dengan dua siku penopang, dan rak gantung di atasnya. */
export function mejaLipatDinding(k: Kerangka, a0: number, a1: number, peran: Peran): Primitif[] {
  const t = MOBILITAS.meja.tinggi;
  return [
    ...kotak(k, a0, a1, 0, 40, t - 3, t, peran),
    ...kotak(k, a0 + 4, a0 + 7, 0, 36, t - 28, t - 3, peran),
    ...kotak(k, a1 - 7, a1 - 4, 0, 36, t - 28, t - 3, peran),
    ...kotak(k, a0 + 10, a1 - 10, 0, 18, 150, 153, peran),
    ...kotak(k, a0 + 14, a0 + 17, 0, 16, 141, 150, peran),
    ...kotak(k, a1 - 17, a1 - 14, 0, 16, 141, 150, peran),
  ];
}

/** Lemari tanam di dinding belakang: kotak penuh dengan dua pintu; `dalam` boleh lebih dangkal pada gambar modifikasi. */
export function lemariTanam(k: Kerangka, a0: number, a1: number, dalam: number, peran: Peran): Primitif[] {
  const tengah = (a0 + a1) / 2;
  return [
    ...kotak(k, a0, a1, 0, dalam, 0, MOBILITAS.lemariTanam.tinggi, peran),
    {
      jenis: "garis",
      dari: titik(k, tengah, dalam, 4),
      ke: titik(k, tengah, dalam, MOBILITAS.lemariTanam.tinggi - 4),
      gaya: "tegas",
      peran,
    },
    ...kotak(k, tengah - 10, tengah - 7, dalam, dalam + 2, 95, 115, peran),
    ...kotak(k, tengah + 7, tengah + 10, dalam, dalam + 2, 95, 115, peran),
  ];
}

/** Undakan di dasar pintu (perbedaan level): balok rendah selebar bukaan pintu. */
export function undakan(c: KonteksRuang, xTengah: number, peran: Peran): Primitif[] {
  const { tinggi, dalam } = MOBILITAS.undakan;
  const y0 = -MOBILITAS.ruang.dalam / 2;
  const s = DIM.pintu.bukaanBersih / 2;
  return kotakDunia(c, xTengah - s, xTengah + s, y0, y0 + dalam, 0, tinggi, peran);
}

/** Ramp: bagian datar di pintu (`datar`), lalu turun dengan kelandaian 1:10 (naik `tinggi`, panjang miring 10 kali) sejauh `miring`. */
export function ramp(c: KonteksRuang, xTengah: number, lebar: number, datar: number, peran: Peran): Primitif[] {
  const tinggi = MOBILITAS.undakan.tinggi;
  const miring = tinggi * 10;
  const y0 = -MOBILITAS.ruang.dalam / 2;
  const [x0, x1] = [xTengah - lebar / 2, xTengah + lebar / 2];
  const P = (x: number, y: number, u: number) => c.proyeksi(x, y, u);
  const yA = y0 + datar;
  const yB = yA + miring;
  return [
    ...kotakDunia(c, x0, x1, y0, yA, 0, tinggi, peran),
    poligon("kiri", [P(x0, yA, tinggi), P(x0, yB, 0), P(x0, yA, 0)], peran),
    poligon("atas", [P(x0, yA, tinggi), P(x1, yA, tinggi), P(x1, yB, 0), P(x0, yB, 0)], peran),
  ];
}

/** Lantai bertekstur (titik-titik kecil di seluruh lantai), seperti keramik anti-licin pada kamar mandi. */
function lantaiTekstur(c: KonteksRuang): Primitif[] {
  const { lebar, dalam } = MOBILITAS.ruang;
  const daftar: Primitif[] = [];
  const jarak = 24;
  let baris = 0;
  for (let y = -dalam / 2 + 10; y <= dalam / 2 - 10; y += jarak, baris++) {
    const geser = baris % 2 === 0 ? 0 : jarak / 2;
    for (let x = -lebar / 2 + 10 + geser; x <= lebar / 2 - 14; x += jarak) {
      daftar.push({ jenis: "garisPoli", titik: [c.proyeksi(x, y, 0), c.proyeksi(x + 4, y, 0)], peran: "aksen" });
    }
  }
  return daftar;
}

/** Gambar mobilitas untuk satu pertanyaan (`id`) yang dijawab Tidak; `null` = kondisi dasar tanpa modifikasi. */
export function susunMobilitas(id: string | null, c: KonteksRuang): HasilRuang {
  const kB = c.kerangka("belakang");
  const kK = c.kerangka("kanan");
  const diganti = id ? DIGANTI[id] : undefined;
  const lapisan: Lapisan[] = [];
  const anotasi: Primitif[] = [];
  const tambah = (nama: string, daftar: Primitif[], x: number, y: number, aksen = false) =>
    lapisan.push({ id: nama, daftar, kedalaman: pivot(c, x, y), aksen });
  const T = c.tampilkanUkuran;
  const { lebar: L, dalam: D } = MOBILITAS.ruang;
  const yB = -D / 2;
  const xPintu = MOBILITAS.letak.pintu;
  const [lA0, lA1] = MOBILITAS.letak.lemariTanam;
  const {
    x: [mX0, mX1],
    y: [mY0, mY1],
  } = MOBILITAS.letak.meja;
  const kPintu: Kerangka = { ...kB, sepanjang: xPintu };
  const yDepanLemari = yB + MOBILITAS.lemariTanam.dalam;
  const aSaklar = MOBILITAS.letak.saklar;

  // Benda dasar (abu-abu); yang diganti modifikasi digambar ulang hijau di bawah.
  if (diganti !== "pintu") tambah("pintu", pintuTetap(c, "belakang", xPintu, "pintu", "netral"), xPintu, yB);
  if (diganti !== "undakan") tambah("undakan", undakan(c, xPintu, "netral"), xPintu, yB + MOBILITAS.undakan.dalam);
  if (diganti !== "lemariTanam")
    tambah("lemariTanam", lemariTanam(kB, lA0, lA1, MOBILITAS.lemariTanam.dalam, "netral"), (lA0 + lA1) / 2, yDepanLemari);
  if (diganti !== "meja") tambah("meja", mejaBesar(c, mX0, mX1, mY0, mY1, "netral"), (mX0 + mX1) / 2, mY1);
  if (diganti !== "saklar") tambah("saklar", [...pelat(kB, aSaklar, 150, "netral"), ...pelat(kB, aSaklar + 25, 30, "netral")], aSaklar, yB);
  if (diganti !== "karpet") tambah("karpet", kotakDunia(c, -80, -20, -100, -50, 0, 1.5, "netral"), -50, -50);

  switch (id) {
    case "G-01": {
      const dalam = MOBILITAS.lemariTanam.dalam / 2;
      tambah("lemariTanam-mod", lemariTanam(kB, lA0, lA1, dalam, "aksen"), (lA0 + lA1) / 2, yB + dalam, true);
      if (T) {
        const x = (mX0 + mX1) / 2;
        const y0 = yB + dalam;
        anotasi.push(ukur(c.proyeksi(x, y0, 0), c.proyeksi(x, y0 + SHEET.jalurMin, 0), `min. ${SHEET.jalurMin} cm`));
        anotasi.push(label(titik(kB, (lA0 + lA1) / 2, dalam + 4, 235), "Lemari tanam dipindah atau dipangkas"));
      }
      break;
    }
    case "G-02": {
      tambah("mejaLipat-mod", mejaLipatDinding(kK, 20, 100, "aksen"), L / 2, 60, true);
      lapisan.push(...lingkaranLantai(c, "putar", -20, 50, SHEET.ruangPutar / 2));
      if (T) {
        anotasi.push(label(c.proyeksi(-20, 50, 0), `ø sekitar ${SHEET.ruangPutar} cm`));
        anotasi.push(ukur(c.proyeksi(60, yDepanLemari, 0), c.proyeksi(60, yDepanLemari + SHEET.jalurMin, 0), `min. ${SHEET.jalurMin} cm`));
        anotasi.push(label(titik(kK, 60, 44, 100), "Meja lipat dinding"));
      }
      break;
    }
    case "G-03": {
      tambah("pintu-mod", pintuTetap(c, "belakang", xPintu, "pintu_ayun_luar", "aksen"), xPintu, yB, true);
      const engsel = [-DIM.pintu.bukaanBersih / 2 - 3, DIM.pintu.bukaanBersih / 2 + 3].flatMap((a) =>
        [20, 150].flatMap((u) => kotak(kPintu, a - 2, a + 2, 0, 5, u, u + 12, "aksen")),
      );
      tambah("engsel-mod", engsel, xPintu, yB, true);
      if (T) {
        const s2 = DIM.pintu.bukaanBersih / 2;
        anotasi.push(
          ukur(titik(kPintu, -s2, 10, DIM.pintu.tinggi + 12), titik(kPintu, s2, 10, DIM.pintu.tinggi + 12), `min. ${SHEET.pintuMin} cm`),
        );
        anotasi.push(label(titik(kPintu, -s2 - 40, 8, 160), "Engsel offset"));
      }
      break;
    }
    case "G-04": {
      tambah("ramp-mod", ramp(c, xPintu, SHEET.rampLebar, SHEET.rampDatar, "aksen"), xPintu, yB + SHEET.rampDatar + 200, true);
      if (T) {
        const x1 = xPintu + SHEET.rampLebar / 2;
        const yA = yB + SHEET.rampDatar;
        anotasi.push(ukur(c.proyeksi(x1 + 14, yB, 0), c.proyeksi(x1 + 14, yA, 0), `datar min. ${SHEET.rampDatar} cm`));
        anotasi.push(
          ukur(c.proyeksi(xPintu - SHEET.rampLebar / 2, yA + 214, 0), c.proyeksi(x1, yA + 214, 0), `min. ${SHEET.rampLebar} cm`),
        );
        anotasi.push(label(c.proyeksi(x1 + 40, yA + 100, 12), "1:10"));
        anotasi.push(label(titik(kPintu, 0, 12, DIM.pintu.tinggi + 14), `Ambang maks. ${SHEET.ambangMaks} cm`));
      }
      break;
    }
    case "G-05": {
      lapisan.push({ id: "lantai-mod", daftar: lantaiTekstur(c), kedalaman: -1e9 + 2, aksen: true });
      if (T) {
        anotasi.push(label(c.proyeksi(-30, 100, 0), "Lantai bertekstur, karpet kecil disingkirkan"));
        anotasi.push(label(c.proyeksi(100, 130, 0), `Sambungan maks. ${SHEET.ambangMaks} cm`));
      }
      break;
    }
    case "G-06": {
      const jalur = [
        c.proyeksi(xPintu, yB + 40, 0),
        c.proyeksi(xPintu, -110, 0),
        c.proyeksi(60, -105, 0),
        c.proyeksi(150, -20, 0),
        c.proyeksi(150, 120, 0),
      ];
      lapisan.push({
        id: "rute-mod",
        daftar: [{ jenis: "garisPoli", titik: jalur, peran: "aksen", putus: true }],
        kedalaman: -1e9 + 3,
        aksen: true,
      });
      if (T) {
        anotasi.push(label(c.proyeksi(60, -105, 0), "Titik tersempit"));
        anotasi.push(label(c.proyeksi(150, 40, 0), "Rute harian"));
      }
      break;
    }
    case "G-07": {
      tambah("mejaLipat-mod", mejaLipatDinding(kK, 20, 100, "aksen"), L / 2, 60, true);
      if (T) {
        anotasi.push(label(titik(kK, 60, 44, 100), "Meja lipat dinding"));
        anotasi.push(label(titik(kK, 60, 22, 170), "Rak gantung"));
      }
      break;
    }
    case "G-08": {
      tambah("saklar-mod", [...pelat(kB, aSaklar, 105, "aksen"), ...pelat(kB, aSaklar + 25, 60, "aksen")], aSaklar, yB, true);
      if (T) anotasi.push(label(titik(kB, aSaklar + 12, 6, 128), "Saklar dan stopkontak di jangkauan"));
      break;
    }
    case "G-09": {
      tambah("pintu-mod", pintuTetap(c, "belakang", xPintu, "pintu_ayun_luar", "aksen"), xPintu, yB, true);
      tambah("tuas-mod", tuas(kPintu, 32, 100, "aksen"), xPintu, yB, true);
      lapisan.push(...zonaLantai(c, "bebas", xPintu - SHEET.bebas / 2, yB, xPintu + SHEET.bebas / 2, yB + SHEET.bebas));
      if (T) {
        anotasi.push(ukurTegak(kPintu, 60, 10, 0, SHEET.tuasMaks, `maks. ${SHEET.tuasMaks} cm`));
        anotasi.push(
          label(
            c.proyeksi(xPintu, yB + SHEET.bebas / 2, 0),
            `${String(SHEET.bebas).replace(".", ",")} × ${String(SHEET.bebas).replace(".", ",")} cm`,
          ),
        );
      }
      break;
    }
    default:
      break;
  }
  return { lapisan, anotasi };
}
