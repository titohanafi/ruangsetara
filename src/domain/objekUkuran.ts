// Proporsi ilustrasi skematik tiap benda di denah (tampak atas maupun isometrik) — BUKAN ukuran/jarak kamar mandi
// pengguna sungguhan. AI (Gemini) tidak pernah diminta mengukur apa pun dan tidak pernah memberi angka (lihat
// prompt di `server/pindai.ts`) — angka di sini cuma supaya bentuk pintu/kloset/wastafel/area mandi di gambar
// proporsional dan konsisten antar-benda, satu sumber yang dipakai ulang, bukan data tentang ruangan pengguna.
//
// Diekstrak dari angka yang sudah dipakai `src/components/DenahKamarMandi.tsx` (tampak atas) sebelum refactor ini —
// nilainya tidak berubah, cuma dipindah ke satu tempat supaya tidak lagi terduplikasi/berbeda-beda per tempat pakai.
import type { ObjekDenah } from "./denahPindai";

export interface UkuranPintu {
  panjang: number;
}
export interface UkuranKloset {
  tangki: { w: number; h: number };
  mangkuk: { rx: number; ry: number };
}
export interface UkuranWastafel {
  kotak: { w: number; h: number };
}
export interface UkuranAreaMandi {
  panjangZona: number;
  tebalZona: number;
  jariShower: number;
  panjangPipa: number;
  jarakPojokBelakang: number;
  jarakPojokDepan: number;
}

export const UKURAN_PINTU: UkuranPintu = { panjang: 68 };
export const UKURAN_KLOSET: UkuranKloset = { tangki: { w: 20, h: 34 }, mangkuk: { rx: 22, ry: 27 } };
export const UKURAN_WASTAFEL: UkuranWastafel = { kotak: { w: 36, h: 50 } };
export const UKURAN_AREA_MANDI: UkuranAreaMandi = {
  panjangZona: 150,
  tebalZona: 72,
  jariShower: 10,
  panjangPipa: 8,
  jarakPojokBelakang: 65,
  jarakPojokDepan: 35,
};

/** Fungsi murni: setengah-lebar (sepanjang dinding) dan setengah-dalam (tegak lurus dinding) bounding-box skematik
 *  tiap benda — dipakai untuk pengecekan invariant (lihat tests/denahGeometri.test.ts), bukan untuk menggambar
 *  bentuk detailnya sendiri (itu tetap milik tiap komponen tampak-atas/isometrik). */
export function setengahFootprintObjek(objek: ObjekDenah): { sepanjang: number; dalam: number } {
  switch (objek) {
    case "pintu":
      return { sepanjang: UKURAN_PINTU.panjang / 2, dalam: UKURAN_PINTU.panjang / 2 };
    case "kloset":
      return { sepanjang: UKURAN_KLOSET.mangkuk.rx, dalam: UKURAN_KLOSET.mangkuk.ry };
    case "wastafel":
      return { sepanjang: UKURAN_WASTAFEL.kotak.w / 2, dalam: UKURAN_WASTAFEL.kotak.h / 2 };
    case "area_mandi":
      return { sepanjang: UKURAN_AREA_MANDI.panjangZona / 2, dalam: UKURAN_AREA_MANDI.tebalZona / 2 };
  }
}
