// Klien pembacaan foto: mengirim foto yang sudah dikecilkan ke fungsi server dan memvalidasi jawabannya.
import { aturanFoto, DAFTAR_AREA, PERTANYAAN } from "../domain/konten";
import { bacaHasilFoto, pertanyaanUntukAI, type HasilFoto } from "../domain/pindai";
import { basis64 } from "./foto";

export class GalatAnalisis extends Error {
  constructor(public kode: "sering" | "gagal") {
    super(kode);
  }
}

// Alamat fungsi server; bisa diganti lewat VITE_ANALISIS_URL saat menguji dengan server lokal terpisah.
const ALAMAT = (import.meta.env.VITE_ANALISIS_URL as string | undefined) ?? "/api/analisis";
const MOCK = import.meta.env.VITE_PINDAI_MOCK === "true";

/** Hasil tiruan untuk `VITE_PINDAI_MOCK=true npm run dev`: tanpa Gemini, tanpa kunci API, tanpa kuota. */
function hasilTiruan(): HasilFoto {
  const ids = pertanyaanUntukAI(PERTANYAAN["kamar-mandi"].pertanyaan, aturanFoto("kamar-mandi")).map((p) => p.id);
  const contoh: Record<string, { nilai: "ya" | "tidak" | "tidak_jelas"; alasan: string }> = {
    "M-05": { nilai: "tidak", alasan: "Tidak terlihat pegangan di dekat kloset" },
    "M-06": { nilai: "tidak", alasan: "Wastafel berkabinet, ruang kaki tertutup" },
    "M-08": { nilai: "tidak", alasan: "Ada bibir di area mandi" },
    "M-09": { nilai: "ya", alasan: "Lantai tampak bertekstur kasar" },
  };
  return {
    kamar_mandi: true,
    jawaban: ids.map((id) => ({ id, nilai: contoh[id]?.nilai ?? "tidak_jelas", alasan: contoh[id]?.alasan ?? "Belum terlihat jelas" })),
  };
}

export function areaBisaDipindai(areaId: string | null): boolean {
  return DAFTAR_AREA.find((a) => a.id === areaId)?.bisa_dipindai === true;
}

export async function analisisFoto(dataUrls: string[]): Promise<HasilFoto> {
  if (MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return hasilTiruan();
  }
  let res: Response;
  try {
    res = await fetch(ALAMAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gambar: dataUrls.map(basis64) }),
    });
  } catch {
    throw new GalatAnalisis("gagal");
  }
  if (res.status === 429) throw new GalatAnalisis("sering");
  if (!res.ok) throw new GalatAnalisis("gagal");
  const hasil = bacaHasilFoto(await res.json().catch(() => null));
  if (!hasil) throw new GalatAnalisis("gagal");
  return hasil;
}
