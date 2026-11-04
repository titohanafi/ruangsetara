// Klien pembacaan benda kamar tidur: mengirim SATU foto (yang sudah dikecilkan) ke fungsi server denah kamar tidur.
import { bacaHasilDenahKamarTidur, DENAH_KAMAR_TIDUR_TIRUAN, type HasilDenahKamarTidur } from "../domain/denahKamarTidur";
import { basis64 } from "./foto";

const ALAMAT = (import.meta.env.VITE_DENAH_KAMAR_TIDUR_URL as string | undefined) ?? "/api/denah-kamar-tidur";
const MOCK = import.meta.env.VITE_PINDAI_MOCK === "true";

/** Hasil pembacaan benda kamar tidur, atau null bila gagal: gambar ruang sekadar tidak dibuat, pembacaan checklist tidak terganggu. */
export async function bacaDenahKamarTidur(dataUrl: string): Promise<HasilDenahKamarTidur | null> {
  if (MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return DENAH_KAMAR_TIDUR_TIRUAN;
  }
  try {
    const res = await fetch(ALAMAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gambar: basis64(dataUrl) }),
    });
    if (!res.ok) return null;
    return bacaHasilDenahKamarTidur(await res.json().catch(() => null));
  } catch {
    return null;
  }
}
