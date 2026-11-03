import { useState } from "react";
import { butirHasil, type PetaJawaban } from "../domain/asesmen";
import { letakDariDenah, tidakTerlihatDariDenah, type HasilDenah } from "../domain/denahPindai";
import { PERTANYAAN, UI } from "../domain/konten";
import { PERTANYAAN_SHOWER, ringkasModifikasi } from "../domain/modifikasi";
import { ruangIdeal, sudutAwal } from "../domain/ruang";
import { PratinjauRuangIso3D } from "./PratinjauRuangIso3D";

const T = UI.ruang;
type Sudut = "kiri" | "kanan";

/** Gambar semua modifikasi dalam satu ruangan, di akhir halaman hasil: bernomor sama dengan kartu, tiap nomor bisa dimatikan. */
export function RingkasanModifikasi({ jawaban, denah, mati, onToggle }: { jawaban: PetaJawaban; denah: HasilDenah; mati: ReadonlySet<string>; onToggle: (id: string) => void }) {
  const letak = letakDariDenah(denah.objek);
  const tidakTerlihat = tidakTerlihatDariDenah(denah.objek);
  const daftar = PERTANYAAN["kamar-mandi"].pertanyaan;
  const ringkas = ringkasModifikasi(daftar, jawaban, denah);
  // Nomor sama dengan nomor kartu di halaman hasil (butir yang perlu perhatian, urutan tampil di kartu).
  const nomor = Object.fromEntries(
    butirHasil(daftar, jawaban)
      .filter((b) => b.status !== "sesuai")
      .map((b, i) => [b.pertanyaan.id, i + 1]),
  );
  const [sudut] = useState<Sudut>(() => sudutAwal(letak, tidakTerlihat));
  const [semua, setSemua] = useState(true);
  if (ringkas.digambar.length === 0) return null;

  const aktif = ringkas.digambar.map((p) => p.id).filter((id) => !mati.has(id));
  const ruang = ruangIdeal(letak, aktif);

  return (
    <section className="mt-8" aria-labelledby="ringkasan-modifikasi">
      <h2 id="ringkasan-modifikasi" className="text-subjudul">
        {T.ringkasanJudul}
      </h2>
      <p className="mt-1 text-redup">{T.ringkasanIsi}</p>

      <div className="kartu mt-3">
        <div role="img" aria-label={T.altIsometrik}>
          <PratinjauRuangIso3D
            letak={letak}
            sudutAktif={{ x: sudut }}
            varianShower={denah.varianShower}
            jenisKloset={denah.jenisKloset}
            varianPintu={denah.varianPintu}
            tidakTerlihat={tidakTerlihat}
            modeShower={aktif.includes(PERTANYAAN_SHOWER) ? "permanen" : "kondisi"}
            modifikasi={aktif}
            ringkas
            nomor={nomor}
            ruang={ruang}
            tampilkanSemua={semua}
            kelas="h-[28rem] w-full max-w-xl"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <label className="flex min-h-sentuh cursor-pointer items-center gap-3 font-semibold">
            <input
              type="checkbox"
              checked={semua}
              onChange={(event) => setSemua(event.target.checked)}
              className="h-5 w-5 accent-utama"
            />
            {T.tampilkanSemua}
          </label>
        </div>
      </div>

      <fieldset className="mt-3">
        <legend className="label-mikro">{T.nomorJudul}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ringkas.digambar.map((p) => {
            const nyala = !mati.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={nyala}
                aria-label={`${nomor[p.id]}. ${p.elemen ?? p.id}`}
                title={p.elemen ?? p.id}
                onClick={() => onToggle(p.id)}
                className={`min-h-sentuh min-w-[44px] rounded-tombol border px-3 text-kecil font-semibold ${nyala ? "border-utama bg-utama text-putih" : "border-garis bg-putih text-tinta"}`}
              >
                {nomor[p.id]}
              </button>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
