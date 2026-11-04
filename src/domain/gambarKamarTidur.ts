// Gambar "setelah modifikasi" untuk kamar tidur (isometrik, hijau = bagian yang diubah). Tata letak TETAP (ilustrasi umum, bukan
// hasil baca foto). Ukuran benda hanya untuk proporsi (`KAMAR_TIDUR`, perkiraan). Angka yang TERTULIS di gambar hanya dari teks
// Modifikasi sheet (B-01..B-10); B-07, B-08, dan B-10 tidak punya angka di teks Modifikasi, jadi tidak menulis angka.
import { DIM } from "./dimensiGambar";
import {
  kotakDunia,
  label,
  lingkaranLantai,
  pelat,
  pintuTetap,
  pivot,
  rentang,
  tuas,
  ukur,
  ukurTegak,
  zonaLantai,
  type HasilRuang,
  type KonteksRuang,
  type Lapisan,
  type PeranBenda as Peran,
} from "./gambarRuang";
import { footprintOval, kotak, poligon, titik, type Kerangka, type Primitif } from "./gambarShower";

/** Ukuran ilustratif kamar tidur (cm). Perkiraan untuk proporsi, BUKAN acuan dan tidak ditulis di gambar; dilaporkan ke peneliti. */
export const KAMAR_TIDUR = {
  ruang: { lebar: 360, dalam: 320, tinggi: 260, tebalDinding: 10 },
  tempatTidur: { lebar: 100, panjang: 200, tinggiKondisi: 70, tinggiModifikasi: 50 },
  lemari: { dalam: 55, tinggi: 200, gantunganModifikasi: 105, gantunganKondisi: 150 },
  nakas: { lebar: 45, dalam: 40, tinggi: 55 },
  letak: {
    tempatTidur: [-130, -30],
    nakas: [-178, -133],
    lemari: [-130, -10],
    pintu: 105,
  },
} as const;

/** Angka dari teks Modifikasi di sheet (hanya yang dipakai di gambar). */
const SHEET = {
  pintuMin: 80,
  tuasMaks: 110,
  ruangPutar: 150,
  jalurMin: 92,
  sisiTempatTidur: 91,
  tinggiMin: 43,
  tinggiMaks: 58,
  gantunganMin: 90,
  gantunganMaks: 120,
};

/** Benda dasar yang diganti oleh gambar modifikasi pertanyaan itu (tidak digambar ganda). */
const DIGANTI: Record<string, "pintu" | "tempatTidur" | "lemari" | "saklar"> = {
  "B-01": "pintu",
  "B-04": "tempatTidur",
  "B-06": "lemari",
  "B-08": "saklar",
};

export function tempatTidur(k: Kerangka, a0: number, a1: number, tinggi: number, peran: Peran): Primitif[] {
  const { panjang } = KAMAR_TIDUR.tempatTidur;
  const kaki = (a: number, n: number) => kotak(k, a, a + 5, n, n + 5, 0, tinggi - 22, peran);
  return [
    ...kaki(a0 + 2, panjang - 7),
    ...kaki(a1 - 7, panjang - 7),
    ...kotak(k, a0, a1, 0, panjang, tinggi - 22, tinggi - 18, peran),
    ...kotak(k, a0, a0 + 4, 0, panjang, 0, tinggi - 22, peran),
    ...kotak(k, a0 + 1, a1 - 1, 0, panjang - 1, tinggi - 18, tinggi, peran),
    ...kotak(k, a0, a1, 0, 5, 0, tinggi + 35, peran),
    ...kotak(k, a0 + 10, a1 - 10, 10, 40, tinggi, tinggi + 8, peran),
  ];
}

export function nakas(k: Kerangka, a0: number, a1: number, peran: Peran): Primitif[] {
  const { dalam, tinggi } = KAMAR_TIDUR.nakas;
  return [
    ...kotak(k, a0, a1, 0, dalam, 0, tinggi - 3, peran),
    ...kotak(k, a0, a1, 0, dalam + 1, tinggi - 3, tinggi, peran),
    { jenis: "garis", dari: titik(k, a0, dalam, tinggi / 2), ke: titik(k, a1, dalam, tinggi / 2), gaya: "tegas", peran },
    ...kotak(k, (a0 + a1) / 2 - 6, (a0 + a1) / 2 + 6, dalam, dalam + 2, tinggi / 2 + 8, tinggi / 2 + 11, peran),
  ];
}

/** Rak dinding kecil dengan dua siku penopang. */
export function rakDinding(k: Kerangka, a0: number, a1: number, u: number, peran: Peran): Primitif[] {
  return [
    ...kotak(k, a0, a1, 0, 18, u, u + 3, peran),
    ...kotak(k, a0 + 4, a0 + 7, 0, 16, u - 9, u, peran),
    ...kotak(k, a1 - 7, a1 - 4, 0, 16, u - 9, u, peran),
  ];
}

/** Lemari pakaian di dinding `k`: `tertutup` dengan dua pintu, atau `terbuka` tanpa pintu dengan batang gantungan setinggi `gantungan`. */
export function lemari(
  k: Kerangka,
  a0: number,
  a1: number,
  peran: Peran,
  mode: "tertutup" | "terbuka",
  gantungan: number = KAMAR_TIDUR.lemari.gantunganKondisi,
): Primitif[] {
  const { dalam, tinggi } = KAMAR_TIDUR.lemari;
  const tengah = (a0 + a1) / 2;
  if (mode === "tertutup") {
    return [
      ...kotak(k, a0, a1, 0, dalam, 0, tinggi, peran),
      { jenis: "garis", dari: titik(k, tengah, dalam, 4), ke: titik(k, tengah, dalam, tinggi - 4), gaya: "tegas", peran },
      ...kotak(k, tengah - 9, tengah - 6, dalam, dalam + 2, 95, 115, peran),
      ...kotak(k, tengah + 6, tengah + 9, dalam, dalam + 2, 95, 115, peran),
    ];
  }
  const hasil: Primitif[] = [
    ...kotak(k, a0, a1, 0, 2, 0, tinggi, peran),
    ...kotak(k, a0, a0 + 3, 0, dalam, 0, tinggi, peran),
    ...kotak(k, a1 - 3, a1, 0, dalam, 0, tinggi, peran),
    ...kotak(k, a0, a1, 0, dalam, tinggi - 3, tinggi, peran),
    ...kotak(k, a0, a1, 0, dalam, 0, 3, peran),
    ...kotak(k, a0 + 3, a1 - 3, dalam / 2 - 1.5, dalam / 2 + 1.5, gantungan, gantungan + 3, peran),
  ];
  const jarak = (a1 - a0 - 16) / 5;
  for (let i = 0; i < 6; i++) {
    const a = a0 + 8 + i * jarak;
    hasil.push(...kotak(k, a - 2, a + 2, dalam / 2 - 9, dalam / 2 + 9, gantungan - 62, gantungan, peran));
  }
  return hasil;
}

/** Kursi toilet portable (commode): dudukan berlubang di atas rangka empat kaki, bersandaran. */
export function kursiToilet(c: KonteksRuang, x: number, y: number, peran: Peran): Primitif[] {
  const s = 21;
  const T = (px: number, py: number, u: number) => c.proyeksi(px, py, u);
  const kaki = (dx: number, dy: number) => kotakDunia(c, x + dx - 2, x + dx + 2, y + dy - 2, y + dy + 2, 0, 42, peran);
  const lubang = poligon(
    "rongga",
    footprintOval(x, y, 11, 11, 20).map(([px, py]) => T(px, py, 46)),
    peran,
  );
  return [
    ...kaki(-s + 2, -s + 2),
    ...kaki(s - 2, -s + 2),
    ...kaki(-s + 2, s - 2),
    ...kaki(s - 2, s - 2),
    ...kotakDunia(c, x - s, x + s, y - s, y + s, 42, 46, peran),
    lubang,
    ...kotakDunia(c, x - s, x + s, y - s, y - s + 3, 46, 78, peran),
  ];
}

/** Lampu malam kecil di dinding `k`, tinggi `u` dari lantai. */
const lampu = (k: Kerangka, a: number, u: number, peran: Peran): Primitif[] => kotak(k, a - 5, a + 5, 0, 5, u, u + 8, peran);

/** Gambar kamar tidur untuk satu pertanyaan (`id`) yang dijawab Tidak; `null` = kondisi dasar tanpa modifikasi. */
export function susunKamarTidur(id: string | null, c: KonteksRuang): HasilRuang {
  const kB = c.kerangka("belakang");
  const kK = c.kerangka("kanan");
  const diganti = id ? DIGANTI[id] : undefined;
  const lapisan: Lapisan[] = [];
  const anotasi: Primitif[] = [];
  const tambah = (nama: string, daftar: Primitif[], x: number, y: number, aksen = false) =>
    lapisan.push({ id: nama, daftar, kedalaman: pivot(c, x, y), aksen });
  const T = c.tampilkanUkuran;
  const { lebar: L, dalam: D } = KAMAR_TIDUR.ruang;
  const [tA0, tA1] = KAMAR_TIDUR.letak.tempatTidur;
  const [nA0, nA1] = KAMAR_TIDUR.letak.nakas;
  const [lA0, lA1] = KAMAR_TIDUR.letak.lemari;
  const pintuPusat = KAMAR_TIDUR.letak.pintu;
  const yBelakang = -D / 2;
  const yKakiTidur = yBelakang + KAMAR_TIDUR.tempatTidur.panjang;
  const kPintu: Kerangka = { ...kK, sepanjang: pintuPusat };
  const xLemari = L / 2 - KAMAR_TIDUR.lemari.dalam;

  // Benda dasar (abu-abu); yang diganti modifikasi digambar ulang hijau di bawah.
  if (diganti !== "tempatTidur")
    tambah("tempatTidur", tempatTidur(kB, tA0, tA1, KAMAR_TIDUR.tempatTidur.tinggiKondisi, "netral"), (tA0 + tA1) / 2, yKakiTidur);
  tambah("nakas", nakas(kB, nA0, nA1, "netral"), (nA0 + nA1) / 2, yBelakang + KAMAR_TIDUR.nakas.dalam);
  if (diganti !== "lemari") tambah("lemari", lemari(kK, lA0, lA1, "netral", "tertutup"), L / 2, (lA0 + lA1) / 2);
  if (diganti !== "pintu") tambah("pintu", pintuTetap(c, "kanan", pintuPusat, "pintu", "netral"), L / 2, pintuPusat);
  if (diganti !== "saklar") {
    // Kondisi contoh: saklar tinggi di dinding belakang, stopkontak rendah.
    tambah("saklar", [...pelat(kB, 110, 140, "netral"), ...pelat(kB, 135, 30, "netral")], 120, yBelakang);
  }

  switch (id) {
    case "B-01": {
      tambah("pintu-mod", pintuTetap(c, "kanan", pintuPusat, "pintu_ayun_luar", "aksen"), L / 2, pintuPusat, true);
      tambah("tuas-mod", tuas(kPintu, 32, 100, "aksen"), L / 2, pintuPusat, true);
      if (T) {
        const s2 = DIM.pintu.bukaanBersih / 2;
        anotasi.push(
          ukur(titik(kPintu, -s2, 10, DIM.pintu.tinggi + 12), titik(kPintu, s2, 10, DIM.pintu.tinggi + 12), `min. ${SHEET.pintuMin} cm`),
        );
        anotasi.push(ukurTegak(kPintu, 60, 10, 0, SHEET.tuasMaks, `maks. ${SHEET.tuasMaks} cm`));
        anotasi.push(label(titik(kPintu, 32, 12, 126), "Gagang tuas"));
      }
      break;
    }
    case "B-02": {
      lapisan.push(...lingkaranLantai(c, "putar", 30, 20, SHEET.ruangPutar / 2));
      if (T) {
        anotasi.push(label(c.proyeksi(30, 20, 0), `ø sekitar ${SHEET.ruangPutar} cm`));
        anotasi.push(ukur(c.proyeksi(xLemari, -75, 0), c.proyeksi(xLemari - SHEET.jalurMin, -75, 0), `min. ${SHEET.jalurMin} cm`));
      }
      break;
    }
    case "B-03": {
      lapisan.push(...zonaLantai(c, "sisi", tA1, yBelakang, tA1 + SHEET.sisiTempatTidur, yKakiTidur));
      if (T) {
        anotasi.push(
          ukur(
            c.proyeksi(tA1, yKakiTidur + 14, 0),
            c.proyeksi(tA1 + SHEET.sisiTempatTidur, yKakiTidur + 14, 0),
            `${SHEET.sisiTempatTidur} cm`,
          ),
        );
        anotasi.push(label(c.proyeksi(tA1 + SHEET.sisiTempatTidur / 2, yBelakang + 100, 0), "Ruang transfer"));
      }
      break;
    }
    case "B-04": {
      const tinggi = KAMAR_TIDUR.tempatTidur.tinggiModifikasi;
      tambah("tempatTidur-mod", tempatTidur(kB, tA0, tA1, tinggi, "aksen"), (tA0 + tA1) / 2, yKakiTidur, true);
      if (T) anotasi.push(ukurTegak(kB, tA1 + 6, KAMAR_TIDUR.tempatTidur.panjang, 0, tinggi, rentang(SHEET.tinggiMin, SHEET.tinggiMaks)));
      break;
    }
    case "B-06": {
      tambah("lemari-mod", lemari(kK, lA0, lA1, "aksen", "terbuka", KAMAR_TIDUR.lemari.gantunganModifikasi), L / 2, (lA0 + lA1) / 2, true);
      if (T) {
        anotasi.push(
          ukurTegak(
            kK,
            lA1 + 12,
            KAMAR_TIDUR.lemari.dalam + 8,
            SHEET.gantunganMin,
            SHEET.gantunganMaks,
            rentang(SHEET.gantunganMin, SHEET.gantunganMaks),
          ),
        );
        anotasi.push(label(titik(kK, (lA0 + lA1) / 2, KAMAR_TIDUR.lemari.dalam + 6, 205), "Gantungan diturunkan"));
      }
      break;
    }
    case "B-07": {
      tambah("rak-mod", rakDinding(kB, nA0 + 2, nA1 - 2, 85, "aksen"), (nA0 + nA1) / 2, yBelakang, true);
      if (T) anotasi.push(label(titik(kB, (nA0 + nA1) / 2, 22, 112), "Rak dinding kecil"));
      break;
    }
    case "B-08": {
      // Saklar dan stopkontak dipindah ke tinggi terjangkau, ditambah saklar kedua di samping tempat tidur.
      const daftar = [...pelat(kB, 110, 105, "aksen"), ...pelat(kB, 135, 45, "aksen"), ...pelat(kB, tA1 + 25, 95, "aksen")];
      tambah("saklar-mod", daftar, 120, yBelakang, true);
      if (T) anotasi.push(label(titik(kB, tA1 + 25, 6, 118), "Saklar kedua di samping tempat tidur"));
      break;
    }
    case "B-10": {
      const lampuDinding = [28, 45].flatMap((y) => lampu(kK, y, 28, "aksen"));
      tambah("lampu-mod", lampuDinding, L / 2, 36, true);
      tambah("saklar-tidur-mod", pelat(kB, tA1 + 25, 95, "aksen"), tA1 + 25, yBelakang, true);
      tambah("kursiToilet-mod", kursiToilet(c, tA1 + 40, yBelakang + 70, "aksen"), tA1 + 40, yBelakang + 70 + 21, true);
      if (T) {
        anotasi.push(label(titik(kK, 36, 8, 50), "Lampu jalur"));
        anotasi.push(label(titik(kB, tA1 + 25, 6, 140), "Saklar dekat tempat tidur"));
        anotasi.push(label(c.proyeksi(tA1 + 40, yBelakang + 70, 30), "Kursi toilet portable", 40, 36));
      }
      break;
    }
    default:
      break;
  }
  return { lapisan, anotasi };
}
