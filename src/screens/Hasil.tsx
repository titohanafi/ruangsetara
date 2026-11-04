import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { butirHasil, ringkas, type Butir } from "../domain/asesmen";
import { BERGAMBAR_TETAP } from "../domain/bergambarTetap";
import type { HasilDenah } from "../domain/denahPindai";
import { ringkasModifikasi } from "../domain/modifikasi";
import { cariArea, HASIL, isi, PERTANYAAN, UI } from "../domain/konten";
import { useStore } from "../state/store";

const T = UI.hasil;
// Dimuat hanya bila ada hasil baca denah: gambar dan tabel ukurannya tidak ikut dimuat di halaman lain.
const GambarModifikasiKartu = lazy(() => import("../components/GambarModifikasiKartu").then((m) => ({ default: m.GambarModifikasiKartu })));
const GambarRuangTetapKartu = lazy(() => import("../components/GambarRuangTetapKartu").then((m) => ({ default: m.GambarRuangTetapKartu })));
const RingkasanModifikasi = lazy(() => import("../components/RingkasanModifikasi").then((m) => ({ default: m.RingkasanModifikasi })));
const KATEGORI_D = HASIL.kategori.find((k) => k.nilai === "D");

function Teks({ judul, teks }: { judul: string; teks: string | null }) {
  if (!teks) return null;
  return (
    <div className="mt-3">
      <h4 className="label-mikro">{judul}</h4>
      <p className="mt-1 whitespace-pre-line">{teks}</p>
    </div>
  );
}

function KartuButir({
  b,
  nomor,
  catatan,
  temuan,
  denah,
  gambarTetap,
  areaId,
}: {
  b: Butir;
  nomor: number;
  catatan?: string;
  temuan?: string;
  denah?: HasilDenah;
  /** Dapur, kamar tidur, mobilitas: gambar contoh tata letak tetap (tanpa baca denah). */
  gambarTetap?: boolean;
  areaId?: string;
}) {
  const { pertanyaan: p } = b;
  const belum = b.status === "belum";
  return (
    <li className="kartu">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-kecil text-redup">{String(nomor).padStart(2, "0")}</span>
        <h3 className="text-lg font-semibold">{p.elemen}</h3>
        {b.jawaban.sumber === "foto" && (
          <span className="rounded-full bg-info-muda px-2.5 py-0.5 text-mikro font-semibold text-info">✦ {T.dariFoto}</span>
        )}
      </div>
      {b.jawaban.alasan && b.jawaban.sumber === "foto" && (
        <p className="mt-1 text-kecil text-redup">
          {UI.tanya.alasanFoto}
          {b.jawaban.alasan}
        </p>
      )}
      {temuan?.trim() && (
        <p className="mt-1 text-kecil">
          <span className="font-semibold">{UI.hasil.temuanAnda}</span>
          {temuan.trim()}
        </p>
      )}
      {belum && catatan && (
        <p className="mt-1 text-kecil text-redup">
          {UI.hasil.catatanFoto}
          {catatan}
        </p>
      )}
      {belum ? (
        <div className="mt-3 rounded-tombol bg-draf-muda p-3 text-kecil">
          <p className="font-semibold">{KATEGORI_D?.status ?? T.belumPastiJudul}</p>
          {KATEGORI_D && <p className="mt-1">{KATEGORI_D.makna}</p>}
          {KATEGORI_D && <p className="mt-1">{KATEGORI_D.tindak_lanjut}</p>}
          <p className="mt-1">{p.cara_verifikasi}</p>
        </div>
      ) : (
        <>
          <Teks judul={T.praktis} teks={p.hack} />
          <Teks judul={T.modifikasi} teks={p.modifikasi} />
          {denah && (
            <Suspense fallback={null}>
              <GambarModifikasiKartu id={p.id} denah={denah} />
            </Suspense>
          )}
          {gambarTetap && areaId && (
            <Suspense fallback={null}>
              <GambarRuangTetapKartu areaId={areaId} id={p.id} />
            </Suspense>
          )}
        </>
      )}
    </li>
  );
}

export function HasilScreen() {
  const { state, kirim } = useStore();
  const pindah = useNavigate();
  const [pilihanModifikasi, setPilihanModifikasi] = useState<string | undefined>(undefined);
  const area = cariArea(state.areaId);
  if (!area) return null;
  const daftar = PERTANYAAN[area.id].pertanyaan;
  const r = ringkas(daftar, state.jawaban);
  const semua = butirHasil(daftar, state.jawaban);
  const perlu = semua.filter((b) => b.status !== "sesuai");
  // Gambar per pertanyaan hanya untuk kamar mandi yang tata letaknya terbaca dan pertanyaan yang dijawab Tidak.
  const digambar = new Set(
    area.id === "kamar-mandi" && state.denah?.kamarMandi
      ? ringkasModifikasi(daftar, state.jawaban, state.denah).digambar.map((p) => p.id)
      : [],
  );

  const aktifModifikasi =
    pilihanModifikasi && perlu.some((b) => b.pertanyaan.id === pilihanModifikasi) ? pilihanModifikasi : perlu[0]?.pertanyaan.id;
  const mati = new Set([...digambar].filter((id) => id !== aktifModifikasi));
  const gantiModifikasi = (id: string) => setPilihanModifikasi(id);

  const ubah = (id: string) => {
    kirim({ jenis: "ke_pertanyaan", indeks: daftar.findIndex((p) => p.id === id) });
    pindah("/pertanyaan");
  };

  return (
    <Layout langkah={4} label={T.label}>
      <h1 className="mt-2 text-judul">{area.nama}</h1>
      <p className="mt-3 text-redup">{T.prioritas}</p>

      <div className="kartu mt-6">
        <p className="text-4xl font-bold">{isi(T.ringkas, { n: r.penyesuaian, total: r.total })}</p>
        <p className="font-semibold">{T.ringkasLabel}</p>
      </div>

      <p className="mt-4 rounded-kartu bg-draf-muda p-3 text-kecil text-draf">{T.draf}</p>
      {r.dariFoto > 0 && <p className="mt-3 rounded-kartu bg-info-muda p-3 text-kecil text-info">{T.aturanFoto}</p>}

      {state.fotos.length > 0 && (
        <section className="mt-6" aria-labelledby="foto-hasil">
          <h2 id="foto-hasil" className="text-subjudul">
            {T.fotoJudul}
          </h2>
          <ul className="mt-2 flex gap-2 overflow-x-auto">
            {state.fotos.map((f, i) => (
              <li key={f.id} className="shrink-0">
                <img src={f.url} alt={isi(UI.foto.alt, { n: i + 1 })} className="h-24 w-24 rounded-xl border border-garis object-cover" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {area.id === "kamar-mandi" && state.denah?.kamarMandi && digambar.size > 0 && (
        <Suspense fallback={null}>
          <RingkasanModifikasi jawaban={state.jawaban} denah={state.denah} mati={mati} />
        </Suspense>
      )}

      {perlu.length > 0 && (
        <fieldset className="mt-6">
          <legend className="label-mikro">{T.pilihRekomendasi}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {perlu.map((b, i) => (
              <label
                key={b.pertanyaan.id}
                className={`relative flex min-h-sentuh min-w-[44px] cursor-pointer items-center justify-center rounded-tombol border px-3 text-kecil font-semibold focus-within:ring-2 focus-within:ring-utama ${b.pertanyaan.id === aktifModifikasi ? "border-utama bg-utama text-putih" : "border-garis bg-putih text-tinta"}`}
              >
                <input
                  type="radio"
                  name="rekomendasi"
                  className="sr-only"
                  aria-label={`${i + 1}. ${b.pertanyaan.elemen}`}
                  checked={b.pertanyaan.id === aktifModifikasi}
                  onChange={() => gantiModifikasi(b.pertanyaan.id)}
                />
                <span aria-hidden="true">{i + 1}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {perlu.length === 0 ? (
        <div className="kartu mt-6">
          <h2 className="text-subjudul">{T.tidakAda}</h2>
          <p className="mt-1 text-redup">{T.tidakAdaIsi}</p>
        </div>
      ) : (
        <ol className="mt-6 space-y-4">
          {perlu.map(
            (b, i) =>
              b.pertanyaan.id === aktifModifikasi && (
                <KartuButir
                  key={b.pertanyaan.id}
                  b={b}
                  nomor={i + 1}
                  catatan={state.catatanFoto[b.pertanyaan.id]}
                  temuan={state.temuan[b.pertanyaan.id]}
                  denah={digambar.has(b.pertanyaan.id) ? (state.denah ?? undefined) : undefined}
                  gambarTetap={BERGAMBAR_TETAP[area.id]?.has(b.pertanyaan.id) ?? false}
                  areaId={area.id}
                />
              ),
          )}
        </ol>
      )}

      <details className="mt-6 rounded-kartu border border-garis bg-putih p-4">
        <summary className="font-semibold">{isi(T.tinjau, { n: daftar.length })}</summary>
        <ul className="mt-3 divide-y divide-garis">
          {daftar.map((p) => {
            const j = state.jawaban[p.id];
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-2">
                <span className="min-w-0 flex-1">
                  {p.pertanyaan} <strong>{j ? UI.tanya[j.nilai] : UI.tanya.belumDijawab}</strong>
                  {j?.sumber === "foto" && <span className="ml-1 text-kecil text-info">✦ {T.dariFoto}</span>}
                  {state.temuan[p.id]?.trim() && (
                    <span className="mt-1 block text-kecil text-redup">
                      {T.temuanAnda}
                      {state.temuan[p.id].trim()}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className="tanpa-cetak min-h-sentuh px-2 text-kecil font-semibold text-utama underline"
                  onClick={() => ubah(p.id)}
                >
                  {UI.tanya.ubah}
                </button>
              </li>
            );
          })}
        </ul>
      </details>

      <p className="mt-6 text-kecil text-redup">{T.sumber}</p>

      <div className="tanpa-cetak mt-6 flex flex-wrap gap-3 border-t border-garis pt-5">
        <button type="button" className="tombol-tipis" onClick={() => window.print()}>
          {T.cetak}
        </button>
        <button
          type="button"
          className="tombol-utama"
          onClick={() => {
            kirim({ jenis: "area_lain" });
            pindah("/prioritas");
          }}
        >
          {T.areaLain}
        </button>
      </div>
    </Layout>
  );
}
