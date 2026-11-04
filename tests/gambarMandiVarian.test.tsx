import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PratinjauRuangIso3D } from "../src/components/PratinjauRuangIso3D";
import { VARIAN_MANDI } from "../src/domain/bergambar";
import { DENAH_TIRUAN, letakDariDenah } from "../src/domain/denahPindai";
import { PERTANYAAN, UI } from "../src/domain/konten";
import { sudutAwal } from "../src/domain/ruang";

const letak = letakDariDenah(DENAH_TIRUAN.objek);
const sudut = sudutAwal(letak, []);

const gambar = (varian?: "pocket" | "commode" | "bangku" | "baskom", lengkap = false) =>
  renderToStaticMarkup(
    <PratinjauRuangIso3D
      letak={letak}
      sudutAktif={{ x: sudut }}
      varian={varian}
      lengkap={lengkap}
      tampilkanSemua
      tampilkanUkuran
      ukuranAwal={{ lebar: 560, tinggi: 400 }}
    />,
  );

const hijau = (html: string) => (html.match(/stroke-utama/g) ?? []).length;

describe("alternatif dan hack di gambar kamar mandi", () => {
  it("daftar varian merujuk pertanyaan yang ada dan punya teks antarmuka", () => {
    const ada = new Set(PERTANYAAN["kamar-mandi"].pertanyaan.map((p) => p.id));
    const nama: Record<string, string> = UI.ruang.varian;
    for (const [id, daftar] of Object.entries(VARIAN_MANDI)) {
      expect(ada.has(id), id).toBe(true);
      for (const v of daftar) expect(nama[`${id}~${v}`], `${id}~${v}`).toBeTruthy();
    }
  });

  it("kondisi dasar tidak punya bagian hijau, tiap varian menambahnya", () => {
    expect(hijau(gambar())).toBe(0);
    for (const daftar of Object.values(VARIAN_MANDI)) {
      for (const v of daftar) expect(hijau(gambar(v)), v).toBeGreaterThan(0);
    }
  });

  it("varian tidak memuat angka baru", () => {
    for (const daftar of Object.values(VARIAN_MANDI)) {
      for (const v of daftar) expect(gambar(v).match(/>\d[^<]*</g), v).toBeNull();
    }
  });
});

describe("kamar mandi terisi lengkap", () => {
  it("menambah benda tanpa bagian hijau dan tanpa angka", () => {
    const dasar = gambar();
    const lengkap = gambar(undefined, true);
    expect(lengkap.length).toBeGreaterThan(dasar.length);
    expect(hijau(lengkap)).toBe(0);
    expect(lengkap.match(/>\d[^<]*</g)).toBeNull();
  });
});
