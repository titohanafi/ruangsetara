export const SISI_MAKS = 1024;
export const KUALITAS = 0.7;

/** Ukuran baru dengan sisi terpanjang tidak melebihi `maks`; tidak pernah memperbesar. */
export function ukuranBaru(lebar: number, tinggi: number, maks = SISI_MAKS): { lebar: number; tinggi: number } {
  const skala = Math.min(1, maks / Math.max(lebar, tinggi));
  return { lebar: Math.max(1, Math.round(lebar * skala)), tinggi: Math.max(1, Math.round(tinggi * skala)) };
}

/** Mengecilkan foto di perangkat (tanpa unggah) menjadi data URL JPEG kecil. `File` adalah `Blob`, jadi berkas dari `<input>` tetap cocok. */
export async function kecilkanFoto(berkas: Blob): Promise<string> {
  const bmp = await createImageBitmap(berkas);
  try {
    const { lebar, tinggi } = ukuranBaru(bmp.width, bmp.height);
    const kanvas = document.createElement("canvas");
    kanvas.width = lebar;
    kanvas.height = tinggi;
    const ctx = kanvas.getContext("2d");
    if (!ctx) throw new Error("kanvas tidak tersedia");
    ctx.drawImage(bmp, 0, 0, lebar, tinggi);
    return kanvas.toDataURL("image/jpeg", KUALITAS);
  } finally {
    bmp.close();
  }
}

/** Isi base64 saja dari data URL (tanpa awalan "data:image/jpeg;base64,"). */
export function basis64(dataUrl: string): string {
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}
