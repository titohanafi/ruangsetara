// Memeriksa seluruh konten di content/: bentuk (zod) dan konsistensi antarberkas. Dijalankan oleh `npm run validasi` dan `npm run build`.
import { DAFTAR_AREA, PERTANYAAN, aturanFoto } from "../src/domain/konten";

const galat: string[] = [];

for (const area of DAFTAR_AREA) {
  const berkas = PERTANYAAN[area.id];
  if (!berkas) {
    galat.push(`area ${area.id}: tidak ada berkas pertanyaan`);
    continue;
  }
  const ids = berkas.pertanyaan.map((p) => p.id);
  if (new Set(ids).size !== ids.length) galat.push(`area ${area.id}: ada id pertanyaan ganda`);
  for (const p of berkas.pertanyaan) {
    if (!p.hack && !p.modifikasi) galat.push(`${p.id}: tidak punya rekomendasi (hack maupun modifikasi)`);
  }
  const aturan = aturanFoto(area.id);
  if (area.bisa_dipindai) {
    for (const id of ids) if (!aturan[id]) galat.push(`${id}: area bisa dipindai tapi aturan foto belum diisi di content/pindai.json`);
  }
  for (const id of Object.keys(aturan)) if (!ids.includes(id)) galat.push(`content/pindai.json: id ${id} tidak ada di area ${area.id}`);
}

if (galat.length) {
  console.error(galat.map((g) => `- ${g}`).join("\n"));
  process.exit(1);
}
console.log(`Konten valid: ${DAFTAR_AREA.length} area, ${DAFTAR_AREA.reduce((n, a) => n + PERTANYAAN[a.id].pertanyaan.length, 0)} pertanyaan.`);
