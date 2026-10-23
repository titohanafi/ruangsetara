import { useState } from "react";
import type { PetaJawaban } from "../domain/asesmen";
import { letakDariDenah, tidakTerlihatDariDenah, type HasilDenah } from "../domain/denahPindai";
import { isi, PERTANYAAN, UI } from "../domain/konten";
import { BERGAMBAR } from "../domain/gambarModifikasi";
import { PERTANYAAN_SHOWER, ringkasModifikasi, type ModeRuang } from "../domain/modifikasi";
import { sudutAwal } from "../domain/ruang";
import { DenahTampakAtas } from "./DenahTampakAtas";
import { bendaTersembunyi, PratinjauRuangIso3D } from "./PratinjauRuangIso3D";

const T = UI.ruang;
type Tab = "atas" | "iso";
type Sudut = "kiri" | "kanan";

const NAMA_MODE: Record<ModeRuang, string> = { kondisi: T.modeKondisi, modifikasi: T.modeModifikasi };
const daftarNama = (daftar: { elemen: string | null; id: string }[]): string => daftar.map((p) => p.elemen ?? p.id).join(", ");

function Pil({ aktif, onKlik, children, mati = false }: { aktif: boolean; onKlik: () => void; children: string; mati?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={aktif}
      disabled={mati}
      onClick={onKlik}
      className={`min-h-sentuh rounded-tombol border px-4 text-kecil font-semibold disabled:opacity-50 ${aktif ? "border-utama bg-utama text-putih" : "border-garis bg-putih text-tinta"}`}
    >
      {children}
    </button>
  );
}

export function RuangAnda({ jawaban, denah }: { jawaban: PetaJawaban; denah: HasilDenah }) {
  const letak = letakDariDenah(denah.objek);
  const tidakTerlihat = tidakTerlihatDariDenah(denah.objek);
  const [tab, setTab] = useState<Tab>("iso");
  const [mode, setMode] = useState<ModeRuang>("kondisi");
  const [sudut, setSudut] = useState<Sudut>(() => sudutAwal(letak, tidakTerlihat));
  const [semua, setSemua] = useState(false);
  const ringkas = ringkasModifikasi(PERTANYAAN["kamar-mandi"].pertanyaan, jawaban, denah);
  const adaModifikasi = ringkas.digambar.length > 0;
  const aktif: ModeRuang = adaModifikasi ? mode : "kondisi";
  const modifikasi = aktif === "modifikasi" ? ringkas.digambar.map((p) => p.id) : [];
  // Gambar yang bendanya ada di dinding yang tidak digambar dari sudut ini (kecuali bila semua benda ditampilkan).
  const sembunyi = semua ? [] : bendaTersembunyi(letak, sudut, tidakTerlihat);
  const dariSudut = ringkas.digambar.filter((p) => {
    const perlu = p.id === PERTANYAAN_SHOWER ? (["area_mandi"] as const) : (BERGAMBAR[p.id] ?? []);
    return perlu.length > 0 && perlu.every((o) => sembunyi.includes(o) || tidakTerlihat.includes(o));
  });

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
              modeShower={modifikasi.includes(PERTANYAAN_SHOWER) ? "permanen" : "kondisi"}
              modifikasi={modifikasi}
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
            {(["kondisi", "modifikasi"] as const).map((m) => (
              <Pil key={m} aktif={aktif === m} mati={m === "modifikasi" && !adaModifikasi} onKlik={() => setMode(m)}>
                {NAMA_MODE[m]}
              </Pil>
            ))}
          </div>
          {!adaModifikasi && <p className="mt-2 text-kecil text-redup">{T.tidakAdaModifikasi}</p>}
          {adaModifikasi && <p className="mt-2 text-kecil text-redup">{isi(T.digambar, { daftar: daftarNama(ringkas.digambar) })}</p>}
          {aktif === "modifikasi" && <p className="mt-1 text-kecil text-redup">{T.legenda}</p>}
          {aktif === "modifikasi" && dariSudut.length > 0 && (
            <p className="mt-1 text-kecil text-redup">{isi(T.tersembunyiSudut, { daftar: daftarNama(dariSudut) })}</p>
          )}
          {ringkas.bendaTakTerlihat.length > 0 && (
            <p className="mt-1 text-kecil text-redup">{isi(T.bendaTakTerlihat, { daftar: daftarNama(ringkas.bendaTakTerlihat) })}</p>
          )}
          {ringkas.belumDigambar.length > 0 && (
            <p className="mt-1 text-kecil text-redup">{isi(T.belumDigambar, { daftar: daftarNama(ringkas.belumDigambar) })}</p>
          )}
        </fieldset>
      )}
      <p className="mt-2 text-kecil text-redup">{T.catatan}</p>
      <p className="mt-1 text-kecil text-info">✦ {T.dariFoto}</p>
    </section>
  );
}
