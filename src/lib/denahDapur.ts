// Klien pembacaan benda dapur: mengirim SATU foto (yang sudah dikecilkan) ke fungsi server denah dapur.
import { bacaHasilDenahDapur, DENAH_DAPUR_TIRUAN, type HasilDenahDapur } from "../domain/denahDapur";
import { basis64 } from "./foto";

const ALAMAT = (import.meta.env.VITE_DENAH_DAPUR_URL as string | undefined) ?? "/api/denah-dapur";
const MOCK = import.meta.env.VITE_PINDAI_MOCK === "true";

/** Hasil pembacaan benda dapur, atau null bila gagal: gambar ruang sekadar tidak dibuat, pembacaan checklist tidak terganggu. */
export async function bacaDenahDapur(dataUrl: string): Promise<HasilDenahDapur | null> {
  if (MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return DENAH_DAPUR_TIRUAN;
  }
  try {
    const res = await fetch(ALAMAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gambar: basis64(dataUrl) }),
    });
    if (!res.ok) return null;
    return bacaHasilDenahDapur(await res.json().catch(() => null));
  } catch {
    return null;
  }
}
