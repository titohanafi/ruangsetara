// Klien pembacaan tata letak kamar mandi: mengirim SATU foto (yang sudah dikecilkan) ke fungsi server denah.
import { bacaHasilDenah, DENAH_TIRUAN, type HasilDenah } from "../domain/denahPindai";
import { basis64 } from "./foto";

const ALAMAT = (import.meta.env.VITE_DENAH_URL as string | undefined) ?? "/api/denah";
const MOCK = import.meta.env.VITE_PINDAI_MOCK === "true";

/** Hasil pembacaan denah, atau null bila gagal: gambar ruang sekadar tidak dibuat, pembacaan checklist tidak terganggu. */
export async function bacaDenah(dataUrl: string): Promise<HasilDenah | null> {
  if (MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return DENAH_TIRUAN;
  }
  try {
    const res = await fetch(ALAMAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gambar: basis64(dataUrl) }),
    });
    if (!res.ok) return null;
    return bacaHasilDenah(await res.json().catch(() => null));
  } catch {
    return null;
  }
}
