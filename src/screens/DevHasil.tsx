// Jalan pintas pengembangan (#/dev/hasil): langsung ke halaman hasil (kamar mandi, atau ?area=dapur) dengan foto contoh dan jawaban tiruan.
// Hanya terpasang saat `npm run dev` dengan VITE_PINDAI_MOCK=true (lihat App.tsx), jadi tidak ada di situs live.
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { DENAH_DAPUR_TIRUAN } from "../domain/denahDapur";
import { DENAH_KAMAR_TIDUR_TIRUAN } from "../domain/denahKamarTidur";
import { DENAH_MOBILITAS_TIRUAN } from "../domain/denahMobilitas";
import { DENAH_TIRUAN } from "../domain/denahPindai";
import { aturanFoto, cariArea, PERTANYAAN, UI } from "../domain/konten";
import { isiDariFoto } from "../domain/pindai";
import { analisisFoto } from "../lib/analisis";
import { kecilkanFoto } from "../lib/foto";
import { useStore } from "../state/store";

const T = UI.dev;
const AREA_BAWAAN = "kamar-mandi";

export function DevHasilScreen() {
  const { kirim } = useStore();
  const pindah = useNavigate();
  const [pesan, setPesan] = useState<string | null>(null);
  const jalan = useRef(false);
  // Area dari alamat: #/dev/hasil?area=dapur (bawaan kamar mandi).
  const [params] = useSearchParams();
  const AREA = params.get("area") ?? AREA_BAWAAN;

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
      // Contoh: semua pertanyaan dijawab Tidak supaya semua gambar modifikasi bisa dicoba.
      const semuaTidak = Object.fromEntries(daftar.map((p) => [p.id, { nilai: "tidak" as const, sumber: "pengguna" as const }]));
      const { jawaban, terisi } = isiDariFoto(daftar, aturanFoto(AREA), hasil, semuaTidak);
      kirim({ jenis: "selesai_baca", jawaban, terisi, total: daftar.length, bukanRuangan: !hasil.ruang_sesuai });
      if (AREA === AREA_BAWAAN) kirim({ jenis: "selesai_denah", denah: DENAH_TIRUAN });
      if (AREA === "dapur") kirim({ jenis: "selesai_denah_dapur", denah: DENAH_DAPUR_TIRUAN });
      if (AREA === "kamar-tidur") kirim({ jenis: "selesai_denah_kamar_tidur", denah: DENAH_KAMAR_TIDUR_TIRUAN });
      if (AREA === "mobilitas") kirim({ jenis: "selesai_denah_mobilitas", denah: DENAH_MOBILITAS_TIRUAN });
      kirim({ jenis: "pilih_aktivitas", aktivitas: area.aktivitas[0] });
      pindah("/hasil", { replace: true });
    })().catch(() => setPesan(T.gagal));
  }, [AREA, kirim, pindah]);

  return (
    <Layout langkah={4} label="Dev">
      <p role="status" className="mt-6">
        {pesan ?? T.memuat}
      </p>
    </Layout>
  );
}
