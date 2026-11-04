import { useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { aturanFoto, cariArea, isi, PERTANYAAN, UI } from "../domain/konten";
import { isiDariFoto, MAKS_FOTO } from "../domain/pindai";
import { analisisFoto, GalatAnalisis } from "../lib/analisis";
import { bacaDenah } from "../lib/denah";
import { bacaDenahDapur } from "../lib/denahDapur";
import { bacaDenahKamarTidur } from "../lib/denahKamarTidur";
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
  const tahapUji = bisaDibaca && area?.foto_teruji === false && area.id !== "dapur";
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
    // Kamar mandi: foto pertama juga dibaca untuk gambar ruang. Berjalan bersamaan dan tidak boleh menggagalkan pembacaan checklist.
    const denah = area.id === "kamar-mandi" ? bacaDenah(state.fotos[0].url) : Promise.resolve(null);
    // Dapur: foto pertama juga dibaca untuk benda yang digambar (hanya yang terlihat); gagal berarti gambar ruang tidak dibuat.
    const denahDapur = area.id === "dapur" ? bacaDenahDapur(state.fotos[0].url) : Promise.resolve(null);
    const denahKamarTidur = area.id === "kamar-tidur" ? bacaDenahKamarTidur(state.fotos[0].url) : Promise.resolve(null);
    try {
      const hasil = await analisisFoto(
        state.fotos.map((f) => f.url),
        area.id,
      );
      kirim({ jenis: "selesai_denah", denah: await denah });
      kirim({ jenis: "selesai_denah_dapur", denah: await denahDapur });
      kirim({ jenis: "selesai_denah_kamar_tidur", denah: await denahKamarTidur });
      const daftar = PERTANYAAN[area.id].pertanyaan;
      const { jawaban, terisi, catatan } = isiDariFoto(daftar, aturanFoto(area.id), hasil, state.jawaban);
      kirim({ jenis: "selesai_baca", jawaban, terisi, total: daftar.length, bukanRuangan: !hasil.ruang_sesuai, catatan });
    } catch (e) {
      kirim({ jenis: "gagal_baca", sering: e instanceof GalatAnalisis && e.kode === "sering" });
    }
  }

  const selesai = state.baca.status === "selesai";
  return (
    <Layout langkah={2} label={T.label}>
      <h1 className="mt-2 text-judul">{T.judul}</h1>
      <p className="mt-3 text-redup">{T.isi}</p>

      <section className="photo-upload mt-8" aria-labelledby="judul-foto">
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
        {selesai && state.baca.bukanRuangan && <p className="kartu">{isi(T.bukanRuangan, { area: area?.nama.toLowerCase() ?? "" })}</p>}
      </div>

      <div className="tanpa-cetak mt-8 flex flex-wrap items-center gap-3 border-t border-garis pt-5">
        <button type="button" className="tombol-tipis" disabled={membaca} onClick={() => pindah("/prioritas")}>
          {UI.tombol.kembali}
        </button>
        {bisaDibaca && state.fotos.length > 0 && !selesai ? (
          <>
            <button type="button" className="tombol-utama" disabled={membaca} onClick={baca}>
              {T.baca}
            </button>
            <button type="button" className="tombol-tipis" disabled={membaca} onClick={() => pindah("/pertanyaan")}>
              {T.lewati}
            </button>
          </>
        ) : (
          <button type="button" className="tombol-utama" disabled={!area} onClick={() => pindah("/pertanyaan")}>
            {state.fotos.length === 0 || !bisaDibaca || selesai ? UI.tombol.lanjut : T.lanjutTanpaBaca}
          </button>
        )}
        {!area && <span className="text-kecil text-redup">{T.wajibFotoArea}</span>}
        <span className="ml-auto text-kecil text-redup">{UI.tanpaAkun}</span>
      </div>
    </Layout>
  );
}
