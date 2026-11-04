import { ANGKA_DAPUR_DITINJAU, DAPUR, susunDapur } from "../domain/gambarDapur";
import { isi, PERTANYAAN, UI } from "../domain/konten";
import { PratinjauRuangTetap } from "./PratinjauRuangTetap";

const T = UI.ruang;

/** Ilustrasi isometrik satu pertanyaan dapur di kartu rekomendasi: tata letak contoh tetap, bagian modifikasi hijau dengan ukurannya. */
export function GambarDapurKartu({ id }: { id: string }) {
  const nama = PERTANYAAN.dapur.pertanyaan.find((p) => p.id === id)?.elemen ?? id;
  return (
    <figure className="mt-4">
      <figcaption className="label-mikro">{T.judulKartu}</figcaption>
      <div role="img" aria-label={isi(T.altKartuDapur, { nama })} className="mt-1 rounded-tombol border border-garis bg-putih">
        <PratinjauRuangTetap
          ruang={DAPUR.ruang}
          susun={(konteks) => susunDapur(id, konteks)}
          tampilkanUkuran
          fokus
          kelas="h-72 w-full max-w-md"
        />
      </div>
      <p className="mt-1 text-kecil text-redup">{T.keteranganKartu}</p>
      <p className="text-kecil text-redup">{T.catatanDapur}</p>
      {ANGKA_DAPUR_DITINJAU.has(id) && <p className="text-kecil text-redup">{T.angkaDitinjau}</p>}
    </figure>
  );
}
