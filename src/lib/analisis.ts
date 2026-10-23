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
function hasilTiruan(areaId: string): HasilFoto {
  const daftar = pertanyaanUntukAI(PERTANYAAN[areaId].pertanyaan, aturanFoto(areaId));
  const aturan = aturanFoto(areaId);
  // Tiruan: pertanyaan ke-1 dan ke-3 dijawab "Tidak", pertanyaan 'bisa' pertama dijawab "Ya", sisanya tidak jelas.
  const pertamaBisa = daftar.find((p) => aturan[p.id] === "bisa")?.id;
  const ids = daftar.map((p) => p.id);
  const contoh: Record<string, { nilai: "ya" | "tidak" | "tidak_jelas"; alasan: string }> = {
    [ids[0]]: { nilai: "tidak", alasan: "Hambatan terlihat jelas (tiruan)" },
    [ids[2]]: { nilai: "tidak", alasan: "Tidak terlihat (tiruan)" },
    ...(pertamaBisa ? { [pertamaBisa]: { nilai: "ya", alasan: "Tampak sesuai (tiruan)" } } : {}),
  };
  return {
    ruang_sesuai: true,
    jawaban: ids.map((id) => ({ id, nilai: contoh[id]?.nilai ?? "tidak_jelas", alasan: contoh[id]?.alasan ?? "Belum terlihat jelas" })),
  };
}

export function areaBisaDipindai(areaId: string | null): boolean {
  return DAFTAR_AREA.find((a) => a.id === areaId)?.bisa_dipindai === true;
}

export async function analisisFoto(dataUrls: string[], areaId: string): Promise<HasilFoto> {
  if (MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return hasilTiruan(areaId);
  }
  let res: Response;
  try {
    res = await fetch(ALAMAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gambar: dataUrls.map(basis64), area: areaId }),
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
