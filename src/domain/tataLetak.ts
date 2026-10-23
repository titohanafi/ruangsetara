import { H, titikDinding, W } from "./denahGeometri";
import { DIM } from "./dimensiGambar";
import type { DindingDenah, LetakDenah, ObjekDenah } from "./denahPindai";
import { OBJEK_DENAH } from "./denahPindai";

// Tata letak benda sepanjang dinding dalam cm, supaya benda di satu dinding tidak berdempetan atau menembus tepi dinding.
// Posisi awal (dari persen kasar hasil pindai) dipertahankan sedekat mungkin; hanya digeser bila terlalu dekat.

export interface BendaDinding {
  id: string;
  /** Posisi awal tengah benda sepanjang dinding (cm dari tengah dinding). */
  awal: number;
  /** Setengah lebar benda sepanjang dinding (cm). */
  setengah: number;
}

/** Jarak bebas minimum antar benda di satu dinding (cm, dari tepi ke tepi). */
export const JARAK_BEBAS_BENDA = 25;
/** Jarak minimum tepi benda ke sudut dinding (cm). */
export const JARAK_TEPI_DINDING = 6;

/**
 * Fungsi murni: posisi tengah tiap benda di satu dinding sepanjang `panjang` cm. Benda diurutkan menurut posisi awalnya,
 * pasangan yang berdekatan didorong menjauh sama besar sampai berjarak `JARAK_BEBAS_BENDA`, lalu semuanya dijepit ke
 * dalam dinding. Bila dinding tidak cukup untuk semuanya, jarak dikorbankan lebih dulu daripada menembus dinding.
 */
export function susunSepanjangDinding(benda: BendaDinding[], panjang: number): Record<string, number> {
  const urut = [...benda].sort((a, b) => a.awal - b.awal);
  const batas = (i: number): [number, number] => [
    -panjang / 2 + urut[i].setengah + JARAK_TEPI_DINDING,
    panjang / 2 - urut[i].setengah - JARAK_TEPI_DINDING,
  ];
  // Bila benda dan jarak bebasnya tidak muat di dinding, jangan biarkan semuanya menumpuk di satu ujung: sebar rata
  // menurut urutan (pusat di 1/(2n), 3/(2n), ... panjang dinding), sehingga tumpang tindihnya sekecil dan serata mungkin.
  const kebutuhan = urut.reduce((jumlah, b) => jumlah + 2 * b.setengah, 0) + JARAK_BEBAS_BENDA * (urut.length - 1) + 2 * JARAK_TEPI_DINDING;
  if (urut.length > 1 && kebutuhan > panjang) {
    return Object.fromEntries(urut.map((b, i) => [b.id, -panjang / 2 + ((2 * i + 1) / (2 * urut.length)) * panjang]));
  }
  const pos = urut.map((b) => b.awal);
  for (let lewat = 0; lewat < 12; lewat++) {
    for (let i = 1; i < urut.length; i++) {
      const perlu = urut[i - 1].setengah + urut[i].setengah + JARAK_BEBAS_BENDA;
      const kurang = perlu - (pos[i] - pos[i - 1]);
      if (kurang > 1e-9) {
        pos[i] += kurang / 2;
        pos[i - 1] -= kurang / 2;
      }
    }
    for (let i = 0; i < urut.length; i++) pos[i] = Math.min(Math.max(pos[i], batas(i)[0]), batas(i)[1]);
  }
  return Object.fromEntries(urut.map((b, i) => [b.id, pos[i]]));
}

// Setengah lebar tiap benda sepanjang dindingnya (cm), untuk menjaga jarak antar benda di satu dinding. Kloset: tangki dan
// mangkuk yang bergeser; shower: keran, selang, dan kepala shower di dinding (sekitar 50 cm lebarnya; bilik tidak digambar di lantai).
const SETENGAH_LEBAR: Record<ObjekDenah, number> = {
  pintu: DIM.pintu.bukaanBersih / 2 + 4,
  kloset: 26,
  wastafel: DIM.wastafel.lebarBak / 2,
  area_mandi: 25,
};

/** Ukuran ruang dalam (cm). Bawaan `DIM.ruang`; gambar "setelah modifikasi" boleh lebih luas. */
export interface UkuranRuang {
  lebar: number;
  dalam: number;
}

const panjangDinding = (dinding: DindingDenah, ruang: UkuranRuang = DIM.ruang): number =>
  dinding === "belakang" || dinding === "depan" ? ruang.lebar : ruang.dalam;

/** Titik benda sepanjang dindingnya (cm dari tengah dinding), dari `letak` (dinding dan zona) sebelum penataan jarak. */
export function sepanjangDinding(letak: LetakDenah, ruang: UkuranRuang = DIM.ruang): number {
  const t = titikDinding(letak);
  return t.dinding === "belakang" || t.dinding === "depan" ? ((t.x - W / 2) / W) * ruang.lebar : ((t.y - H / 2) / H) * ruang.dalam;
}

/**
 * Fungsi murni: posisi tengah tiap benda sepanjang dindingnya (cm dari tengah dinding), digeser seperlunya supaya benda di
 * satu dinding tidak berdempetan. Dipakai bersama oleh denah tampak atas dan isometrik, jadi keduanya menempatkan benda
 * persis sama, walau Gemini hanya membaca zona kasar (kiri, tengah, kanan).
 */
export function posisiSepanjang(
  letak: (id: ObjekDenah) => LetakDenah,
  ids: readonly ObjekDenah[] = OBJEK_DENAH,
  ruang: UkuranRuang = DIM.ruang,
): Record<ObjekDenah, number> {
  const perDinding = new Map<DindingDenah, BendaDinding[]>();
  for (const id of ids) {
    const l = letak(id);
    const dinding = titikDinding(l).dinding;
    const daftar = perDinding.get(dinding) ?? [];
    daftar.push({ id, awal: sepanjangDinding(l, ruang), setengah: SETENGAH_LEBAR[id] });
    perDinding.set(dinding, daftar);
  }
  const hasil = {} as Record<ObjekDenah, number>;
  for (const [dinding, daftar] of perDinding) Object.assign(hasil, susunSepanjangDinding(daftar, panjangDinding(dinding, ruang)));
  return hasil;
}

/**
 * Fungsi murni: titik denah tampak atas (satuan viewBox `W` x `H`) tiap benda setelah penataan jarak, dengan koordinat
 * tegak lurus dinding tetap sama seperti `titikDinding`.
 */
export function titikTertata(
  letak: (id: ObjekDenah) => LetakDenah,
  ids: readonly ObjekDenah[] = OBJEK_DENAH,
): Record<ObjekDenah, { x: number; y: number }> {
  const sepanjang = posisiSepanjang(letak, ids);
  return Object.fromEntries(
    ids.map((id) => {
      const t = titikDinding(letak(id));
      const lewatX = t.dinding === "belakang" || t.dinding === "depan";
      return [
        id,
        lewatX
          ? { x: W / 2 + (sepanjang[id] / DIM.ruang.lebar) * W, y: t.y }
          : { x: t.x, y: H / 2 + (sepanjang[id] / DIM.ruang.dalam) * H },
      ];
    }),
  ) as Record<ObjekDenah, { x: number; y: number }>;
}
