import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { cariArea, isi, PERTANYAAN, UI } from "../domain/konten";
import { ringkas, type Nilai } from "../domain/asesmen";
import { useStore } from "../state/store";

const T = UI.tanya;
const PILIHAN: { nilai: Nilai; label: string }[] = [
  { nilai: "ya", label: T.ya },
  { nilai: "tidak", label: T.tidak },
  { nilai: "belum", label: T.belum },
];

export function PertanyaanScreen() {
  const { state, kirim } = useStore();
  const pindah = useNavigate();
  const area = cariArea(state.areaId);
  if (!area) return null;
  const daftar = PERTANYAAN[area.id].pertanyaan;
  const i = Math.min(state.indeks, daftar.length - 1);
  const p = daftar[i];
  const j = state.jawaban[p.id];
  const terakhir = i === daftar.length - 1;
  const { terjawab } = ringkas(daftar, state.jawaban);

  const mundur = () => (i > 0 ? kirim({ jenis: "ke_pertanyaan", indeks: i - 1 }) : pindah("/prioritas"));
  const maju = () => (terakhir ? pindah("/hasil") : kirim({ jenis: "ke_pertanyaan", indeks: i + 1 }));

  return (
    <Layout langkah={3} label={T.label}>
      <h1 className="mt-2 text-judul">{T.judul}</h1>
      <p className="mt-3 text-redup">{T.isi}</p>

      <div className="mt-6 flex items-center justify-between text-kecil text-redup">
        <span className="label-mikro">{isi(T.nomor, { n: i + 1, total: daftar.length })}</span>
        <span>{isi(T.terjawab, { n: terjawab })}</span>
      </div>

      <section className="kartu mt-2" aria-labelledby="pertanyaan-id">
        <p className="label-mikro">
          {p.id} · {p.elemen}
        </p>
        <h2 id="pertanyaan-id" className="mt-2 text-subjudul">
          {p.pertanyaan}
        </h2>

        <fieldset className="mt-5" aria-labelledby="pertanyaan-id">
          <div className="grid grid-cols-3 gap-3">
            {PILIHAN.map((o) => (
              <label
                key={o.nilai}
                className={`flex min-h-sentuh cursor-pointer items-center justify-center rounded-tombol border px-2 py-2 text-center font-semibold ${
                  j?.nilai === o.nilai ? "border-utama bg-utama text-putih" : "border-garisKontrol bg-putih hover:bg-utama-muda"
                }`}
              >
                <input
                  type="radio"
                  name={`jawab-${p.id}`}
                  className="sr-only"
                  checked={j?.nilai === o.nilai}
                  onChange={() => kirim({ jenis: "jawab", id: p.id, nilai: o.nilai })}
                />
                {o.label}
              </label>
            ))}
          </div>
          <p className="mt-2 text-kecil text-redup">{T.belumTahuBantu}</p>
        </fieldset>

        {j?.sumber === "foto" && (
          <div className="mt-4 rounded-kartu bg-info-muda p-3 text-kecil text-info" role="status">
            <p className="font-semibold">✦ {T.dariFoto}</p>
            {j.alasan && (
              <p className="mt-1">
                {T.alasanFoto}
                {j.alasan}
              </p>
            )}
            <p className="mt-1">{T.dariFotoCatatan}</p>
          </div>
        )}

        <div className="mt-5 space-y-2">
          <details className="rounded-tombol border border-garis p-3">
            <summary className="font-semibold">{T.cara}</summary>
            <p className="mt-2 text-redup">{p.cara_verifikasi}</p>
          </details>
          <details className="rounded-tombol border border-garis p-3">
            <summary className="font-semibold">{T.kondisi}</summary>
            <p className="mt-2 text-redup">{p.indikator}</p>
          </details>
          {p.referensi && (
            <details className="rounded-tombol border border-garis p-3">
              <summary className="font-semibold">{T.referensi}</summary>
              <p className="mt-2 text-redup">{p.referensi}</p>
            </details>
          )}
        </div>
      </section>

      <div className="tanpa-cetak mt-8 flex flex-wrap items-center gap-3 border-t border-garis pt-5">
        <button type="button" className="tombol-tipis" onClick={mundur}>
          {UI.tombol.kembali}
        </button>
        <button type="button" className="tombol-utama" disabled={!j} onClick={maju}>
          {terakhir ? UI.tombol.lihatHasil : UI.tombol.pertanyaanBerikut}
        </button>
        {!j && <span className="text-kecil text-redup">{T.pilihJawaban}</span>}
      </div>
    </Layout>
  );
}
