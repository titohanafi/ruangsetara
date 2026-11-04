// Klien pembacaan benda area mobilitas: mengirim SATU foto (yang sudah dikecilkan) ke fungsi server denah area mobilitas.
import { bacaHasilDenahMobilitas, DENAH_MOBILITAS_TIRUAN, type HasilDenahMobilitas } from "../domain/denahMobilitas";
import { basis64 } from "./foto";

const ALAMAT = (import.meta.env.VITE_DENAH_MOBILITAS_URL as string | undefined) ?? "/api/denah-mobilitas";
const MOCK = import.meta.env.VITE_PINDAI_MOCK === "true";

/** Hasil pembacaan benda area mobilitas, atau null bila gagal: gambar ruang sekadar tidak dibuat, pembacaan checklist tidak terganggu. */
export async function bacaDenahMobilitas(dataUrl: string): Promise<HasilDenahMobilitas | null> {
  if (MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return DENAH_MOBILITAS_TIRUAN;
  }
  try {
    const res = await fetch(ALAMAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gambar: basis64(dataUrl) }),
    });
    if (!res.ok) return null;
    return bacaHasilDenahMobilitas(await res.json().catch(() => null));
  } catch {
    return null;
  }
}
