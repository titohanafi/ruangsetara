// Jalan pintas pengembangan (#/dev/hasil): langsung ke halaman hasil kamar mandi dengan foto contoh dan jawaban tiruan.
// Hanya terpasang saat `npm run dev` dengan VITE_PINDAI_MOCK=true (lihat App.tsx), jadi tidak ada di situs live.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { aturanFoto, cariArea, PERTANYAAN, UI } from "../domain/konten";
import { isiDariFoto } from "../domain/pindai";
import { analisisFoto } from "../lib/analisis";
import { kecilkanFoto } from "../lib/foto";
import { useStore } from "../state/store";

const T = UI.dev;
const AREA = "kamar-mandi";

export function DevHasilScreen() {
  const { kirim } = useStore();
  const pindah = useNavigate();
  const [pesan, setPesan] = useState<string | null>(null);
  const jalan = useRef(false);

  useEffect(() => {
    // StrictMode menjalankan efek dua kali; cukup sekali supaya foto tidak ganda.
    if (jalan.current) return;
    jalan.current = true;
    (async () => {
      const area = cariArea(AREA);
      if (!area) return setPesan(T.gagal);
      const res = await fetch("/dev/mock-foto.jpg");
      if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) return setPesan(T.fotoHilang);
      const url = await kecilkanFoto(await res.blob());
      kirim({ jenis: "ulang" });
      kirim({ jenis: "pilih_area", areaId: AREA });
      kirim({ jenis: "tambah_foto", foto: { id: "dev-foto", url } });
      const daftar = PERTANYAAN[AREA].pertanyaan;
      const hasil = await analisisFoto([url], AREA);
      // Contoh: perlengkapan mandi (M-07) dijawab Tidak supaya gambar penyesuaian shower bisa dicoba.
      const { jawaban, terisi } = isiDariFoto(daftar, aturanFoto(AREA), hasil, { "M-07": { nilai: "tidak", sumber: "pengguna" } });
      kirim({ jenis: "selesai_baca", jawaban, terisi, total: daftar.length, bukanRuangan: !hasil.ruang_sesuai });
      kirim({ jenis: "pilih_aktivitas", aktivitas: area.aktivitas[0] });
      pindah("/hasil", { replace: true });
    })().catch(() => setPesan(T.gagal));
  }, [kirim, pindah]);

  return (
    <Layout langkah={4} label="Dev">
      <p role="status" className="mt-6">
        {pesan ?? T.memuat}
      </p>
    </Layout>
  );
}
