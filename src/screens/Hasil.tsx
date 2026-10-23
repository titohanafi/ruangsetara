import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { butirHasil, ringkas, type Butir } from "../domain/asesmen";
import { cariArea, HASIL, isi, PERTANYAAN, UI } from "../domain/konten";
import { useStore } from "../state/store";

const T = UI.hasil;
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

function KartuButir({ b, nomor }: { b: Butir; nomor: number }) {
  const { pertanyaan: p } = b;
  const belum = b.status === "belum";
  return (
    <li className="kartu">
      <div className="flex flex-wrap items-center gap-2">
        <span className="label-mikro">
          {String(nomor).padStart(2, "0")} · {p.id} · {p.elemen}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-mikro font-semibold ${belum ? "bg-draf-muda text-draf" : "bg-perhatian-muda text-perhatian"}`}
        >
          {belum ? T.jawabanBelum : T.jawabanTidak}
        </span>
        {b.jawaban.sumber === "foto" && (
          <span className="rounded-full bg-info-muda px-2.5 py-0.5 text-mikro font-semibold text-info">✦ {T.dariFoto}</span>
        )}
      </div>
      <h3 className="mt-2 text-lg font-semibold">{p.pertanyaan}</h3>
      {b.jawaban.alasan && b.jawaban.sumber === "foto" && (
        <p className="mt-1 text-kecil text-redup">
          {UI.tanya.alasanFoto}
          {b.jawaban.alasan}
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
          {p.referensi_rekomendasi.length > 0 && (
            <div className="mt-3">
              <h4 className="label-mikro">{T.rujukan}</h4>
              <ul className="mt-1 list-disc pl-5 text-kecil text-redup">
                {p.referensi_rekomendasi.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </li>
  );
}

export function HasilScreen() {
  const { state, kirim } = useStore();
  const pindah = useNavigate();
  const area = cariArea(state.areaId);
  if (!area) return null;
  const daftar = PERTANYAAN[area.id].pertanyaan;
  const r = ringkas(daftar, state.jawaban);
  const semua = butirHasil(daftar, state.jawaban);
  const perlu = semua.filter((b) => b.status !== "sesuai");

  const ubah = (id: string) => {
    kirim({ jenis: "ke_pertanyaan", indeks: daftar.findIndex((p) => p.id === id) });
    pindah("/pertanyaan");
  };

  return (
    <Layout langkah={4} label={T.label}>
      <h1 className="mt-2 text-judul">{area.nama}</h1>
      <h2 className="mt-1 text-subjudul">{T.judul}</h2>
      {state.aktivitas && <p className="mt-3 text-redup">{isi(T.prioritas, { aktivitas: state.aktivitas.toLowerCase() })}</p>}

      <div className="kartu mt-6">
        <p className="text-4xl font-bold">{isi(T.ringkas, { n: r.penyesuaian, total: r.total })}</p>
        <p className="font-semibold">{T.ringkasLabel}</p>
        <p className="mt-2 text-kecil text-redup">{isi(T.ringkasSisa, { n: r.sesuai })}</p>
        {r.belum > 0 && <p className="text-kecil text-redup">{isi(T.ringkasBelum, { n: r.belum })}</p>}
      </div>

      <p className="mt-4 rounded-kartu bg-draf-muda p-3 text-kecil text-draf">{T.draf}</p>
      {r.dariFoto > 0 && <p className="mt-3 rounded-kartu bg-info-muda p-3 text-kecil text-info">{T.aturanFoto}</p>}
      {HASIL.aturan_penting && (r.belum > 0 || r.dariFoto > 0) && <p className="mt-3 text-kecil text-redup">{HASIL.aturan_penting}</p>}

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
          <p className="mt-2 text-kecil text-redup">{T.fotoCatatan}</p>
        </section>
      )}

      {perlu.length === 0 ? (
        <div className="kartu mt-6">
          <h2 className="text-subjudul">{T.tidakAda}</h2>
          <p className="mt-1 text-redup">{T.tidakAdaIsi}</p>
        </div>
      ) : (
        <ol className="mt-6 space-y-4">
          {perlu.map((b, i) => (
            <KartuButir key={b.pertanyaan.id} b={b} nomor={i + 1} />
          ))}
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
            pindah("/");
          }}
        >
          {T.areaLain}
        </button>
      </div>
    </Layout>
  );
}
