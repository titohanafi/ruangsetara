import { letakDariDenah, tidakTerlihatDariDenah, type HasilDenah } from "../domain/denahPindai";
import { ANGKA_DITINJAU } from "../domain/gambarModifikasi";
import { isi, PERTANYAAN, UI } from "../domain/konten";
import { PERTANYAAN_SHOWER } from "../domain/modifikasi";
import { sudutUntuk } from "../domain/ruang";
import { PratinjauRuangIso3D } from "./PratinjauRuangIso3D";

const T = UI.ruang;

/** Ilustrasi isometrik satu pertanyaan di kartu rekomendasi: hanya modifikasi pertanyaan itu yang hijau, lengkap dengan ukurannya. */
export function GambarModifikasiKartu({ id, denah }: { id: string; denah: HasilDenah }) {
  const letak = letakDariDenah(denah.objek);
  const tidakTerlihat = tidakTerlihatDariDenah(denah.objek);
  const { sudut, semua } = sudutUntuk(id, letak, tidakTerlihat);
  const nama = PERTANYAAN["kamar-mandi"].pertanyaan.find((p) => p.id === id)?.elemen ?? id;
  return (
    <figure className="mt-4">
      <figcaption className="label-mikro">{T.judulKartu}</figcaption>
      <div role="img" aria-label={isi(T.altKartu, { nama })} className="mt-1 rounded-tombol border border-garis bg-putih">
        <PratinjauRuangIso3D
          letak={letak}
          sudutAktif={{ x: sudut }}
          varianShower={denah.varianShower}
          jenisKloset={denah.jenisKloset}
          varianPintu={denah.varianPintu}
          tidakTerlihat={tidakTerlihat}
          modeShower={id === PERTANYAAN_SHOWER ? "permanen" : "kondisi"}
          modifikasi={[id]}
          tampilkanUkuran
          fokus
          tampilkanSemua={semua}
          kelas="h-72 w-full max-w-md"
        />
      </div>
      <p className="mt-1 text-kecil text-redup">{T.keteranganKartu}</p>
      {ANGKA_DITINJAU.has(id) && <p className="text-kecil text-redup">{T.angkaDitinjau}</p>}
    </figure>
  );
}
