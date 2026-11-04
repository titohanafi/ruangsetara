import { VARIAN_MANDI } from "../domain/bergambar";
import { letakDariDenah, tidakTerlihatDariDenah, type HasilDenah } from "../domain/denahPindai";
import { ANGKA_DITINJAU } from "../domain/gambarModifikasi";
import { isi, PERTANYAAN, UI } from "../domain/konten";
import { PERTANYAAN_SHOWER } from "../domain/modifikasi";
import { sudutUntuk } from "../domain/ruang";
import { PratinjauRuangIso3D } from "./PratinjauRuangIso3D";

const T = UI.ruang;
const NAMA_VARIAN: Readonly<Record<string, string>> = T.varian;

/**
 * Ilustrasi isometrik satu pertanyaan di kartu rekomendasi: hanya modifikasi pertanyaan itu yang hijau, lengkap dengan ukurannya.
 * Alternatif dan hack dari teks sheet (mis. pocket door, kursi commode) digambar sebagai gambar tambahan di atas kondisi dasar.
 */
export function GambarModifikasiKartu({ id, denah }: { id: string; denah: HasilDenah }) {
  const letak = letakDariDenah(denah.objek);
  const tidakTerlihat = tidakTerlihatDariDenah(denah.objek);
  const { sudut, semua } = sudutUntuk(id, letak, tidakTerlihat);
  const nama = PERTANYAAN["kamar-mandi"].pertanyaan.find((p) => p.id === id)?.elemen ?? id;
  const gambar = (kunci: string, judul: string, varian?: "pocket" | "commode" | "bangku" | "baskom") => (
    <figure className="mt-4" key={kunci}>
      <figcaption className="label-mikro">{judul}</figcaption>
      <div role="img" aria-label={isi(T.altKartu, { nama })} className="mt-1 rounded-tombol border border-garis bg-putih">
        <PratinjauRuangIso3D
          letak={letak}
          sudutAktif={{ x: sudut }}
          varianShower={denah.varianShower}
          jenisKloset={denah.jenisKloset}
          varianPintu={denah.varianPintu}
          tidakTerlihat={tidakTerlihat}
          modeShower={id === PERTANYAAN_SHOWER && !varian ? "permanen" : "kondisi"}
          modifikasi={varian ? [] : [id]}
          varian={varian}
          tampilkanUkuran
          fokus
          tampilkanSemua={semua}
          kelas="h-72 w-full max-w-md"
        />
      </div>
    </figure>
  );
  return (
    <>
      {gambar(id, T.judulKartu)}
      {(VARIAN_MANDI[id] ?? []).map((v) => gambar(`${id}~${v}`, NAMA_VARIAN[`${id}~${v}`] ?? v, v))}
      <p className="mt-1 text-kecil text-redup">{T.keteranganKartu}</p>
      {ANGKA_DITINJAU.has(id) && <p className="text-kecil text-redup">{T.angkaDitinjau}</p>}
    </>
  );
}
