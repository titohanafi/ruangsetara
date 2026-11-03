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
    <Layout langkah={0} label={T.label}>
      <h1 className="mt-2 text-judul">{T.judul}</h1>
      <p className="mt-3 text-redup">{PROFIL.pengantar}</p>
      <p className="mt-4 rounded-kartu bg-utama-muda p-3 text-kecil">{PROFIL.catatan_caregiver}</p>

      <div className="profile-fields mt-6 grid gap-5 sm:grid-cols-2">
        {PROFIL.pertanyaan.map((p) => (
          <fieldset key={p.id} className="min-w-0">
            <legend className="text-lg font-semibold">{p.pertanyaan}</legend>
            <div className="mt-3 grid gap-2">
              {p.pilihan.map((o) => (
                <label key={o} className={`flex min-h-sentuh cursor-pointer items-center gap-3 rounded-tombol p-3 ${state.profil[p.id] === o ? "bg-utama-muda" : "bg-transparent"}`}>
                  <input type="radio" name={`profil-${p.id}`} value={o} checked={state.profil[p.id] === o} onChange={() => kirim({ jenis: "isi_profil", id: p.id, nilai: o })} className="h-4 w-4 shrink-0 accent-utama" />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="tanpa-cetak mt-8 flex flex-wrap items-center gap-3 border-t border-garis pt-5">

        <button type="button" className="tombol-utama" disabled={!lengkap} onClick={() => pindah("/prioritas")}>
          {T.lanjut}
        </button>
        <span className="ml-auto text-kecil text-redup">{UI.tanpaAkun}</span>
      </div>
    </Layout>
  );
}
