import data from "../../content/ukuran-aksesibel.json";

interface NilaiUkuran {
  rujukan: string;
  dibaca_dari_gambar: boolean;
  nilai_cm?: number;
  min_cm?: number;
  maks_cm?: number;
  lebar_cm?: number;
  panjang_cm?: number;
}
interface UkuranAksesibel {
  entri: { id: string; status_validasi: "draf" | "ditinjau_ahli" | "disetujui"; nilai: NilaiUkuran[] }[];
}

export const UKURAN_AKSESIBEL = data as unknown as UkuranAksesibel;

export type KunciNilai = "nilai_cm" | "min_cm" | "maks_cm" | "lebar_cm" | "panjang_cm";

// Permen PUPR diutamakan (aturan Indonesia); ADA hanya dipakai bila PerMen tidak punya angkanya; sumber lain terakhir.
const URUTAN_RUJUKAN = ["permen_pupr_14_2017", "ada_2010"];
const prioritas = (rujukan: string): number => {
  const i = URUTAN_RUJUKAN.indexOf(rujukan);
  return i === -1 ? URUTAN_RUJUKAN.length : i;
};

export interface NilaiAcuan {
  cm: number;
  rujukan: string;
  dibacaDariGambar: boolean;
  statusValidasi: "draf" | "ditinjau_ahli" | "disetujui";
}

/** Fungsi murni: angka acuan untuk satu ukuran, dari rujukan dengan prioritas tertinggi yang punya angka itu. */
export function nilaiAcuan(id: string, kunci: KunciNilai, tabel: UkuranAksesibel = UKURAN_AKSESIBEL): NilaiAcuan | null {
  const entri = tabel.entri.find((e) => e.id === id);
  if (!entri) return null;
  const urut = [...entri.nilai].sort((a, b) => prioritas(a.rujukan) - prioritas(b.rujukan));
  for (const n of urut) {
    const cm = n[kunci];
    if (typeof cm === "number")
      return { cm, rujukan: n.rujukan, dibacaDariGambar: n.dibaca_dari_gambar, statusValidasi: entri.status_validasi };
  }
  return null;
}
