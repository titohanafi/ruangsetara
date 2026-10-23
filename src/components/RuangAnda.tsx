import { useState } from "react";
import type { PetaJawaban } from "../domain/asesmen";
import { POSISI_BAWAAN, type LetakDenah, type ObjekDenah } from "../domain/denahPindai";
import type { ModeGambar } from "../domain/gambarShower";
import { modeTersedia } from "../domain/ruang";
import { UI } from "../domain/konten";
import { DenahTampakAtas } from "./DenahTampakAtas";
import { PratinjauRuangIso3D } from "./PratinjauRuangIso3D";

const T = UI.ruang;
type Tab = "atas" | "iso";
type Sudut = "kiri" | "kanan";

const NAMA_MODE: Record<ModeGambar, string> = { kondisi: T.modeKondisi, hack: T.modeHack, permanen: T.modePermanen };

// Tata letak sementara: belum dibaca dari foto (menunggu M3), jadi memakai posisi bawaan.
const letakBawaan = (id: ObjekDenah): LetakDenah => POSISI_BAWAAN[id];

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

export function RuangAnda({ jawaban }: { jawaban: PetaJawaban }) {
  const [tab, setTab] = useState<Tab>("iso");
  const [mode, setMode] = useState<ModeGambar>("kondisi");
  const [sudut, setSudut] = useState<Sudut>("kanan");
  const [semua, setSemua] = useState(false);
  const tersedia = modeTersedia(jawaban);
  const aktif = tersedia.includes(mode) ? mode : "kondisi";

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
              letak={letakBawaan}
              sudutAktif={{ x: sudut }}
              varianShower="hand_shower_gantung"
              modeShower={aktif}
              tampilkanSemua={semua}
              kelas="h-96 w-full max-w-md"
            />
          </div>
        ) : (
          <DenahTampakAtas letak={letakBawaan} label={T.altTampakAtas} />
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
          <p className="mt-2 text-kecil text-redup">{tersedia.length > 1 ? T.catatanPenyesuaian : T.tidakAdaPenyesuaian}</p>
        </fieldset>
      )}
      <p className="mt-2 text-kecil text-redup">{T.catatan}</p>
      <p className="mt-1 text-kecil text-draf">{T.catatanTiruan}</p>
    </section>
  );
}
