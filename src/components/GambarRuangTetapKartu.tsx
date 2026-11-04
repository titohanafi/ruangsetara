import { VARIAN_TETAP } from "../domain/bergambarTetap";
import { RUANG_TETAP } from "../domain/gambarRuangTetap";
import { cariArea, isi, PERTANYAAN, UI } from "../domain/konten";
import { PratinjauRuangTetap } from "./PratinjauRuangTetap";

const T = UI.ruang;
const NAMA_VARIAN: Readonly<Record<string, string>> = T.varian;

/**
 * Ilustrasi isometrik satu pertanyaan (dapur, kamar tidur, mobilitas) di kartu rekomendasi: tata letak contoh tetap, bagian
 * modifikasi hijau dengan ukurannya. Alternatif dari teks Modifikasi sheet (mis. tirai) digambar sebagai gambar tambahan.
 */
export function GambarRuangTetapKartu({ areaId, id }: { areaId: string; id: string }) {
  const aturan = RUANG_TETAP[areaId];
  if (!aturan) return null;
  const nama = PERTANYAAN[areaId]?.pertanyaan.find((p) => p.id === id)?.elemen ?? id;
  const namaRuang = (cariArea(areaId)?.nama ?? areaId).toLowerCase();
  const gambar = (kunci: string, judul: string) => (
    <figure className="mt-4" key={kunci}>
      <figcaption className="label-mikro">{judul}</figcaption>
      <div
        role="img"
        aria-label={isi(T.altKartuRuang, { ruang: namaRuang, nama })}
        className="mt-1 rounded-tombol border border-garis bg-putih"
      >
        <PratinjauRuangTetap
          ruang={aturan.ruang}
          susun={(konteks) => aturan.susun(kunci, konteks)}
          tampilkanUkuran
          fokus
          kelas="h-72 w-full max-w-md"
        />
      </div>
    </figure>
  );
  return (
    <>
      {gambar(id, T.judulKartu)}
      {(VARIAN_TETAP[id] ?? []).map((kunci) => gambar(kunci, NAMA_VARIAN[kunci] ?? kunci))}
      <p className="mt-1 text-kecil text-redup">{T.keteranganKartu}</p>
      <p className="text-kecil text-redup">{T[aturan.catatan]}</p>
      {aturan.ditinjau.has(id) && <p className="text-kecil text-redup">{T.angkaDitinjau}</p>}
    </>
  );
}
