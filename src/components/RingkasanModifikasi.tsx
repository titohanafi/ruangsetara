import { useState } from "react";
import { butirHasil, type PetaJawaban } from "../domain/asesmen";
import { letakDariDenah, tidakTerlihatDariDenah, type HasilDenah } from "../domain/denahPindai";
import { BERGAMBAR } from "../domain/bergambar";
import { DIM } from "../domain/dimensiGambar";
import { isi, PERTANYAAN, UI } from "../domain/konten";
import { PERTANYAAN_SHOWER, ringkasModifikasi } from "../domain/modifikasi";
import { ruangIdeal, sudutAwal } from "../domain/ruang";
import { bendaTersembunyi, PratinjauRuangIso3D } from "./PratinjauRuangIso3D";

const T = UI.ruang;
type Sudut = "kiri" | "kanan";

// Zona di lantai (ruang putar, area bebas, keramik) mati dulu di ringkasan supaya tidak menyilang dengan benda lain; menyala lewat nomornya.
const ZONA_LANTAI = ["M-02", "M-03", "M-09"];

const daftarNama = (daftar: { elemen: string | null; id: string }[]): string => daftar.map((p) => p.elemen ?? p.id).join(", ");

/** Gambar semua modifikasi dalam satu ruangan, di akhir halaman hasil: bernomor sama dengan kartu, tiap nomor bisa dimatikan. */
export function RingkasanModifikasi({ jawaban, denah }: { jawaban: PetaJawaban; denah: HasilDenah }) {
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
  const [sudut, setSudut] = useState<Sudut>(() => sudutAwal(letak, tidakTerlihat));
  const [semua, setSemua] = useState(false);
  const [mati, setMati] = useState<ReadonlySet<string>>(() => new Set(ZONA_LANTAI));
  if (ringkas.digambar.length === 0) return null;

  const aktif = ringkas.digambar.map((p) => p.id).filter((id) => !mati.has(id));
  const ruang = ruangIdeal(letak, aktif);
  const diperluas = ruang.lebar !== DIM.ruang.lebar || ruang.dalam !== DIM.ruang.dalam;
  const sembunyi = semua ? [] : bendaTersembunyi(letak, sudut, tidakTerlihat);
  const dariSudut = ringkas.digambar.filter((p) => {
    const perlu = p.id === PERTANYAAN_SHOWER ? (["area_mandi"] as const) : (BERGAMBAR[p.id] ?? []);
    return aktif.includes(p.id) && perlu.length > 0 && perlu.every((o) => sembunyi.includes(o) || tidakTerlihat.includes(o));
  });
  const ganti = (id: string) =>
    setMati((lama) => {
      const baru = new Set(lama);
      if (baru.has(id)) baru.delete(id);
      else baru.add(id);
      return baru;
    });

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
          <button type="button" className="tombol-tipis" onClick={() => setSudut(sudut === "kanan" ? "kiri" : "kanan")}>
            {T.putar}
          </button>
          <button type="button" className="tombol-tipis" aria-pressed={semua} onClick={() => setSemua(!semua)}>
            {semua ? T.sembunyikanLagi : T.tampilkanSemua}
          </button>
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
                onClick={() => ganti(p.id)}
                className={`min-h-sentuh rounded-tombol border px-3 text-kecil font-semibold ${nyala ? "border-utama bg-utama text-putih" : "border-garis bg-putih text-tinta"}`}
              >
                {nomor[p.id]}. {p.elemen ?? p.id}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-kecil text-redup">{T.legenda}</p>
        {ZONA_LANTAI.some((id) => ringkas.digambar.some((p) => p.id === id)) && <p className="mt-1 text-kecil text-redup">{T.zonaMati}</p>}
        {diperluas && (
          <p className="mt-1 text-kecil text-redup">
            {isi(T.ruangDiperluas, { lebar: String(ruang.lebar).replace(".", ","), dalam: String(ruang.dalam).replace(".", ",") })}
          </p>
        )}
        {dariSudut.length > 0 && <p className="mt-1 text-kecil text-redup">{isi(T.tersembunyiSudut, { daftar: daftarNama(dariSudut) })}</p>}
        {ringkas.bendaTakTerlihat.length > 0 && (
          <p className="mt-1 text-kecil text-redup">{isi(T.bendaTakTerlihat, { daftar: daftarNama(ringkas.bendaTakTerlihat) })}</p>
        )}
      </fieldset>
      <p className="mt-2 text-kecil text-redup">{T.catatan}</p>
      <p className="mt-1 text-kecil text-info">✦ {T.dariFoto}</p>
    </section>
  );
}
