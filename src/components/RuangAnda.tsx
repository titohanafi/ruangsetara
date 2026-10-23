import { useState } from "react";
import { letakDariDenah, tidakTerlihatDariDenah, type HasilDenah } from "../domain/denahPindai";
import { UI } from "../domain/konten";
import { sudutAwal } from "../domain/ruang";
import { DenahTampakAtas } from "./DenahTampakAtas";
import { PratinjauRuangIso3D } from "./PratinjauRuangIso3D";

const T = UI.ruang;
type Tab = "atas" | "iso";
type Sudut = "kiri" | "kanan";

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

/** Kondisi ruang sekarang (dari foto), isometrik dan tampak atas. Gambar "setelah modifikasi" ada di kartu tiap pertanyaan dan di ringkasan akhir. */
export function RuangAnda({ denah }: { denah: HasilDenah }) {
  const letak = letakDariDenah(denah.objek);
  const tidakTerlihat = tidakTerlihatDariDenah(denah.objek);
  const [tab, setTab] = useState<Tab>("iso");
  const [sudut, setSudut] = useState<Sudut>(() => sudutAwal(letak, tidakTerlihat));
  const [semua, setSemua] = useState(false);

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
      <p className="mt-2 text-kecil text-redup">{T.catatanKondisi}</p>
      <p className="mt-1 text-kecil text-info">✦ {T.dariFoto}</p>
    </section>
  );
}
