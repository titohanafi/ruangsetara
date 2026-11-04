import { describe, expect, it } from "vitest";
import { PERTANYAAN } from "../src/domain/konten";
import { kerangkaPanel } from "../src/domain/gambarShower";
import { KATALOG_OBJEK } from "../src/domain/perabotUmum";

const teksSheet = Object.values(PERTANYAAN)
  .flatMap((a) => a.pertanyaan)
  .map((p) => [p.elemen, p.indikator, p.cara_verifikasi, p.hack, p.modifikasi].join(" "));

describe("katalog objek perabot", () => {
  it("id unik dan setiap objek menghasilkan bentuk yang berhingga", () => {
    expect(new Set(KATALOG_OBJEK.map((o) => o.id)).size).toBe(KATALOG_OBJEK.length);
    for (const o of KATALOG_OBJEK) {
      const bentuk = o.gambar(kerangkaPanel("kanan"));
      expect(bentuk.length, o.id).toBeGreaterThan(0);
      expect(JSON.stringify(bentuk), o.id).not.toMatch(/null|NaN|Infinity/);
      expect(JSON.stringify(o.gambar(kerangkaPanel("kanan"), "aksen")), o.id).toContain('"aksen"');
    }
  });

  it("objek bersumber sheet memang disebut di teks sheet; objek umum tidak mengaku dari sheet", () => {
    for (const o of KATALOG_OBJEK) {
      if (o.sumber === "sheet") expect(o.kata && teksSheet.some((t) => o.kata?.test(t)), o.id).toBeTruthy();
      else expect(o.kata, o.id).toBeUndefined();
    }
  });

  it("semua ruang yang ada punya objek", () => {
    for (const ruang of ["kamar-mandi", "dapur", "kamar-tidur", "mobilitas"] as const) {
      expect(KATALOG_OBJEK.filter((o) => o.ruang.includes(ruang)).length, ruang).toBeGreaterThan(3);
    }
  });

  it("gambar objek tidak memuat teks atau angka", () => {
    for (const o of KATALOG_OBJEK) {
      const jenis = new Set(o.gambar(kerangkaPanel("kanan")).map((p) => p.jenis));
      expect(jenis.has("label"), o.id).toBe(false);
      expect(jenis.has("ukur"), o.id).toBe(false);
    }
  });
});
