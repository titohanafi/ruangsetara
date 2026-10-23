import { useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { aturanFoto, cariArea, DAFTAR_AREA, isi, PERTANYAAN, UI } from "../domain/konten";
import { isiDariFoto, MAKS_FOTO } from "../domain/pindai";
import { analisisFoto, GalatAnalisis } from "../lib/analisis";
import { kecilkanFoto } from "../lib/foto";
import { useStore } from "../state/store";

const T = UI.foto;

function idBaru(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function FotoScreen() {
  const { state, kirim } = useStore();
  const pindah = useNavigate();
  const [pesan, setPesan] = useState<string | null>(null);
  const berkasRef = useRef<HTMLInputElement>(null);
  const kameraRef = useRef<HTMLInputElement>(null);
  const area = cariArea(state.areaId);
  const bisaDibaca = area?.bisa_dipindai === true;
  const tahapUji = bisaDibaca && area?.foto_teruji === false;
  const penuh = state.fotos.length >= MAKS_FOTO;
  const membaca = state.baca.status === "membaca";

  async function tambah(e: ChangeEvent<HTMLInputElement>) {
    const berkas = [...(e.target.files ?? [])].slice(0, MAKS_FOTO - state.fotos.length);
    e.target.value = "";
    setPesan(null);
    for (const b of berkas) {
      try {
        kirim({ jenis: "tambah_foto", foto: { id: idBaru(), url: await kecilkanFoto(b) } });
      } catch {
        setPesan(T.gagalBaca);
      }
    }
  }

  async function baca() {
    if (!area) return;
    kirim({ jenis: "mulai_baca" });
    try {
      const hasil = await analisisFoto(
        state.fotos.map((f) => f.url),
        area.id,
      );
      const daftar = PERTANYAAN[area.id].pertanyaan;
      const { jawaban, terisi } = isiDariFoto(daftar, aturanFoto(area.id), hasil, state.jawaban);
      kirim({ jenis: "selesai_baca", jawaban, terisi, total: daftar.length, bukanRuangan: !hasil.ruang_sesuai });
    } catch (e) {
      kirim({ jenis: "gagal_baca", sering: e instanceof GalatAnalisis && e.kode === "sering" });
    }
  }

  const selesai = state.baca.status === "selesai";
  return (
    <Layout langkah={0} label={T.label}>
      <h1 className="mt-2 text-judul">{T.judul}</h1>
      <p className="mt-3 text-redup">{T.isi}</p>

      <fieldset className="mt-8">
        <legend className="font-semibold">{T.areaTanya}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {DAFTAR_AREA.map((a) => (
            <label
              key={a.id}
              className={`flex min-h-sentuh cursor-pointer items-start gap-3 rounded-kartu border p-4 ${
                state.areaId === a.id ? "border-utama bg-utama-muda" : "border-garis bg-putih"
              }`}
            >
              <input
                type="radio"
                name="area"
                className="mt-1 h-5 w-5 accent-utama"
                checked={state.areaId === a.id}
                onChange={() => kirim({ jenis: "pilih_area", areaId: a.id })}
              />
              <span>
                <span className="block font-semibold">
                  <span aria-hidden>{a.ikon} </span>
                  {a.nama}
                </span>
                <span className="mt-0.5 block text-kecil text-redup">{a.foto_teruji ? T.areaDipindai : T.areaUji}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <section className="mt-8" aria-labelledby="judul-foto">
        <h2 id="judul-foto" className="text-subjudul">
          {T.label}
        </h2>
        <p className="mt-2 text-kecil text-redup">{T.tips}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="tombol-tipis" disabled={penuh || membaca} onClick={() => berkasRef.current?.click()}>
            {T.unggah}
          </button>
          <button type="button" className="tombol-tipis" disabled={penuh || membaca} onClick={() => kameraRef.current?.click()}>
            {T.kamera}
          </button>
          <input
            ref={berkasRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={tambah}
            data-testid="input-foto"
          />
          <input ref={kameraRef} type="file" accept="image/*" capture="environment" hidden onChange={tambah} />
        </div>
        <p className="mt-2 text-kecil text-redup">
          {T.format} · {penuh ? T.batas : `${state.fotos.length}/${MAKS_FOTO}`}
        </p>
        <p role="status" className="mt-2 text-kecil text-bahaya">
          {pesan}
        </p>
        {state.fotos.length > 0 && (
          <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {state.fotos.map((f, i) => (
              <li key={f.id} className="relative">
                <img
                  src={f.url}
                  alt={isi(T.alt, { n: i + 1 })}
                  className="aspect-square w-full rounded-xl border border-garis object-cover"
                />
                <button
                  type="button"
                  aria-label={isi(T.hapus, { n: i + 1 })}
                  disabled={membaca}
                  onClick={() => kirim({ jenis: "hapus_foto", id: f.id })}
                  className="absolute right-1 top-1 inline-flex h-sentuh w-sentuh items-center justify-center rounded-full bg-putih/90 text-lg font-bold shadow-kartu"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {tahapUji && <p className="mt-6 rounded-kartu bg-info-muda p-4 text-kecil text-info">{T.disclaimerArea}</p>}

      {bisaDibaca && state.fotos.length > 0 && !selesai && (
        <p className="mt-6 rounded-kartu bg-info-muda p-4 text-kecil text-info">{T.persetujuan}</p>
      )}

      <div aria-live="polite" className="mt-6">
        {membaca && <p className="kartu">{T.membaca}</p>}
        {state.baca.status === "sering" && <p className="rounded-kartu bg-perhatian-muda p-4 text-perhatian">{T.terlaluSering}</p>}
        {state.baca.status === "gagal" && <p className="rounded-kartu bg-perhatian-muda p-4 text-perhatian">{T.gagalAnalisis}</p>}
        {selesai && (
          <div className="kartu">
            <h2 className="text-subjudul">{T.hasilJudul}</h2>
            {state.baca.bukanRuangan ? (
              <p className="mt-2">{isi(T.bukanRuangan, { area: area?.nama.toLowerCase() ?? "" })}</p>
            ) : (
              <>
                <p className="mt-2 font-semibold">{isi(T.hasilTerisi, { n: state.baca.terisi, total: state.baca.total })}</p>
                <p className="mt-1 text-redup">{isi(T.hasilSisa, { n: state.baca.total - state.baca.terisi })}</p>
                <p className="mt-2 text-kecil text-redup">{UI.tanya.dariFotoCatatan}</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="tanpa-cetak mt-8 flex flex-wrap items-center gap-3 border-t border-garis pt-5">
        {bisaDibaca && state.fotos.length > 0 && !selesai ? (
          <>
            <button type="button" className="tombol-utama" disabled={membaca} onClick={baca}>
              {T.baca}
            </button>
            <button type="button" className="tombol-tipis" disabled={membaca} onClick={() => pindah("/profil")}>
              {T.lewati}
            </button>
          </>
        ) : (
          <button type="button" className="tombol-utama" disabled={!area} onClick={() => pindah("/profil")}>
            {state.fotos.length === 0 || !bisaDibaca || selesai ? UI.tombol.lanjut : T.lanjutTanpaBaca}
          </button>
        )}
        {!area && <span className="text-kecil text-redup">{T.wajibFotoArea}</span>}
        <span className="ml-auto text-kecil text-redup">{UI.tanpaAkun}</span>
      </div>
    </Layout>
  );
}
