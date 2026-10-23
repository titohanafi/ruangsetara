// Tipe dan tata letak denah ruangan (tampak atas dan isometrik), disalin dari Transisi (src/domain/pindai.ts).
// Terpisah dari pindai.ts: kontrak pembacaan foto Ruang Setara tidak berubah.

// Denah: tiap benda digambarkan sebagai (dinding yang ditempel) + (posisi di sepanjang dinding itu) — bukan dari
// grid kiri/tengah/kanan x depan/tengah/belakang seperti sebelumnya. Dinding diminta LANGSUNG dari AI (bukan
// ditebak dari zona), supaya tidak ambigu untuk posisi pojok: versi grid lama memaksa kode menebak "pojok kanan
// belakang" itu menempel dinding kanan atau dinding belakang, dan tebakan itu bisa beda untuk tiap benda walau
// sebenarnya salah satunya di dinding kanan dan satunya di dinding belakang (lihat DECISIONS.md).
export const DINDING_DENAH = ["kiri", "kanan", "depan", "belakang"] as const;
export type DindingDenah = (typeof DINDING_DENAH)[number];
export type Dinding = DindingDenah | "tidak_terlihat";
export const DINDING_OBJEK = [...DINDING_DENAH, "tidak_terlihat"] as const;

// Posisi di sepanjang dinding: untuk dinding kiri/kanan dipakai depan/tengah/belakang (seberapa dekat ke pintu);
// untuk dinding depan/belakang dipakai kiri/tengah/kanan (dari sudut pandang orang di pintu). "tengah" dipakai
// untuk keduanya; kata yang tidak relevan dengan dinding yang dipilih diperlakukan sebagai "tengah".
export const POSISI_DI_DINDING = ["kiri", "tengah", "kanan", "depan", "belakang"] as const;
export type PosisiDiDinding = (typeof POSISI_DI_DINDING)[number];

export interface PosisiObjek {
  dinding: Dinding;
  posisi: PosisiDiDinding;
}

/** Sama seperti `PosisiObjek`, tapi dindingnya dijamin bukan "tidak_terlihat" (dipakai untuk tata letak bawaan). */
export interface LetakDenah {
  dinding: DindingDenah;
  posisi: PosisiDiDinding;
}

export const OBJEK_DENAH = ["pintu", "kloset", "wastafel", "area_mandi"] as const;
export type ObjekDenah = (typeof OBJEK_DENAH)[number];

// Jenis shower yang dikenali dari foto. Daftar tertutup: tiap varian punya gambar sendiri (lihat gambarShower.ts),
// dan "tidak_jelas" dipakai bila jenisnya tidak terbaca supaya denah tidak menggambar benda yang tidak ada.
export const VARIAN_SHOWER = ["hand_shower_gantung", "shower_tetap", "ember_gayung", "tidak_jelas"] as const;
export type VarianShower = (typeof VARIAN_SHOWER)[number];

// Jenis kloset dan cara pintu membuka yang dikenali dari foto. Sama seperti varian shower: daftar tertutup, tiap nilai
// punya gambar sendiri (gambarBenda.ts), dan "tidak_jelas" menampilkan penanda netral, bukan tebakan.
export const JENIS_KLOSET = ["duduk", "jongkok", "tidak_jelas"] as const;
export type JenisKloset = (typeof JENIS_KLOSET)[number];
export const VARIAN_PINTU = ["ayun_ke_dalam", "ayun_ke_luar", "geser", "tidak_jelas"] as const;
export type VarianPintu = (typeof VARIAN_PINTU)[number];

// Pintu di dinding depan; wastafel dan kloset sama-sama di dinding belakang, berdampingan (kloset di sisi kanan,
// wastafel di sisi kirinya); area mandi di dinding kanan (dinding yang beda dari kloset, walau sama-sama "di
// pojok kanan belakang" kalau dilihat sebagai zona) pada kedalaman tengah, supaya tidak menumpuk dengan kloset.
// (Dulu sempat dipindah ke "kiri" karena tampilan isometrik cuma pernah menggambar 2 dinding tetap — tapi itu
// salah arah, posisinya jadi tidak sesuai foto asli. Perbaikan sebenarnya ada di DenahKamarMandi.tsx: tampilan
// isometrik sekarang MEMILIH SENDIRI sepasang dinding mana yang digambar solid berdasarkan data benda yang ada,
// jadi posisi bawaan di sini bisa kembali ke yang paling masuk akal menurut tata letak foto, bukan menurut
// dinding mana yang kebetulan digambar.)
/** Posisi bawaan dipakai bila AI tidak melihat objeknya (atau saat "nilai sendiri dari foto", tanpa posisi dari AI). */
export const POSISI_BAWAAN: Record<ObjekDenah, LetakDenah> = {
  pintu: { dinding: "depan", posisi: "kiri" },
  wastafel: { dinding: "belakang", posisi: "kiri" },
  kloset: { dinding: "belakang", posisi: "kanan" },
  area_mandi: { dinding: "kanan", posisi: "tengah" },
};

// Jarak "kiri"/"kanan" (atau "depan"/"belakang") ke tengah sengaja tidak dibuat mepet pojok: dua benda yang sama-sama
// di dinding yang sama biasanya tidak sejauh ujung-ke-ujung dinding (mis. wastafel dan kloset berdampingan, bukan
// di dua ujung ruangan).
const PERSEN_KIRI_KANAN: Record<PosisiDiDinding, number> = { kiri: 28, tengah: 50, kanan: 72, depan: 50, belakang: 50 };
// "depan" = dekat pintu/kamera, digambar di bawah denah; "belakang" = jauh dari pintu, di atas denah.
const PERSEN_DEPAN_BELAKANG: Record<PosisiDiDinding, number> = { depan: 72, tengah: 50, belakang: 28, kiri: 50, kanan: 50 };

/**
 * Fungsi murni: (dinding, posisi) -> persen (kiri, atas) untuk ditempatkan di kontainer relatif. Kata posisi yang
 * tidak relevan dengan dinding yang dipilih (mis. "kiri" untuk dinding "kiri" sendiri) diperlakukan sebagai "tengah"
 * lewat tabel di atas.
 */
export function posisiPersenDenah({ dinding, posisi }: { dinding: DindingDenah; posisi: PosisiDiDinding }): {
  kiri: number;
  atas: number;
} {
  if (dinding === "kiri") return { kiri: 18, atas: PERSEN_DEPAN_BELAKANG[posisi] };
  if (dinding === "kanan") return { kiri: 82, atas: PERSEN_DEPAN_BELAKANG[posisi] };
  if (dinding === "depan") return { kiri: PERSEN_KIRI_KANAN[posisi], atas: 80 };
  return { kiri: PERSEN_KIRI_KANAN[posisi], atas: 20 }; // belakang
}

const URUTAN_POSISI_SEPANJANG_DINDING: Record<DindingDenah, readonly PosisiDiDinding[]> = {
  kiri: ["belakang", "tengah", "depan"],
  kanan: ["belakang", "tengah", "depan"],
  depan: ["kanan", "tengah", "kiri"],
  belakang: ["kanan", "tengah", "kiri"],
};
// Urutan ini menentukan benda mana yang "menang" posisi bila AI kebetulan menjawab dinding DAN posisi yang persis
// sama untuk dua benda; pintu jarang bentrok (dindingnya biasanya unik), kloset dianggap paling tetap (satu titik
// jelas), area mandi paling fleksibel (sudah digambar sebagai zona memanjang, jadi sedikit bergeser sepanjang
// dinding tidak terlihat aneh).
const PRIORITAS_OBJEK: readonly ObjekDenah[] = ["pintu", "kloset", "wastafel", "area_mandi"];

/**
 * Fungsi murni: merapikan penempatan di SUDUT ruangan yang secara perspektif ambigu. Benda di pojok belakang bisa
 * dibaca sebagai "dinding samping, zona belakang" atau "dinding belakang, zona samping", dan bacaan Gemini untuk hal itu
 * berubah-ubah antar foto dan antar ukuran foto yang sama. Aturannya (dites): wastafel dan kloset yang berdampingan hampir
 * selalu menempel pada dinding yang sama, jadi bila yang satu di dinding belakang, yang lain di dinding samping pada
 * zona belakang dipindah ke dinding belakang pada zona sisi itu; dan bila wastafel dan kloset sama-sama di dinding
 * belakang, area mandi yang terbaca di dinding belakang zona kiri atau kanan dipindah ke dinding samping itu.
 */
export function rapikanSudutDenah(objek: Record<ObjekDenah, PosisiObjek>): Record<ObjekDenah, PosisiObjek> {
  const hasil = { ...objek };
  const perabot = ["kloset", "wastafel"] as const;
  for (const id of perabot) {
    const lain = id === "kloset" ? "wastafel" : "kloset";
    const { dinding, posisi } = hasil[id];
    if ((dinding === "kiri" || dinding === "kanan") && posisi === "belakang" && hasil[lain].dinding === "belakang") {
      hasil[id] = { dinding: "belakang", posisi: dinding };
    }
  }
  const { dinding, posisi } = hasil.area_mandi;
  if (
    dinding === "belakang" &&
    (posisi === "kiri" || posisi === "kanan") &&
    hasil.kloset.dinding === "belakang" &&
    hasil.wastafel.dinding === "belakang"
  ) {
    hasil.area_mandi = { dinding: posisi, posisi: "tengah" };
  }
  return hasil;
}

/**
 * Fungsi murni: bila dua benda kebetulan dapat (dinding, posisi) yang PERSIS sama (akan tergambar numpuk), benda
 * dengan prioritas lebih rendah digeser satu langkah di sepanjang dinding yang SAMA, supaya denah tidak pernah
 * menumpuk sempurna apa pun jawaban AI-nya. Dinding tidak pernah diubah oleh fungsi ini (itu sudah pasti dari AI).
 */
export function selesaikanTabrakanDenah(objek: Record<ObjekDenah, PosisiObjek>): Record<ObjekDenah, PosisiObjek> {
  const dipakai = new Set<string>();
  const hasil = { ...objek };
  for (const id of PRIORITAS_OBJEK) {
    const { dinding } = hasil[id];
    let { posisi } = hasil[id];
    if (dinding === "tidak_terlihat") continue;
    let kunci = `${dinding}_${posisi}`;
    while (dipakai.has(kunci)) {
      const urutan = URUTAN_POSISI_SEPANJANG_DINDING[dinding];
      const i = urutan.indexOf(posisi);
      if (i >= urutan.length - 1) break; // sudah ujung dinding, tidak bisa digeser lagi
      posisi = urutan[i + 1];
      kunci = `${dinding}_${posisi}`;
    }
    hasil[id] = { dinding, posisi };
    dipakai.add(kunci);
  }
  return hasil;
}

/** Hasil pembacaan denah dari foto: dinding dan zona tiap benda, plus jenis shower, kloset, dan pintu. */
export interface HasilDenah {
  /** Foto menampilkan kamar mandi; bila false, tidak ada gambar yang dibuat. */
  kamarMandi: boolean;
  objek: Record<ObjekDenah, PosisiObjek>;
  varianShower: VarianShower;
  jenisKloset: JenisKloset;
  varianPintu: VarianPintu;
}

const adalahObjek = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const pilih = <T extends string>(daftar: readonly T[], nilai: unknown, bawaan: T): T =>
  (daftar as readonly unknown[]).includes(nilai) ? (nilai as T) : bawaan;

/**
 * Memeriksa respons fungsi server denah (ditulis tangan agar zod tidak ikut bundel). Nilai asing atau hilang menjadi
 * "tidak jelas" / "tidak terlihat": denah tidak menggambar benda yang tidak terbaca. Null bila bentuknya salah.
 */
export function bacaHasilDenah(x: unknown): HasilDenah | null {
  if (!adalahObjek(x) || typeof x.kamar_mandi !== "boolean") return null;
  const mentah = adalahObjek(x.objek) ? x.objek : {};
  const objek = Object.fromEntries(
    OBJEK_DENAH.map((id) => {
      const o = mentah[id];
      return [
        id,
        {
          dinding: pilih(DINDING_OBJEK, adalahObjek(o) ? o.dinding : undefined, "tidak_terlihat"),
          posisi: pilih(POSISI_DI_DINDING, adalahObjek(o) ? o.posisi : undefined, "tengah"),
        },
      ];
    }),
  ) as Record<ObjekDenah, PosisiObjek>;
  return {
    kamarMandi: x.kamar_mandi,
    objek: selesaikanTabrakanDenah(rapikanSudutDenah(objek)),
    varianShower: pilih(VARIAN_SHOWER, x.varian_shower, "tidak_jelas"),
    jenisKloset: pilih(JENIS_KLOSET, x.jenis_kloset, "tidak_jelas"),
    varianPintu: pilih(VARIAN_PINTU, x.varian_pintu, "tidak_jelas"),
  };
}

/** Letak tiap benda untuk digambar: benda yang tidak terlihat memakai posisi bawaan hanya sebagai tempat (tidak digambar). */
export function letakDariDenah(objek: Record<ObjekDenah, PosisiObjek>): (id: ObjekDenah) => LetakDenah {
  return (id) => {
    const o = objek[id];
    return o.dinding === "tidak_terlihat" ? POSISI_BAWAAN[id] : { dinding: o.dinding, posisi: o.posisi };
  };
}

export const tidakTerlihatDariDenah = (objek: Record<ObjekDenah, PosisiObjek>): ObjekDenah[] =>
  OBJEK_DENAH.filter((id) => objek[id].dinding === "tidak_terlihat");

/** Hasil tiruan untuk mode pengembangan (`VITE_PINDAI_MOCK=true`): posisi bawaan, bukan tebakan AI. */
export const DENAH_TIRUAN: HasilDenah = {
  kamarMandi: true,
  objek: POSISI_BAWAAN,
  varianShower: "hand_shower_gantung",
  jenisKloset: "duduk",
  varianPintu: "ayun_ke_dalam",
};
