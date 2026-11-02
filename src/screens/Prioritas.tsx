import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { cariArea, DAFTAR_AREA, isi, PERTANYAAN, UI } from "../domain/konten";
import { useStore } from "../state/store";

const T = UI.prioritas;
export function PrioritasScreen() {
  const { state, kirim } = useStore();
  const pindah = useNavigate();
  const area = cariArea(state.areaId);
  return (
    <Layout langkah={1} label={T.label}>
      <h1 className="mt-2 text-judul">{T.judul}</h1>
      <p className="mt-3 text-redup">{T.isi}</p>
      <div className="theme-grid">
        {DAFTAR_AREA.map((a) => (
          <button type="button" key={a.id} className={`theme-card ${state.areaId === a.id ? "selected" : ""}`} aria-pressed={state.areaId === a.id} onClick={() => kirim({ jenis: "pilih_area", areaId: a.id })}>
            <span className="theme-symbol" aria-hidden>{a.ikon}</span>
            <strong>{a.nama}</strong><p>{a.deskripsi}</p>
            <small>{isi(T.pertanyaanJumlah, { n: PERTANYAAN[a.id].pertanyaan.length })}</small>
          </button>
        ))}
      </div>
      {area && <div className="mt-6">
        <label className="block text-kecil font-semibold" htmlFor="aktivitas">{T.aktivitasTanya}</label>
        <select id="aktivitas" value={state.aktivitas ?? ""} onChange={(e) => kirim({ jenis: "pilih_aktivitas", aktivitas: e.target.value })}>
          <option value="" disabled>{UI.profil.pilih}</option>
          {area.aktivitas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <p className="text-kecil text-redup">{T.aktivitasBantu}</p>
      </div>}
      <div className="tanpa-cetak mt-8 flex flex-wrap items-center gap-3 border-t border-garis pt-5">
        <button type="button" className="tombol-tipis" onClick={() => pindah("/")}>{UI.tombol.kembali}</button>
        <button type="button" className="tombol-utama" disabled={!area || !state.aktivitas} onClick={() => { kirim({ jenis: "ke_pertanyaan", indeks: 0 }); pindah("/foto"); }}>{T.lanjut}</button>
      </div>
    </Layout>
  );
}
