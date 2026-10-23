import { useState } from "react";
import type { PetaJawaban } from "../domain/asesmen";
import { letakDariDenah, tidakTerlihatDariDenah, type HasilDenah } from "../domain/denahPindai";
import type { ModeGambar } from "../domain/gambarShower";
import { modeTersedia, perluPenyesuaianShower, sudutAwal } from "../domain/ruang";
import { UI } from "../domain/konten";
import { DenahTampakAtas } from "./DenahTampakAtas";
import { PratinjauRuangIso3D } from "./PratinjauRuangIso3D";

const T = UI.ruang;
type Tab = "atas" | "iso";
type Sudut = "kiri" | "kanan";

const NAMA_MODE: Record<ModeGambar, string> = { kondisi: T.modeKondisi, hack: T.modeHack, permanen: T.modePermanen };

function Pil({ aktif, onKlik, children }: { aktif: boolean; onKlik: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={aktif}
      onClick={onKlik}
      className={`min-h-sentuh rounded-tombol border px-4 text-kecil font-semibold ${aktif ? "border-utama bg-utama text-putih" : "border-garis bg-putih text-tinta"}`}
    >
      {children}
    </button>
  );
}

export function RuangAnda({ jawaban, denah }: { jawaban: PetaJawaban; denah: HasilDenah }) {
  const letak = letakDariDenah(denah.objek);
  const tidakTerlihat = tidakTerlihatDariDenah(denah.objek);
  const [tab, setTab] = useState<Tab>("iso");
  const [mode, setMode] = useState<ModeGambar>("kondisi");
  const [sudut, setSudut] = useState<Sudut>(() => sudutAwal(letak, tidakTerlihat));
  const [semua, setSemua] = useState(false);
  const tersedia = modeTersedia(jawaban, denah.varianShower);
  const aktif = tersedia.includes(mode) ? mode : "kondisi";
  const catatanMode =
    tersedia.length > 1 ? T.catatanPenyesuaian : !perluPenyesuaianShower(jawaban) ? T.tidakAdaPenyesuaian : T.tidakAdaGambarShower;

  return (
    <section className="mt-6" aria-labelledby="ruang-anda">
      <h2 id="ruang-anda" className="text-subjudul">
        {T.judul}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={T.judul}>
        <Pil aktif={tab === "iso"} onKlik={() => setTab("iso")}>
          {T.tabIsometrik}
        </Pil>
        <Pil aktif={tab === "atas"} onKlik={() => setTab("atas")}>
          {T.tabTampakAtas}
        </Pil>
      </div>

      <div className="kartu mt-3">
        {tab === "iso" ? (
          <div role="img" aria-label={T.altIsometrik}>
            <PratinjauRuangIso3D
              letak={letak}
              sudutAktif={{ x: sudut }}
              varianShower={denah.varianShower}
              jenisKloset={denah.jenisKloset}
              varianPintu={denah.varianPintu}
              tidakTerlihat={tidakTerlihat}
              modeShower={aktif}
              tampilkanSemua={semua}
              kelas="h-96 w-full max-w-md"
            />
          </div>
        ) : (
          <DenahTampakAtas letak={letak} tidakTerlihat={tidakTerlihat} label={T.altTampakAtas} />
        )}
        {tab === "iso" && (
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="tombol-tipis" onClick={() => setSudut(sudut === "kanan" ? "kiri" : "kanan")}>
              {T.putar}
            </button>
            <button type="button" className="tombol-tipis" aria-pressed={semua} onClick={() => setSemua(!semua)}>
              {semua ? T.sembunyikanLagi : T.tampilkanSemua}
            </button>
          </div>
        )}
      </div>

      {tab === "iso" && (
        <fieldset className="mt-3">
          <legend className="label-mikro">{T.modeJudul}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["kondisi", "hack", "permanen"] as const).map((m) => (
              <button
                key={m}
                type="button"
                disabled={!tersedia.includes(m)}
                aria-pressed={aktif === m}
                onClick={() => setMode(m)}
                className={`min-h-sentuh rounded-tombol border px-4 text-kecil font-semibold disabled:opacity-50 ${aktif === m ? "border-utama bg-utama text-putih" : "border-garis bg-putih text-tinta"}`}
              >
                {NAMA_MODE[m]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-kecil text-redup">{catatanMode}</p>
        </fieldset>
      )}
      <p className="mt-2 text-kecil text-redup">{T.catatan}</p>
      <p className="mt-1 text-kecil text-info">✦ {T.dariFoto}</p>
    </section>
  );
}
