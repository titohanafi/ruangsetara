import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { cariArea, isi, PERTANYAAN, UI } from "../domain/konten";
import { useStore } from "../state/store";

const T = UI.prioritas;

export function PrioritasScreen() {
  const { state, kirim } = useStore();
  const pindah = useNavigate();
  const area = cariArea(state.areaId);
  if (!area) return null;
  const daftar = PERTANYAAN[area.id].pertanyaan;

  function mulai() {
    // Selalu mulai dari pertanyaan pertama supaya jawaban yang terisi dari foto ikut ditinjau pengguna.
    kirim({ jenis: "ke_pertanyaan", indeks: 0 });
    pindah("/pertanyaan");
  }

  return (
    <Layout langkah={2} label={T.label}>
      <h1 className="mt-2 text-judul">{T.judul}</h1>
      <p className="mt-3 text-redup">{T.isi}</p>

      <div className="kartu mt-6">
        <p className="font-semibold">
          <span aria-hidden>{area.ikon} </span>
          {area.nama}
        </p>
        <p className="text-kecil text-redup">{area.deskripsi}</p>
        <p className="mt-1 text-kecil font-semibold text-utama">{isi(T.pertanyaanJumlah, { n: daftar.length })}</p>
        <button type="button" className="mt-2 min-h-sentuh text-kecil font-semibold text-utama underline" onClick={() => pindah("/")}>
          {T.ubahArea}
        </button>
      </div>

      <fieldset className="mt-6">
        <legend className="font-semibold">{T.aktivitasTanya}</legend>
        <p className="text-kecil text-redup">{T.aktivitasBantu}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {area.aktivitas.map((a) => (
            <label
              key={a}
              className={`flex min-h-sentuh cursor-pointer items-center gap-3 rounded-kartu border p-4 ${
                state.aktivitas === a ? "border-utama bg-utama-muda" : "border-garis bg-putih"
              }`}
            >
              <input
                type="radio"
                name="aktivitas"
                className="h-5 w-5 accent-utama"
                checked={state.aktivitas === a}
                onChange={() => kirim({ jenis: "pilih_aktivitas", aktivitas: a })}
              />
              {a}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="tanpa-cetak mt-8 flex flex-wrap items-center gap-3 border-t border-garis pt-5">
        <button type="button" className="tombol-tipis" onClick={() => pindah("/profil")}>
          {UI.tombol.kembali}
        </button>
        <button type="button" className="tombol-utama" disabled={!state.aktivitas} onClick={mulai}>
          {T.lanjut}
        </button>
      </div>
    </Layout>
  );
}
