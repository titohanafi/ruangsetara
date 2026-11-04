// Registri ruang bertata letak tetap: ukuran ruang, penyusun gambar per pertanyaan, dan gambar yang memuat angka ditinjau.
import { ANGKA_DAPUR_DITINJAU, DAPUR, susunDapur } from "./gambarDapur";
import { KAMAR_TIDUR, susunKamarTidur } from "./gambarKamarTidur";
import type { HasilRuang, KonteksRuang } from "./gambarRuang";
import { MOBILITAS, susunMobilitas } from "./gambarMobilitas";

export interface AturanRuangTetap {
  ruang: { lebar: number; dalam: number; tinggi: number; tebalDinding: number };
  susun: (id: string | null, konteks: KonteksRuang) => HasilRuang;
  /** Gambar yang memuat angka yang masih ditinjau peneliti (tanda * dan keterangan). */
  ditinjau: ReadonlySet<string>;
  /** Kunci teks catatan di `content/ui.json` (bagian ruang). */
  catatan: "catatanDapur" | "catatanKamarTidur" | "catatanMobilitas";
}

export const RUANG_TETAP: Readonly<Record<string, AturanRuangTetap>> = {
  dapur: { ruang: DAPUR.ruang, susun: susunDapur, ditinjau: ANGKA_DAPUR_DITINJAU, catatan: "catatanDapur" },
  "kamar-tidur": { ruang: KAMAR_TIDUR.ruang, susun: susunKamarTidur, ditinjau: new Set(), catatan: "catatanKamarTidur" },
  mobilitas: { ruang: MOBILITAS.ruang, susun: susunMobilitas, ditinjau: new Set(), catatan: "catatanMobilitas" },
};
