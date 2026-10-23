import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { PROFIL, UI } from "../domain/konten";
import { useStore } from "../state/store";

const T = UI.profil;

export function ProfilScreen() {
  const { state, kirim } = useStore();
  const pindah = useNavigate();
  const lengkap = PROFIL.pertanyaan.every((p) => state.profil[p.id]);
  return (
    <Layout langkah={1} label={T.label}>
      <h1 className="mt-2 text-judul">{T.judul}</h1>
      <p className="mt-3 text-redup">{PROFIL.pengantar}</p>
      <p className="mt-4 rounded-kartu bg-utama-muda p-3 text-kecil">{PROFIL.catatan_caregiver}</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {PROFIL.pertanyaan.map((p) => (
          <div key={p.id}>
            <label htmlFor={`profil-${p.id}`} className="block text-kecil font-semibold">
              {p.pertanyaan}
            </label>
            <select
              id={`profil-${p.id}`}
              value={state.profil[p.id] ?? ""}
              onChange={(e) => kirim({ jenis: "isi_profil", id: p.id, nilai: e.target.value })}
              className="mt-1.5 min-h-sentuh w-full rounded-tombol border border-garisKontrol bg-putih px-3"
            >
              <option value="" disabled>
                {T.pilih}
              </option>
              {p.pilihan.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="tanpa-cetak mt-8 flex flex-wrap items-center gap-3 border-t border-garis pt-5">
        <button type="button" className="tombol-tipis" onClick={() => pindah("/")}>
          {UI.tombol.kembali}
        </button>
        <button type="button" className="tombol-utama" disabled={!lengkap} onClick={() => pindah("/prioritas")}>
          {T.lanjut}
        </button>
        <span className="ml-auto text-kecil text-redup">{UI.tanpaAkun}</span>
      </div>
    </Layout>
  );
}
